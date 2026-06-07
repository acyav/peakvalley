from __future__ import annotations
"""计费相关 Schema"""
from pydantic import BaseModel


class UsageResponse(BaseModel):
    date: str
    total_cost: float
    total_tokens: int
    by_tier: dict
    balance: float


class BillingRecordResponse(BaseModel):
    id: str
    period_start: str
    period_end: str
    total_tokens: int
    total_cost: float
    peak_cost: float
    valley_cost: float
    status: str
