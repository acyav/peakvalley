from __future__ import annotations
"""
供给端收益与提现 API
供给方（算力节点）的收益查询、提现申请、提现记录
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timedelta

from app.services.supabase import get_supabase_admin
from app.api.v1.auth import get_current_user

router = APIRouter()


# ─── Schemas ───

class WithdrawRequest(BaseModel):
    amount: float
    method: str  # alipay / bank / wechat
    account_info: str  # 收款账号信息


class SupplyAccount(BaseModel):
    total_earned: float
    available_balance: float
    pending_withdrawal: float
    withdrawn: float
    node_count: int
    online_nodes: int


# ─── Routes ───

@router.get("/account")
async def get_supply_account(user: dict = Depends(get_current_user)):
    """获取供给方收益账户概览"""
    admin = get_supabase_admin()
    user_id = user["id"]

    # 查 supply_accounts 表
    try:
        account = admin.table("supply_accounts").select("*").eq("user_id", user_id).execute()
    except Exception:
        account = None

    if not account or not account.data:
        # 供给方账户不存在（表可能未迁移），返回默认数据
        return {
            "total_earned": 0,
            "available_balance": 0,
            "pending_withdrawal": 0,
            "withdrawn": 0,
            "node_count": 0,
            "online_nodes": 0,
        }

    acc = account.data[0]

    # 统计节点数
    try:
        nodes = admin.table("supply_nodes").select("id, status").eq("user_id", user_id).execute()
    except Exception:
        nodes = None
    node_list = (nodes.data if nodes else None) or []
    online = len([n for n in node_list if n.get("status") == "online"])

    return {
        "total_earned": float(acc.get("total_earned", 0)),
        "available_balance": float(acc.get("available_balance", 0)),
        "pending_withdrawal": float(acc.get("pending_withdrawal", 0)),
        "withdrawn": float(acc.get("withdrawn", 0)),
        "node_count": len(node_list),
        "online_nodes": online,
    }


@router.get("/earnings/daily")
async def get_daily_earnings(user: dict = Depends(get_current_user)):
    """获取近 30 天每日收益"""
    admin = get_supabase_admin()
    user_id = user["id"]

    start_date = (date.today() - timedelta(days=30)).isoformat()

    try:
        earnings = admin.table("supply_earnings").select(
            "date, tokens_served, earned, peak_earned, valley_earned, standard_earned"
        ).eq("user_id", user_id).gte("date", start_date).order("date").execute()
    except Exception:
        earnings = None

    return {
        "period": "近30天",
        "daily": (earnings.data if earnings else None) or [],
    }


@router.post("/withdraw")
async def request_withdrawal(
    req: WithdrawRequest,
    user: dict = Depends(get_current_user),
):
    """申请提现"""
    admin = get_supabase_admin()
    user_id = user["id"]

    # 最小提现金额
    if req.amount < 10:
        raise HTTPException(status_code=400, detail="最小提现金额为 ¥10")

    # 检查可用余额
    account = admin.table("supply_accounts").select("available_balance, pending_withdrawal").eq("user_id", user_id).execute()
    if not account.data:
        raise HTTPException(status_code=404, detail="供给方账户不存在")

    available = float(account.data[0]["available_balance"])
    if req.amount > available:
        raise HTTPException(status_code=400, detail=f"可用余额不足（当前可用 ¥{available:.2f}）")

    # 创建提现记录
    admin.table("withdrawals").insert({
        "user_id": user_id,
        "amount": req.amount,
        "method": req.method,
        "account_info": req.account_info,
        "status": "pending",
    }).execute()

    # 冻结金额：可用余额减少，待提现增加
    new_available = available - req.amount
    new_pending = float(account.data[0]["pending_withdrawal"]) + req.amount
    admin.table("supply_accounts").update({
        "available_balance": round(new_available, 4),
        "pending_withdrawal": round(new_pending, 4),
    }).eq("user_id", user_id).execute()

    return {
        "message": "提现申请已提交，预计 1-3 个工作日到账",
        "amount": req.amount,
        "method": req.method,
        "status": "pending",
    }


@router.get("/withdrawals")
async def get_withdrawals(
    limit: int = 20,
    user: dict = Depends(get_current_user),
):
    """获取提现记录"""
    admin = get_supabase_admin()
    user_id = user["id"]

    try:
        records = admin.table("withdrawals").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
    except Exception:
        records = None

    return {
        "records": [
            {
                "id": r["id"],
                "amount": float(r["amount"]),
                "method": r["method"],
                "account_info": r.get("account_info", ""),
                "status": r["status"],
                "created_at": r.get("created_at", ""),
                "processed_at": r.get("processed_at", ""),
                "remark": r.get("remark", ""),
            }
            for r in ((records.data if records else None) or [])
        ]
    }


@router.get("/nodes")
async def get_supply_nodes(user: dict = Depends(get_current_user)):
    """获取供给节点列表"""
    admin = get_supabase_admin()
    user_id = user["id"]

    try:
        nodes = admin.table("supply_nodes").select("*").eq("user_id", user_id).execute()
    except Exception:
        nodes = None

    return {
        "nodes": [
            {
                "id": n["id"],
                "name": n.get("name", "未命名节点"),
                "gpu_model": n.get("gpu_model", "unknown"),
                "status": n.get("status", "offline"),
                "total_uptime_hours": n.get("total_uptime_hours", 0),
                "total_tokens_served": n.get("total_tokens_served", 0),
                "total_earned": float(n.get("total_earned", 0)),
                "last_heartbeat": n.get("last_heartbeat", ""),
            }
            for n in ((nodes.data if nodes else None) or [])
        ]
    }
