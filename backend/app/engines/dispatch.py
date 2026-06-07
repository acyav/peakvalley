from __future__ import annotations
"""
调度引擎 - 供应商选择 + 需求预测 (MVP 简化版)
"""
from app.config import PROVIDER_CONFIGS


class DispatchEngine:
    """调度引擎 - MVP 用优先级路由"""

    def select_provider(self, model: str) -> dict | None:
        """
        根据模型名选择最优供应商
        MVP 策略：优先级排序，选第一个启用的
        后续升级为智能路由（延迟/成本/可用率多目标优化）
        """
        # 查找哪些 provider 支持此模型
        candidates = []
        for provider_key, provider in PROVIDER_CONFIGS.items():
            if model in provider.get("models", {}):
                candidates.append({
                    "provider": provider_key,
                    "name": provider["name"],
                    "base_url": provider["base_url"],
                    "priority": provider.get("priority", 99),
                    "model_config": provider["models"][model],
                })

        if not candidates:
            # 模型不匹配时，使用默认 provider (deepseek)
            return {
                "provider": "deepseek",
                "name": PROVIDER_CONFIGS["deepseek"]["name"],
                "base_url": PROVIDER_CONFIGS["deepseek"]["base_url"],
                "priority": 1,
                "model_config": PROVIDER_CONFIGS["deepseek"]["models"]["deepseek-chat"],
            }

        # 按优先级排序
        candidates.sort(key=lambda x: x["priority"])
        return candidates[0]

    def list_available_models(self) -> list[dict]:
        """列出所有可用模型"""
        models = []
        for provider_key, provider in PROVIDER_CONFIGS.items():
            for model_name, model_config in provider["models"].items():
                models.append({
                    "id": model_name,
                    "provider": provider_key,
                    "provider_name": provider["name"],
                    "input_cost_per_1k": model_config["input_cost_per_1k"],
                    "output_cost_per_1k": model_config["output_cost_per_1k"],
                })
        return models

    async def forecast_demand(self) -> dict:
        """
        需求预测 - MVP 用简单移动平均
        后续升级为 Prophet / LSTM
        """
        # P1 阶段实现
        return {
            "method": "moving_average",
            "forecast_24h": [],
            "message": "调度预测将在 P1 阶段上线",
        }


# 全局单例
dispatch_engine = DispatchEngine()
