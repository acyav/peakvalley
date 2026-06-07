# PeakValley (峰谷算力)

AI Token 削峰补枯调度平台 MVP — 像电力调度一样管理 AI 算力

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 15 + TypeScript + Tailwind CSS + Recharts |
| 后端 | FastAPI + Python 3.8+ |
| 数据库 | Supabase (PostgreSQL + Auth + RLS) |
| 缓存 | Upstash Redis (Serverless, HTTP REST) |
| 部署 | Vercel (前端) + Railway (后端) |

## 快速开始

### 1. 配置环境变量

**后端** `backend/.env`：
```bash
# 在 Supabase 后台获取
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...anon key
SUPABASE_SERVICE_KEY=eyJ...service_role key

# 在 Upstash 注册获取
REDIS_URL=https://useful-duck-xxx.upstash.io
REDIS_TOKEN=AEJ...

# LLM API Keys
DEEPSEEK_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...    # 通义千问
ZHIPU_API_KEY=...             # GLM
```

**前端** `frontend/.env.local`：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase/migrations/001_init.sql`

### 3. 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# 文档: http://localhost:8000/docs
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
# 访问: http://localhost:3000
```

## 项目结构

```
PeakValley/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI 入口
│       ├── config.py            # 环境变量 & 常量
│       ├── api/v1/             # API 路由
│       │   ├── gateway.py      # ← 核心！LLM 代理
│       │   ├── auth.py         # 登录/注册
│       │   ├── billing.py      # 账单
│       │   ├── pricing.py      # 价格
│       │   └── admin.py        # 管理后台
│       ├── engines/            # 核心引擎
│       │   ├── pricing.py      # 动态定价
│       │   ├── billing.py      # 实时计费
│       │   ├── dispatch.py     # 智能路由
│       │   └── audit.py       # 审计日志
│       └── services/           # 外部服务
│           ├── supabase.py     # Supabase 客户端
│           ├── redis.py        # Upstash Redis
│           └── llm_proxy.py   # LLM 请求转发
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx            # 落地页 (含价格时钟)
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   └── dashboard/
│       │       ├── page.tsx        # 仪表盘 (核心演示)
│       │       ├── usage/page.tsx
│       │       ├── billing/page.tsx
│       │       ├── api-keys/page.tsx
│       │       └── pricing/page.tsx
│       └── lib/
│           ├── supabase.ts        # Supabase 客户端
│           └── api.ts             # API 请求封装
│
└── supabase/migrations/
    └── 001_init.sql              # 数据库初始化
```

## 使用方式 (用户侧)

只需改一行代码，现有的 OpenAI SDK 代码无需改动：

```python
from openai import OpenAI

# 改这一行 base_url 即可
client = OpenAI(
    base_url="http://localhost:8000/api/v1/gateway",
    api_key="pv-xxxx"   # 在控制台生成
)

# 其余代码完全不变
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "你好"}]
)
```

## 核心特性

- **峰谷定价**：低谷 0.5x / 平段 1.0x / 高峰 1.3x
- **OpenAI 兼容**：改 `base_url` 即可，零迁移成本
- **多供应商**：DeepSeek / 通义千问 / GLM 自动路由
- **实时计费**：Redis INCR 计量，毫秒级响应
- **审计日志**：每笔请求可回溯

## 部署

### 后端 (Railway)
```bash
# 连接 GitHub 仓库，设置环境变量，自动部署
```

### 前端 (Vercel)
```bash
# 导入 GitHub 仓库，设置 NEXT_PUBLIC_ 环境变量
```

## 作者

- 宋钰（中国人民大学 商学院 会计学 2024 级）
- 团队成员：会计学 x2 + 公共管理 x1 + 艺术 x1
