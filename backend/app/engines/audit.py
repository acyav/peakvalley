from __future__ import annotations
"""
审计日志引擎 - 记录所有 LLM 请求
"""
from datetime import datetime
from app.services.supabase import get_supabase_admin


class AuditLogger:
    """审计日志 - 每笔请求写库"""

    async def log_request(
        self,
        user_id: str,
        model: str,
        provider: str,
        prompt_tokens: int,
        completion_tokens: int,
        tier: str,
        unit_price: float,
        cost: float,
        sell_price: float,
        latency_ms: int | None = None,
        status: str = "success",
        error_message: str | None = None,
    ):
        """写入 usage_logs"""
        admin = get_supabase_admin()
        admin.table("usage_logs").insert({
            "user_id": user_id,
            "model": model,
            "provider": provider,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "price_tier": tier,
            "unit_price": unit_price,
            "cost": cost,
            "sell_price": sell_price,
            "latency_ms": latency_ms,
            "status": status,
            "error_message": error_message,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()


# 全局单例
audit_logger = AuditLogger()
