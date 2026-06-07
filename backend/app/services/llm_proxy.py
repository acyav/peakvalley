from __future__ import annotations
"""
LLM 代理服务 - OpenAI SDK 兼容的请求转发
所有上游 LLM 统一通过 openai 库发送请求（只需换 base_url + api_key）
"""
from openai import AsyncOpenAI
from app.config import (
    DEEPSEEK_API_KEY, DASHSCOPE_API_KEY, ZHIPU_API_KEY,
    PROVIDER_CONFIGS,
)


def get_client(provider: str) -> AsyncOpenAI:
    """根据 provider 创建 OpenAI 兼容客户端"""
    config = PROVIDER_CONFIGS[provider]
    api_key = {
        "deepseek": DEEPSEEK_API_KEY,
        "qwen": DASHSCOPE_API_KEY,
        "zhipu": ZHIPU_API_KEY,
    }[provider]

    return AsyncOpenAI(
        base_url=config["base_url"],
        api_key=api_key,
        timeout=30.0,
    )


async def proxy_chat_completion(provider: str, payload: dict):
    """
    代理聊天请求到上游 LLM
    payload: 完整的 OpenAI chat completion 请求体
    返回: OpenAI Response 对象
    """
    client = get_client(provider)

    # 提取参数
    model = payload.get("model", "deepseek-chat")
    messages = payload.get("messages", [])
    stream = payload.get("stream", False)
    temperature = payload.get("temperature", 0.7)
    max_tokens = payload.get("max_tokens")

    kwargs = {
        "model": model,
        "messages": messages,
        "stream": stream,
        "temperature": temperature,
    }
    if max_tokens:
        kwargs["max_tokens"] = max_tokens

    response = await client.chat.completions.create(**kwargs)
    return response


async def proxy_chat_completion_stream(provider: str, payload: dict):
    """流式代理 - 返回 async generator"""
    client = get_client(provider)

    model = payload.get("model", "deepseek-chat")
    messages = payload.get("messages", [])
    temperature = payload.get("temperature", 0.7)
    max_tokens = payload.get("max_tokens")

    kwargs = {
        "model": model,
        "messages": messages,
        "stream": True,
        "temperature": temperature,
    }
    if max_tokens:
        kwargs["max_tokens"] = max_tokens

    stream = await client.chat.completions.create(**kwargs)
    return stream
