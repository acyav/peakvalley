from __future__ import annotations
"""
PeakValley 配置中心 - 所有环境变量与常量
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Supabase ───
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")          # anon public key
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # service_role key (后端专用)

# ─── Redis (Upstash) ───
REDIS_URL = os.getenv("REDIS_URL", "")                 # upstash redis url
REDIS_TOKEN = os.getenv("REDIS_TOKEN", "")              # upstash rest token

# ─── LLM Providers ───
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")  # 通义千问
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")          # GLM

# ─── App ───
APP_NAME = "PeakValley API"
APP_VERSION = "0.1.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
API_V1_PREFIX = "/api/v1"

# ─── JWT (Supabase Auth 兼容) ───
JWT_SECRET = os.getenv("JWT_SECRET", SUPABASE_KEY)

# ─── 峰谷定价默认值 ───
DEFAULT_PRICING_RULES = {
    "valley":   {"hours": list(range(22, 24)) + list(range(0, 8)),  "multiplier": 0.5},
    "peak":     {"hours": list(range(10, 18)),                       "multiplier": 1.3},
    "standard": {"hours": list(range(8, 10)) + list(range(18, 22)), "multiplier": 1.0},
}

# ─── Provider 配置 (MVP) ───
PROVIDER_CONFIGS = {
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "models": {
            "deepseek-chat": {
                "input_cost_per_1k": 0.001,   # ¥/1K tokens (成本价)
                "output_cost_per_1k": 0.002,
            },
            "deepseek-reasoner": {
                "input_cost_per_1k": 0.004,
                "output_cost_per_1k": 0.016,
            },
        },
        "priority": 1,
    },
    "qwen": {
        "name": "通义千问",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": {
            "qwen-plus": {
                "input_cost_per_1k": 0.0008,
                "output_cost_per_1k": 0.002,
            },
            "qwen-turbo": {
                "input_cost_per_1k": 0.0003,
                "output_cost_per_1k": 0.0006,
            },
        },
        "priority": 2,
    },
    "zhipu": {
        "name": "智谱 GLM",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "models": {
            "glm-4-flash": {
                "input_cost_per_1k": 0.0001,
                "output_cost_per_1k": 0.0001,
            },
            "glm-4-plus": {
                "input_cost_per_1k": 0.05,
                "output_cost_per_1k": 0.05,
            },
        },
        "priority": 3,
    },
}
