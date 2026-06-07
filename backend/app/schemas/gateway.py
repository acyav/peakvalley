from __future__ import annotations
"""Gateway 相关 Schema"""
from pydantic import BaseModel


class ChatCompletionRequest(BaseModel):
    """OpenAI 兼容的请求体 (用于文档，实际直接透传)"""
    model: str = "deepseek-chat"
    messages: list[dict]
    temperature: float = 0.7
    max_tokens: int | None = None
    stream: bool = False


class BillingInfo(BaseModel):
    """峰谷计费信息 (追加到响应中)"""
    tier: str
    multiplier: float
    base_cost: float
    sell_price: float
    remaining_balance: float
