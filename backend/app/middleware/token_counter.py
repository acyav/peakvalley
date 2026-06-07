from __future__ import annotations
"""
Token Counter 中间件 - 统计请求延迟
"""
import time
from starlette.middleware.base import BaseHTTPMiddleware


class TokenCounterMiddleware(BaseHTTPMiddleware):
    """记录请求延迟，用于后续优化"""

    async def dispatch(self, request, call_next):
        start = time.time()
        response = await call_next(request)
        latency = time.time() - start

        response.headers["X-Process-Time"] = f"{latency:.3f}s"
        return response
