from __future__ import annotations
"""
Rate Limit 中间件 - 基于 Redis 的滑动窗口限流
"""
import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.redis import redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    API 请求限流
    默认：60 RPM (每分钟请求数)
    """

    def __init__(self, app, rpm: int = 60):
        super().__init__(app)
        self.rpm = rpm

    async def dispatch(self, request: Request, call_next):
        # 只限流 gateway 接口
        if "/gateway/" not in request.url.path:
            return await call_next(request)

        # 从 Authorization header 提取用户标识
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            key_id = auth[7:27]  # 取 token 前 20 字符做标识
        else:
            key_id = request.client.host

        # 滑动窗口限流
        now = time.time()
        window_key = f"ratelimit:{key_id}:{int(now // 60)}"

        try:
            count = await redis.incrbyfloat(window_key, 1)
            if count == 1:
                await redis.set(window_key, "1", ex=120)  # 2 分钟过期

            if count > self.rpm:
                raise HTTPException(
                    status_code=429,
                    detail=f"请求频率超限，限制 {self.rpm} RPM，请稍后再试",
                )
        except HTTPException:
            raise
        except Exception:
            # Redis 不可用时放行，不影响核心功能
            pass

        return await call_next(request)
