from __future__ import annotations
"""
动态定价引擎 - 峰谷时段判断 + 价格计算
"""
from datetime import datetime
from app.config import DEFAULT_PRICING_RULES, PROVIDER_CONFIGS
from app.services.supabase import get_supabase_admin


class PricingEngine:
    """峰谷动态定价引擎"""

    def __init__(self):
        self._rules_cache = None
        self._cache_time = None

    def get_current_tier(self) -> str:
        """根据当前小时判断峰谷时段"""
        hour = datetime.now().hour
        for tier, config in DEFAULT_PRICING_RULES.items():
            if hour in config["hours"]:
                return tier
        return "standard"

    def get_multiplier(self, tier: str | None = None) -> float:
        """获取当前时段倍率"""
        tier = tier or self.get_current_tier()
        return DEFAULT_PRICING_RULES.get(tier, DEFAULT_PRICING_RULES["standard"])["multiplier"]

    def calculate_price(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        tier: str | None = None,
    ) -> dict:
        """
        计算请求费用
        返回: {
            "tier": "valley",
            "multiplier": 0.5,
            "input_cost": 0.5,      # 输入成本 (元)
            "output_cost": 1.0,     # 输出成本 (元)
            "total_cost": 1.5,      # 总成本 (元)
            "sell_price": 2.25,     # 售价 (含峰谷倍率)
        }
        """
        tier = tier or self.get_current_tier()
        multiplier = self.get_multiplier(tier)

        # 查找模型成本价
        provider_name, model_config = self._find_model_config(model)
        if not model_config:
            # 未知模型使用默认费率
            model_config = {
                "input_cost_per_1k": 0.002,
                "output_cost_per_1k": 0.006,
            }

        input_cost = model_config["input_cost_per_1k"] * (prompt_tokens / 1000)
        output_cost = model_config["output_cost_per_1k"] * (completion_tokens / 1000)
        base_cost = input_cost + output_cost
        sell_price = base_cost * multiplier

        return {
            "tier": tier,
            "multiplier": multiplier,
            "input_cost": round(input_cost, 6),
            "output_cost": round(output_cost, 6),
            "base_cost": round(base_cost, 6),
            "sell_price": round(sell_price, 6),
            "provider": provider_name,
        }

    def get_schedule_24h(self) -> list[dict]:
        """返回 24 小时价格时间表"""
        schedule = []
        for hour in range(24):
            tier = "standard"
            for t, config in DEFAULT_PRICING_RULES.items():
                if hour in config["hours"]:
                    tier = t
                    break
            schedule.append({
                "hour": hour,
                "tier": tier,
                "multiplier": DEFAULT_PRICING_RULES[tier]["multiplier"],
            })
        return schedule

    def _find_model_config(self, model: str) -> tuple[str | None, dict | None]:
        """在所有 provider 中查找模型配置"""
        for provider_key, provider in PROVIDER_CONFIGS.items():
            if model in provider.get("models", {}):
                return provider_key, provider["models"][model]
        return None, None

    def _find_all_models(self) -> list[dict]:
        """列出所有模型及其成本价 (供 API 使用)"""
        models = []
        for provider_key, provider in PROVIDER_CONFIGS.items():
            for model_name, model_config in provider.get("models", {}).items():
                models.append({
                    "id": model_name,
                    "provider": provider_key,
                    "provider_name": provider["name"],
                    "input_cost_per_1k": model_config["input_cost_per_1k"],
                    "output_cost_per_1k": model_config["output_cost_per_1k"],
                })
        return models


# 全局单例
pricing_engine = PricingEngine()
