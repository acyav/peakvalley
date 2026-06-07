from __future__ import annotations
"""
健康检查路由
"""
from fastapi import APIRouter
from app.config import APP_NAME, APP_VERSION

router = APIRouter()


@router.get("/")
async def health_check():
    """服务健康检查"""
    return {
        "status": "ok",
        "service": APP_NAME,
        "version": APP_VERSION,
    }


@router.get("/ready")
async def readiness_check():
    """就绪检查 (含依赖检测)"""
    checks = {"api": True}

    # Supabase 连通性
    try:
        from app.services.supabase import get_supabase
        sb = get_supabase()
        checks["supabase"] = True
    except Exception:
        checks["supabase"] = False

    # Redis 连通性
    try:
        from app.services.redis import redis
        await redis.get("health:check")
        checks["redis"] = True
    except Exception:
        checks["redis"] = False

    all_ok = all(checks.values())
    return {
        "ready": all_ok,
        "checks": checks,
    }
