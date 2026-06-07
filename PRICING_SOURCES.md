# PeakValley 定价数据资源汇总

## 一、可直接接入的开源数据源

### 1. LiteLLM 官方定价数据库（推荐）
- **GitHub**: https://github.com/BerriAI/litellm
- **JSON API**: `https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json`
- **说明**: 覆盖 2600+ 模型、140+ 提供商的输入/输出 Token 单价、上下文窗口、功能特性
- **字段示例**:
  ```json
  {
    "gpt-4o": {
      "input_cost_per_token": 0.000005,
      "output_cost_per_token": 0.000015,
      "max_input_tokens": 128000,
      "litellm_provider": "openai",
      "mode": "chat"
    }
  }
  ```
- **接入方式**: 每日/每周 GitHub Actions 拉取更新到本地数据库

### 2. token-costs（npm 包 + JSON API）
- **GitHub**: https://github.com/mikkotikkanen/token-costs
- **说明**: 每日自动更新的 LLM 定价数据，可作为 npm 依赖或 REST API 调用
- **特点**: 专为开发者设计，支持按 token 数精确计算成本

### 3. llm-pricing（中文社区）
- **GitHub**: https://github.com/jry21223/llm-pricing
- **说明**: 大模型 API 价格对比，每日自动更新
- **特点**: 中文维护，更适合国内模型（GLM、文心、通义等）

---

## 二、在线比价网站（人工参考）

| 网站 | 地址 | 特点 |
|------|------|------|
| TokenCost | https://tokencost.app/pricing | 可视化比价，支持按场景筛选 |
| LLM Pricing | https://llmpricing.dev/ | 覆盖 80+ 模型，含上下文长度对比 |
| CostGoat | https://costgoat.com/compare/llm-api | 含质量评分与性价比排名 |
| LiteLLM Model Catalog | https://models.litellm.ai/ | 最全面的模型目录，含定价 |

---

## 三、国内主流模型官方定价（截至 2026.06）

| 模型 | 提供商 | 输入 (¥/M tokens) | 输出 (¥/M tokens) | 备注 |
|------|--------|-------------------|-------------------|------|
| GLM-4 Flash | 智谱 AI | 免费 | 免费 | 轻量级，适合高并发 |
| GLM-4 | 智谱 AI | ~5 | ~15 | 旗舰模型 |
| DeepSeek-V3 | DeepSeek | ~2 | ~8 | 性价比极高 |
| DeepSeek-R1 | DeepSeek | ~4 | ~16 | 推理模型 |
| 通义千问-Max | 阿里云 | ~10 | ~30 | 中文理解强 |
| 文心一言 4.0 | 百度 | ~20 | ~60 | 企业级 |
| GPT-4o | OpenAI | ~35 | ~105 | 国际标杆 |
| Claude 3.5 Sonnet | Anthropic | ~22 | ~65 | 代码能力突出 |

> 注：以上价格为大致区间，实际以各平台官网为准。PeakValley 可在上述价格基础上叠加峰谷倍率（峰时 1.3x、谷时 0.5x）形成动态定价。

---

## 四、接入建议

### 短期（MVP 阶段）
在 `backend/app/services/pricing.py` 中硬编码 6~10 个主流模型的基础价格，手动维护。

### 中期（自动化）
添加定时任务（GitHub Actions / Celery Beat）每日拉取 LiteLLM 的 pricing JSON，自动更新数据库中的 `model_prices` 表。

### 长期（实时竞价）
接入多家上游 API 的实时可用性与延迟数据，实现真正的动态定价：
- 高峰时段自动切换至低价提供商
- 低谷时段鼓励用户使用高性能模型
- 供给端根据实时算力冗余调整收购价
