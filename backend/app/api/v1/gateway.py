from __future__ import annotations
"""
LLM Gateway - 核心路由，OpenAI SDK 100% 兼容
用户只需将 base_url 改为 PeakValley 即可使用
"""
import time
import json
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse, JSONResponse

from app.engines.pricing import pricing_engine
from app.engines.billing import billing_engine
from app.engines.dispatch import dispatch_engine
from app.engines.audit import audit_logger
from app.services.llm_proxy import proxy_chat_completion, proxy_chat_completion_stream
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """
    OpenAI 兼容的 Chat Completions 接口
    完整请求流程：
    1. 验证用户 → 2. 检查余额 → 3. 获取价格 →
    4. 选择供应商 → 5. 转发请求 → 6. 计量计费 → 7. 返回结果
    """
    user_id = user["id"]

    # 解析请求体
    body = await request.json()
    model = body.get("model", "deepseek-chat")
    stream = body.get("stream", False)

    # 1. 检查余额
    has_balance = await billing_engine.check_balance(user_id)
    if not has_balance:
        raise HTTPException(
            status_code=402,
            detail="余额不足，请充值后继续使用。Payment required."
        )

    # 2. 获取当前时段 & 价格
    tier = pricing_engine.get_current_tier()
    multiplier = pricing_engine.get_multiplier(tier)

    # 3. 选择供应商
    provider_info = dispatch_engine.select_provider(model)
    provider = provider_info["provider"]

    # 4. 记录开始时间
    start_time = time.time()

    try:
        if stream:
            # 流式响应
            return await _handle_stream(
                body, user_id, model, provider, tier, start_time
            )
        else:
            # 非流式响应
            return await _handle_sync(
                body, user_id, model, provider, tier, start_time
            )
    except Exception as e:
        # 审计失败请求
        latency_ms = int((time.time() - start_time) * 1000)
        await audit_logger.log_request(
            user_id=user_id,
            model=model,
            provider=provider,
            prompt_tokens=0,
            completion_tokens=0,
            tier=tier,
            unit_price=0,
            cost=0,
            sell_price=0,
            latency_ms=latency_ms,
            status="error",
            error_message=str(e),
        )
        raise HTTPException(status_code=502, detail=f"上游 LLM 请求失败: {str(e)}")


async def _handle_sync(
    body: dict, user_id: str, model: str, provider: str, tier: str, start_time: float
):
    """非流式响应处理"""
    response = await proxy_chat_completion(provider, body)

    # 提取 token 用量
    usage = response.usage
    prompt_tokens = usage.prompt_tokens if usage else 0
    completion_tokens = usage.completion_tokens if usage else 0

    # 计费
    billing = await billing_engine.meter_usage(
        user_id, model, prompt_tokens, completion_tokens, tier
    )

    # 审计
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

    # 在响应中追加峰谷计费信息
    result = response.model_dump()
    result["pv_billing"] = {
        "tier": billing["tier"],
        "multiplier": billing["multiplier"],
        "base_cost": billing["base_cost"],
        "sell_price": billing["sell_price"],
        "remaining_balance": billing["remaining_balance"],
    }

    return JSONResponse(content=result)


async def _handle_stream(
    body: dict, user_id: str, model: str, provider: str, tier: str, start_time: float
):
    """流式响应处理 - SSE 透传"""
    stream = await proxy_chat_completion_stream(provider, body)

    async def generate():
        prompt_tokens = 0
        completion_tokens = 0

        async for chunk in stream:
            # 累计 token (从 stream 的最后一个 chunk 获取)
            if chunk.usage:
                prompt_tokens = chunk.usage.prompt_tokens or 0
                completion_tokens = chunk.usage.completion_tokens or 0

            # 透传 SSE 数据
            data = chunk.model_dump()
            yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

        # 流结束后计费
        if prompt_tokens > 0 or completion_tokens > 0:
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

            # 发送计费信息作为最后一个 SSE 事件
            billing_event = {
                "pv_billing": {
                    "tier": billing["tier"],
                    "multiplier": billing["multiplier"],
                    "base_cost": billing["base_cost"],
                    "sell_price": billing["sell_price"],
                    "remaining_balance": billing["remaining_balance"],
                }
            }
            yield f"data: {json.dumps(billing_event, ensure_ascii=False)}\n\n"

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


@router.get("/models")
async def list_models(user: dict = Depends(get_current_user)):
    """列出所有可用模型 (OpenAI 兼容)"""
    models = dispatch_engine.list_available_models()
    tier = pricing_engine.get_current_tier()
    multiplier = pricing_engine.get_multiplier(tier)

    result = {
        "object": "list",
        "data": [
            {
                "id": m["id"],
                "object": "model",
                "owned_by": m["provider_name"],
                "pricing": {
                    "input_per_1k": round(m["input_cost_per_1k"] * multiplier, 6),
                    "output_per_1k": round(m["output_cost_per_1k"] * multiplier, 6),
                    "current_tier": tier,
                    "multiplier": multiplier,
                },
            }
            for m in models
        ],
    }
    return result
