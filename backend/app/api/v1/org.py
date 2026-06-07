from __future__ import annotations
"""
组织管理 API - 企业端专用
团队成员管理、角色权限、组织信息、用量总览
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.services.supabase import get_supabase_admin
from app.api.v1.auth import get_current_user

router = APIRouter()


# ─── Schemas ───

class OrgInfo(BaseModel):
    id: str
    name: str
    type: str
    quota_limit: float
    pricing_tier: str
    member_count: int
    created_at: str


class OrgMember(BaseModel):
    id: str
    email: str
    role: str
    name: Optional[str] = ""
    balance: float
    joined_at: str
    status: str = "active"


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "member"  # admin / member / viewer


class UpdateOrgRequest(BaseModel):
    name: Optional[str] = None
    quota_limit: Optional[float] = None


class UpdateMemberRoleRequest(BaseModel):
    role: str  # admin / member / viewer


# ─── Routes ───

@router.get("/info")
async def get_org_info(user: dict = Depends(get_current_user)):
    """获取组织信息"""
    admin = get_supabase_admin()

    # 查用户所属组织
    user_data = admin.table("users").select("org_id, role").eq("id", user["id"]).execute()
    if not user_data.data or not user_data.data[0].get("org_id"):
        raise HTTPException(status_code=404, detail="未加入任何组织")

    org_id = user_data.data[0]["org_id"]

    # 查组织信息
    org = admin.table("organizations").select("*").eq("id", org_id).execute()
    if not org.data:
        raise HTTPException(status_code=404, detail="组织不存在")

    # 统计成员数
    members = admin.table("users").select("id").eq("org_id", org_id).execute()

    org_info = org.data[0]
    return {
        "id": org_info["id"],
        "name": org_info["name"],
        "type": org_info["type"],
        "quota_limit": org_info["quota_limit"],
        "pricing_tier": org_info["pricing_tier"],
        "member_count": len(members.data) if members.data else 0,
        "created_at": org_info.get("created_at", ""),
        "my_role": user_data.data[0]["role"],
    }


@router.get("/members")
async def get_org_members(user: dict = Depends(get_current_user)):
    """获取组织成员列表"""
    admin = get_supabase_admin()

    user_data = admin.table("users").select("org_id").eq("id", user["id"]).execute()
    if not user_data.data or not user_data.data[0].get("org_id"):
        raise HTTPException(status_code=404, detail="未加入任何组织")

    org_id = user_data.data[0]["org_id"]

    members = admin.table("users").select("id, email, role, balance, created_at").eq("org_id", org_id).execute()

    return {
        "members": [
            {
                "id": m["id"],
                "email": m["email"],
                "role": m["role"],
                "balance": float(m.get("balance", 0)),
                "joined_at": m.get("created_at", ""),
                "status": "active",
            }
            for m in (members.data or [])
        ]
    }


@router.post("/invite")
async def invite_member(
    req: InviteMemberRequest,
    user: dict = Depends(get_current_user),
):
    """邀请成员加入组织（MVP：直接将已有用户加入组织）"""
    admin = get_supabase_admin()

    # 检查当前用户是否为管理员
    user_data = admin.table("users").select("org_id, role").eq("id", user["id"]).execute()
    if not user_data.data:
        raise HTTPException(status_code=403, detail="无权限")

    org_id = user_data.data[0]["org_id"]
    if not org_id:
        raise HTTPException(status_code=404, detail="未加入组织")

    # 查找目标用户
    target = admin.table("users").select("id, org_id").eq("email", req.email).execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="该邮箱用户未注册")

    target_user = target.data[0]
    if target_user.get("org_id"):
        raise HTTPException(status_code=400, detail="该用户已加入其他组织")

    # 加入组织
    admin.table("users").update({
        "org_id": org_id,
        "role": req.role,
    }).eq("id", target_user["id"]).execute()

    return {"message": f"已邀请 {req.email} 加入组织", "role": req.role}


@router.delete("/members/{member_id}")
async def remove_member(
    member_id: str,
    user: dict = Depends(get_current_user),
):
    """移除组织成员"""
    admin = get_supabase_admin()

    user_data = admin.table("users").select("org_id, role").eq("id", user["id"]).execute()
    if not user_data.data or user_data.data[0].get("role") not in ("admin", "enterprise"):
        raise HTTPException(status_code=403, detail="需要管理员权限")

    org_id = user_data.data[0]["org_id"]

    # 不能移除自己
    if member_id == user["id"]:
        raise HTTPException(status_code=400, detail="不能移除自己")

    # 验证目标用户属于同一组织
    target = admin.table("users").select("org_id").eq("id", member_id).execute()
    if not target.data or target.data[0].get("org_id") != org_id:
        raise HTTPException(status_code=400, detail="该用户不属于你的组织")

    # 移除（将 org_id 置空）
    admin.table("users").update({"org_id": None}).eq("id", member_id).execute()

    return {"message": "成员已移除"}


@router.patch("/members/{member_id}/role")
async def update_member_role(
    member_id: str,
    req: UpdateMemberRoleRequest,
    user: dict = Depends(get_current_user),
):
    """修改成员角色"""
    admin = get_supabase_admin()

    user_data = admin.table("users").select("org_id, role").eq("id", user["id"]).execute()
    if not user_data.data or user_data.data[0].get("role") not in ("admin", "enterprise"):
        raise HTTPException(status_code=403, detail="需要管理员权限")

    org_id = user_data.data[0]["org_id"]

    target = admin.table("users").select("org_id").eq("id", member_id).execute()
    if not target.data or target.data[0].get("org_id") != org_id:
        raise HTTPException(status_code=400, detail="该用户不属于你的组织")

    admin.table("users").update({"role": req.role}).eq("id", member_id).execute()

    return {"message": f"角色已更新为 {req.role}"}


@router.patch("/info")
async def update_org_info(
    req: UpdateOrgRequest,
    user: dict = Depends(get_current_user),
):
    """更新组织信息"""
    admin = get_supabase_admin()

    user_data = admin.table("users").select("org_id, role").eq("id", user["id"]).execute()
    if not user_data.data or user_data.data[0].get("role") not in ("admin", "enterprise"):
        raise HTTPException(status_code=403, detail="需要管理员权限")

    org_id = user_data.data[0]["org_id"]

    updates = {}
    if req.name:
        updates["name"] = req.name
    if req.quota_limit is not None:
        updates["quota_limit"] = req.quota_limit

    if updates:
        updates["updated_at"] = datetime.utcnow().isoformat()
        admin.table("organizations").update(updates).eq("id", org_id).execute()

    return {"message": "组织信息已更新"}


@router.get("/usage")
async def get_org_usage(user: dict = Depends(get_current_user)):
    """获取组织用量总览"""
    admin = get_supabase_admin()

    user_data = admin.table("users").select("org_id").eq("id", user["id"]).execute()
    if not user_data.data or not user_data.data[0].get("org_id"):
        raise HTTPException(status_code=404, detail="未加入任何组织")

    org_id = user_data.data[0]["org_id"]

    # 获取组织下所有用户 ID
    members = admin.table("users").select("id").eq("org_id", org_id).execute()
    member_ids = [m["id"] for m in (members.data or [])]

    if not member_ids:
        return {"total_tokens": 0, "total_cost": 0, "members_usage": []}

    # 获取近 30 天用量
    from datetime import date, timedelta
    start_date = (date.today() - timedelta(days=30)).isoformat()

    usage_data = admin.table("usage_logs").select(
        "user_id, prompt_tokens, completion_tokens, cost, sell_price, price_tier"
    ).in_("user_id", member_ids).gte("created_at", start_date).execute()

    total_tokens = 0
    total_cost = 0.0
    member_usage: dict = {}

    for log in (usage_data.data or []):
        tokens = (log.get("prompt_tokens", 0) or 0) + (log.get("completion_tokens", 0) or 0)
        cost = float(log.get("sell_price", 0) or 0)

        total_tokens += tokens
        total_cost += cost

        uid = log["user_id"]
        if uid not in member_usage:
            member_usage[uid] = {"tokens": 0, "cost": 0.0, "requests": 0}
        member_usage[uid]["tokens"] += tokens
        member_usage[uid]["cost"] += cost
        member_usage[uid]["requests"] += 1

    # 查成员邮箱用于展示
    members_info = admin.table("users").select("id, email").in_("id", list(member_usage.keys())).execute()
    email_map = {m["id"]: m["email"] for m in (members_info.data or [])}

    members_list = [
        {
            "user_id": uid,
            "email": email_map.get(uid, "unknown"),
            "tokens": data["tokens"],
            "cost": round(data["cost"], 4),
            "requests": data["requests"],
        }
        for uid, data in member_usage.items()
    ]
    members_list.sort(key=lambda x: x["cost"], reverse=True)

    return {
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 4),
        "period": "近30天",
        "members_usage": members_list,
    }
