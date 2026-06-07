from __future__ import annotations
"""
计费引擎 - 实时计量 + 余额检查 + T+1 结算
"""
from datetime import date, timedelta
from app.engines.pricing import pricing_engine
from app.services.redis import redis
from app.services.supabase import get_supabase_admin


class BillingEngine:
    """实时计费引擎"""

    async def meter_usage(
        self,
        user_id: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        tier: str | None = None,
    ) -> dict:
        """
        实时计量 - Redis INCR + 余额扣减
        返回计费详情
        """
        price_detail = pricing_engine.calculate_price(
            model, prompt_tokens, completion_tokens, tier
        )
        sell_price = price_detail["sell_price"]

        # Redis 实时累加今日用量
        today_key = f"usage:{user_id}:{date.today().isoformat()}"
        await redis.incrbyfloat(f"{today_key}:cost", sell_price)
        await redis.incrbyfloat(f"{today_key}:tokens", prompt_tokens + completion_tokens)

        # 按时段分类记录
        tier_key = f"{today_key}:{price_detail['tier']}"
        await redis.incrbyfloat(f"{tier_key}:cost", sell_price)
        await redis.incrbyfloat(f"{tier_key}:tokens", prompt_tokens + completion_tokens)

        # 扣减余额
        new_balance = await redis.decrbyfloat(f"balance:{user_id}", sell_price)

        return {
            **price_detail,
            "remaining_balance": round(new_balance, 4),
        }

    async def check_balance(self, user_id: str) -> bool:
        """检查余额是否 > 0"""
        balance = await redis.get(f"balance:{user_id}")
        if balance is None:
            # Redis 无缓存，从 Supabase 同步
            balance = await self._sync_balance_from_db(user_id)
        return float(balance) > 0

    async def get_balance(self, user_id: str) -> float:
        """获取当前余额"""
        balance = await redis.get(f"balance:{user_id}")
        if balance is None:
            balance = await self._sync_balance_from_db(user_id)
        return round(float(balance), 4)

    async def get_today_usage(self, user_id: str) -> dict:
        """获取今日实时用量"""
        today_key = f"usage:{user_id}:{date.today().isoformat()}"
        cost = await redis.get(f"{today_key}:cost") or "0"
        tokens = await redis.get(f"{today_key}:tokens") or "0"

        # 分时段
        tiers = {}
        for tier in ["peak", "valley", "standard"]:
            t_cost = await redis.get(f"{today_key}:{tier}:cost") or "0"
            t_tokens = await redis.get(f"{today_key}:{tier}:tokens") or "0"
            tiers[tier] = {
                "cost": float(t_cost),
                "tokens": int(float(t_tokens)),
            }

        return {
            "date": date.today().isoformat(),
            "total_cost": float(cost),
            "total_tokens": int(float(tokens)),
            "by_tier": tiers,
        }

    async def daily_settle(self):
        """T+1 日结算 - 将昨日 Redis 数据汇总写入 Supabase"""
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        admin = get_supabase_admin()

        # 获取所有活跃用户 (从 usage:*:yesterday 模式)
        # MVP 简化：遍历 Redis 已知用户
        # TODO: 用 SCAN 或用户表驱动

        pass  # P1 阶段实现完整结算逻辑

    async def _sync_balance_from_db(self, user_id: str) -> float:
        """从 Supabase 同步余额到 Redis"""
        admin = get_supabase_admin()
        result = admin.table("users").select("balance").eq("id", user_id).execute()
        if result.data:
            balance = result.data[0]["balance"]
        else:
            balance = 0.0

        # 写入 Redis (TTL 1小时)
        await redis.set(f"balance:{user_id}", str(balance), ex=3600)
        return balance


# 全局单例
billing_engine = BillingEngine()
