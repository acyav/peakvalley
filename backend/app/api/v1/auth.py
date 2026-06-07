from __future__ import annotations
"""
认证路由 - Supabase Auth 集成
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase import get_supabase, get_supabase_admin
from app.schemas.auth import (
    RegisterRequest, RegisterResponse,
    LoginRequest, LoginResponse,
    UserResponse,
)

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    验证 JWT Token，返回当前用户信息
    所有需要认证的接口都依赖此函数
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="未提供认证令牌")

    # 使用 admin client (service_role) 验证 token，更可靠
    supabase = get_supabase_admin()

    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="无效的认证令牌")

        return {
            "id": user.user.id,
            "email": user.user.email,
            "role": user.user.user_metadata.get("role", "student"),
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"认证失败: {str(e)}")


@router.post("/register", response_model=RegisterResponse)
async def register(req: RegisterRequest):
    """用户注册 - 使用 Admin API 自动确认邮箱，无需验证邮件"""
    admin = get_supabase_admin()

    try:
        # 使用 admin API 创建用户，自动确认邮箱
        result = admin.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {
                "role": req.role,
                "name": req.name,
            }
        })

        if result.user:
            # 在 users 表创建用户记录
            admin.table("users").insert({
                "id": result.user.id,
                "email": req.email,
                "role": req.role,
                "balance": 10.0,  # 注册赠送 10 元
            }).execute()

            return RegisterResponse(
                user_id=result.user.id,
                email=req.email,
                message="注册成功",
            )
        else:
            raise HTTPException(status_code=400, detail="注册失败")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """用户登录"""
    supabase = get_supabase()

    try:
        result = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })

        return LoginResponse(
            access_token=result.session.access_token,
            token_type="bearer",
            user=UserResponse(
                id=result.user.id,
                email=result.user.email,
                role=result.user.user_metadata.get("role", "student"),
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"登录失败: 邮箱或密码错误")


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
    )
