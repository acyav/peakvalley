from __future__ import annotations
"""
管理后台路由 - 供应商配置 / 平台统计
"""
from fastapi import APIRouter, Depends, HTTPException
from app.api.v1.auth import get_current_user
from app.engines.dispatch import dispatch_engine
from app.engines.pricing import pricing_engine
from app.services.supabase import get_supabase_admin

router = APIRouter()


async def require_admin(user: dict = Depends(get_current_user)):
    """要求管理员权限"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


@router.get("/providers")
async def list_providers(admin: dict = Depends(require_admin)):
    """列出所有供应商配置"""
    models = dispatch_engine.list_available_models()
    return {"providers": models}


@router.get("/stats")
async def get_platform_stats(admin: dict = Depends(require_admin)):
    """平台全局统计"""
    admin_client = get_supabase_admin()

    # 用户数
    users = admin_client.table("users").select("id", count="exact").execute()

    # 今日请求量 (从 usage_logs)
    from datetime import date
    today = date.today().isoformat()
    logs = (
        admin_client.table("usage_logs")
        .select("cost, sell_price, prompt_tokens, completion_tokens, price_tier")
        .gte("created_at", today)
        .execute()
    )

    total_cost = sum(l.get("cost", 0) for l in logs.data)
    total_revenue = sum(l.get("sell_price", 0) for l in logs.data)
    total_tokens = sum(
        l.get("prompt_tokens", 0) + l.get("completion_tokens", 0)
        for l in logs.data
    )

    # 按时段统计
    tier_stats = {}
    for tier in ["peak", "valley", "standard"]:
        tier_logs = [l for l in logs.data if l.get("price_tier") == tier]
        tier_stats[tier] = {
            "requests": len(tier_logs),
            "tokens": sum(
                l.get("prompt_tokens", 0) + l.get("completion_tokens", 0)
                for l in tier_logs
            ),
            "revenue": sum(l.get("sell_price", 0) for l in tier_logs),
        }

    return {
        "total_users": users.count,
        "today": {
            "total_requests": len(logs.data),
            "total_tokens": total_tokens,
            "total_cost": round(total_cost, 4),
            "total_revenue": round(total_revenue, 4),
            "profit": round(total_revenue - total_cost, 4),
            "by_tier": tier_stats,
        },
        "current_tier": pricing_engine.get_current_tier(),
    }
