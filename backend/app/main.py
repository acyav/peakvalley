from __future__ import annotations
"""
PeakValley FastAPI 主入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, APP_VERSION, API_V1_PREFIX
from app.api.v1 import auth, gateway, billing, pricing, admin, health, chat, org, supply
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.token_counter import TokenCounterMiddleware

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="AI Token 削峰补枯调度平台 API - OpenAI SDK 100% 兼容",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",       # 本地前端
        "http://localhost:3001",       # 本地后端
        "http://127.0.0.1:3000",      # 本地前端 (IP)
        "https://peakvalley.vercel.app",  # 生产前端
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 自定义中间件 ───
app.add_middleware(RateLimitMiddleware, rpm=60)
app.add_middleware(TokenCounterMiddleware)

# ─── 注册路由 ───
app.include_router(health.router, prefix=API_V1_PREFIX, tags=["健康检查"])
app.include_router(auth.router, prefix=f"{API_V1_PREFIX}/auth", tags=["认证"])
app.include_router(gateway.router, prefix=f"{API_V1_PREFIX}/gateway", tags=["LLM Gateway"])
app.include_router(billing.router, prefix=f"{API_V1_PREFIX}/billing", tags=["账单"])
app.include_router(pricing.router, prefix=f"{API_V1_PREFIX}/pricing", tags=["定价"])
app.include_router(admin.router, prefix=f"{API_V1_PREFIX}/admin", tags=["管理后台"])
app.include_router(chat.router, prefix=f"{API_V1_PREFIX}/chat", tags=["在线聊天"])
app.include_router(org.router, prefix=f"{API_V1_PREFIX}/org", tags=["组织管理"])
app.include_router(supply.router, prefix=f"{API_V1_PREFIX}/supply", tags=["供给端"])


@app.get("/")
async def root():
    """根路径重定向到文档"""
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "docs": "/docs",
        "gateway": f"{API_V1_PREFIX}/gateway/chat/completions",
    }
