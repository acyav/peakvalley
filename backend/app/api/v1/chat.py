from __future__ import annotations
"""
聊天接口 - 前端对话专用（非 OpenAI 兼容格式）
直接对接 LLM Gateway，返回 SSE 流式响应
"""
import time
import json
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from app.engines.pricing import pricing_engine
from app.engines.billing import billing_engine
from app.engines.dispatch import dispatch_engine
from app.engines.audit import audit_logger
from app.services.llm_proxy import proxy_chat_completion_stream
from app.api.v1.auth import get_current_user

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "deepseek-chat"
    temperature: float = 0.7
    max_tokens: Optional[int] = None


# 模型别名映射（前端友好名 → 实际模型ID）
MODEL_ALIASES = {
    "deepseek-chat": "deepseek-chat",
    "glm-4": "glm-4-flash",
    "glm-4-flash": "glm-4-flash",
    "qwen-max": "qwen-plus",
    "qwen-plus": "qwen-plus",
}


@router.post("/chat")
async def chat(
    req: ChatRequest,
    user: dict = Depends(get_current_user),
):
    """
    前端聊天接口 - 流式 SSE
    流程：验证 → 查余额 → 获取价格 → 选供应商 → 流式转发 → 计费
    """
    user_id = user["id"]

    # 模型别名转换
    model = MODEL_ALIASES.get(req.model, req.model)

    # 1. 检查余额
    has_balance = await billing_engine.check_balance(user_id)
    if not has_balance:
        raise HTTPException(status_code=402, detail="余额不足，请充值后继续使用")

    # 2. 获取当前时段 & 价格
    tier = pricing_engine.get_current_tier()

    # 3. 选择供应商
    provider_info = dispatch_engine.select_provider(model)
    provider = provider_info["provider"]

    # 4. 构造 OpenAI 格式的请求体
    body = {
        "model": model,
        "messages": [{"role": m.role, "content": m.content} for m in req.messages],
        "stream": True,
        "temperature": req.temperature,
    }
    if req.max_tokens:
        body["max_tokens"] = req.max_tokens

    start_time = time.time()

    try:
        stream = await proxy_chat_completion_stream(provider, body)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM 请求失败: {str(e)}")

    async def generate():
        prompt_tokens = 0
        completion_tokens = 0

        try:
            async for chunk in stream:
                # 从流中提取 token 用量
                if chunk.usage:
                    prompt_tokens = chunk.usage.prompt_tokens or 0
                    completion_tokens = chunk.usage.completion_tokens or 0

                # 提取增量内容
                delta = ""
                if chunk.choices and len(chunk.choices) > 0:
                    delta_content = chunk.choices[0].delta
                    if delta_content and delta_content.content:
                        delta = delta_content.content

                # 以 JSON 格式发送每个增量
                data = {"delta": delta, "model": model}
                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
        except Exception as e:
            error_data = {"error": str(e)}
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
            return

        # 流结束后计费
        if prompt_tokens > 0 or completion_tokens > 0:
            try:
                billing = await billing_engine.meter_usage(
                    user_id, model, prompt_tokens, completion_tokens, tier
                )
                latency_ms = int((time.time() - start_time) * 1000)

                await audit_logger.log_request(
                    user_id=user_id,
                    model=model,
                    provider=provider,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    tier=tier,
                    unit_price=billing["base_cost"] / max((prompt_tokens + completion_tokens) / 1000, 0.001),
                    cost=billing["base_cost"],
                    sell_price=billing["sell_price"],
                    latency_ms=latency_ms,
                )

                # 发送计费摘要
                billing_event = {
                    "billing": {
                        "tier": billing["tier"],
                        "multiplier": billing["multiplier"],
                        "cost": round(billing["sell_price"], 6),
                        "tokens": prompt_tokens + completion_tokens,
                        "remaining_balance": billing["remaining_balance"],
                    }
                }
                yield f"data: {json.dumps(billing_event, ensure_ascii=False)}\n\n"
            except Exception:
                pass  # 计费失败不影响用户体验

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
