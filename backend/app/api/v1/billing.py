from __future__ import annotations
"""
账单路由 - 用量查询 / 账单记录
"""
from fastapi import APIRouter, Depends
from app.engines.billing import billing_engine
from app.api.v1.auth import get_current_user
from app.services.supabase import get_supabase_admin

router = APIRouter()


@router.get("/usage")
async def get_usage(user: dict = Depends(get_current_user)):
    """获取今日实时用量"""
    usage = await billing_engine.get_today_usage(user["id"])
    balance = await billing_engine.get_balance(user["id"])

    return {
        **usage,
        "balance": balance,
    }


@router.get("/records")
async def get_billing_records(
    user: dict = Depends(get_current_user),
    limit: int = 30,
):
    """获取历史账单记录"""
    admin = get_supabase_admin()
    result = (
        admin.table("billing_records")
        .select("*")
        .eq("user_id", user["id"])
        .order("period_start", desc=True)
        .limit(limit)
        .execute()
    )
    return {"records": result.data}


@router.get("/balance")
async def get_balance(user: dict = Depends(get_current_user)):
    """获取当前余额"""
    balance = await billing_engine.get_balance(user["id"])
    return {"balance": balance, "currency": "CNY"}
