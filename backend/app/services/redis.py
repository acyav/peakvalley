from __future__ import annotations
"""
Upstash Redis 客户端 - HTTP-based Serverless Redis
无需本地 Redis，直接通过 REST API 读写
"""
import httpx
from app.config import REDIS_URL, REDIS_TOKEN


class UpstashRedis:
    """Upstash Redis REST 客户端 - 轻量级，无需 TCP 连接"""

    def __init__(self):
        self._url = REDIS_URL.rstrip("/")
        self._token = REDIS_TOKEN
        self._headers = {"Authorization": f"Bearer {self._token}"}

    async def _exec(self, command: list) -> any:
        """执行 Redis 命令 - 连接失败时返回 None，不阻塞主流程"""
        # 如果配置是占位符，直接跳过
        if not self._url or "your-redis" in self._url or not self._token or "your-upstash" in self._token:
            return None
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"{self._url}",
                    headers=self._headers,
                    json=command,
                )
                resp.raise_for_status()
                data = resp.json()
                if data.get("error"):
                    return None
                return data.get("result")
        except Exception:
            # Redis 不可用时不阻塞主流程
            return None

    async def get(self, key: str) -> str | None:
        return await self._exec(["GET", key])

    async def set(self, key: str, value: str, ex: int | None = None) -> str:
        cmd = ["SET", key, value]
        if ex:
            cmd.extend(["EX", str(ex)])
        return await self._exec(cmd)

    async def incrbyfloat(self, key: str, amount: float) -> float:
        result = await self._exec(["INCRBYFLOAT", key, str(amount)])
        return float(result) if result else 0.0

    async def decrbyfloat(self, key: str, amount: float) -> float:
        return await self.incrbyfloat(key, -amount)

    async def delete(self, *keys: str) -> int:
        return await self._exec(["DEL"] + list(keys))

    async def exists(self, key: str) -> bool:
        result = await self._exec(["EXISTS", key])
        return result == 1

    async def hget(self, name: str, key: str) -> str | None:
        return await self._exec(["HGET", name, key])

    async def hset(self, name: str, key: str, value: str) -> int:
        return await self._exec(["HSET", name, key, value])

    async def hgetall(self, name: str) -> dict:
        result = await self._exec(["HGETALL", name])
        if not result:
            return {}
        return dict(zip(result[0::2], result[1::2]))


# 全局单例
redis = UpstashRedis()
