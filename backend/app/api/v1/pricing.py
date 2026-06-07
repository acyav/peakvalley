from __future__ import annotations
"""
定价路由 - 当前价格 / 24h 价格表
"""
from fastapi import APIRouter
from app.engines.pricing import pricing_engine

router = APIRouter()


@router.get("/current")
async def get_current_pricing():
    """获取当前时段价格信息"""
    tier = pricing_engine.get_current_tier()
    multiplier = pricing_engine.get_multiplier(tier)
    schedule = pricing_engine.get_schedule_24h()

    return {
        "current_tier": tier,
        "current_multiplier": multiplier,
        "tier_label": {
            "peak": "高峰",
            "valley": "低谷",
            "standard": "平段",
        }.get(tier, tier),
        "models": {
            m["id"]: {
                "provider": m["provider_name"],
                "input_per_1k": round(m["input_cost_per_1k"] * multiplier, 6),
                "output_per_1k": round(m["output_cost_per_1k"] * multiplier, 6),
                "base_input_per_1k": m["input_cost_per_1k"],
                "base_output_per_1k": m["output_cost_per_1k"],
            }
            for m in pricing_engine._find_all_models()
        },
    }


@router.get("/schedule")
async def get_pricing_schedule():
    """获取 24 小时价格时间表"""
    schedule = pricing_engine.get_schedule_24h()
    return {
        "schedule": schedule,
        "rules": {
            "peak": {"multiplier": 1.3, "label": "高峰", "hours": "10:00-18:00"},
            "valley": {"multiplier": 0.5, "label": "低谷", "hours": "22:00-08:00"},
            "standard": {"multiplier": 1.0, "label": "平段", "hours": "08:00-10:00, 18:00-22:00"},
        },
    }
