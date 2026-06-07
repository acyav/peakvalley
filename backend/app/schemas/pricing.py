from __future__ import annotations
"""定价相关 Schema"""
from pydantic import BaseModel


class PricingCurrentResponse(BaseModel):
    current_tier: str
    current_multiplier: float
    tier_label: str
    models: dict


class PricingScheduleResponse(BaseModel):
    schedule: list[dict]
    rules: dict
