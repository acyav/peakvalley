"use client";

import { useEffect, useState } from "react";
import { pricingApi, billingApi } from "@/lib/api";
import { Zap, TrendingDown, Wallet, Activity, MessageSquare, Bot, CreditCard, Server, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PricingData {
  current_tier: string;
  current_multiplier: number;
  tier_label: string;
}

interface UsageData {
  total_cost: number;
  total_tokens: number;
  balance: number;
  by_tier: Record<string, { cost: number; tokens: number }>;
}

export default function DashboardPage() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [currentHour, setCurrentHour] = useState(0);

  useEffect(() => {
    const h = new Date().getHours();
    setCurrentHour(h);

    pricingApi.getCurrent().then(setPricing).catch(console.error);
    billingApi.getUsage().then(setUsage).catch(console.error);
  }, []);

  const tierColor = pricing?.current_tier === "peak"
    ? "text-red-400"
    : pricing?.current_tier === "valley"
    ? "text-blue-400"
    : "text-gray-400";

  const tierBg = pricing?.current_tier === "peak"
    ? "bg-red-500/10 border-red-500/20"
    : pricing?.current_tier === "valley"
    ? "bg-blue-500/10 border-blue-500/20"
    : "bg-gray-500/10 border-gray-500/20";

  const tierAnim = pricing?.current_tier === "peak"
    ? "animate-pulse-peak"
    : pricing?.current_tier === "valley"
    ? "animate-pulse-valley"
    : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      {/* 当前时段大卡片 */}
      <div className={`pv-card p-6 ${tierAnim}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">当前时段</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-4xl font-bold ${tierColor}`}>
                {pricing?.tier_label || "加载中"}
              </span>
              <span className="text-2xl text-gray-500">
                {pricing?.current_multiplier
                  ? `${pricing.current_multiplier}x`
                  : ""}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              {pricing?.current_tier === "peak" && "企业高峰时段，Token 价格 1.3x"}
              {pricing?.current_tier === "valley" && "低谷时段，Token 价格 0.5x，省钱好时机！"}
              {pricing?.current_tier === "standard" && "平段时段，Token 价格 1.0x"}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${tierBg} border`}>
            <Zap className={`w-12 h-12 ${tierColor}`} />
          </div>
        </div>
      </div>

      {/* 数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5 text-green-400" />}
          label="账户余额"
          value={usage ? `¥${usage.balance.toFixed(2)}` : "--"}
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-violet-400" />}
          label="今日 Token"
          value={usage ? usage.total_tokens.toLocaleString() : "--"}
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5 text-blue-400" />}
          label="低谷用量"
          value={usage ? `¥${usage.by_tier?.valley?.cost?.toFixed(4) || "0"}` : "--"}
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-red-400" />}
          label="高峰用量"
          value={usage ? `¥${usage.by_tier?.peak?.cost?.toFixed(4) || "0"}` : "--"}
        />
      </div>

      {/* 24h 价格时钟迷你版 */}
      <div className="pv-card p-6">
        <h3 className="text-lg font-semibold mb-4">24h 价格时钟</h3>
        <div className="grid grid-cols-12 gap-1.5">
          {Array.from({ length: 24 }, (_, i) => {
            let tier = "standard";
            if (i >= 22 || i < 8) tier = "valley";
            else if (i >= 10 && i < 18) tier = "peak";

            const isCurrent = i === currentHour;
            const colors = {
              peak: "bg-red-500/30",
              valley: "bg-blue-500/30",
              standard: "bg-gray-500/20",
            }[tier];

            return (
              <div
                key={i}
                className={`rounded p-1.5 text-center text-xs ${colors} ${
                  isCurrent ? "ring-2 ring-violet-400" : ""
                }`}
              >
                <div className="text-gray-500">{i}h</div>
                <div className="font-mono font-bold text-gray-300">
                  {tier === "peak" ? "1.3" : tier === "valley" ? "0.5" : "1.0"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 快速入口 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">快速入口</h3>
        <div className="grid grid-cols-4 gap-4">
          <QuickCard
            href="/dashboard/chat"
            icon={<MessageSquare className="w-6 h-6" />}
            title="在线聊天"
            desc="直接对话 AI 助手"
            color="text-violet-400"
            bgColor="bg-violet-500/10"
          />
          <QuickCard
            href="/dashboard/agents"
            icon={<Bot className="w-6 h-6" />}
            title="AI 助手矩阵"
            desc="4 类场景助手"
            color="text-blue-400"
            bgColor="bg-blue-500/10"
          />
          <QuickCard
            href="/dashboard/billing/recharge"
            icon={<CreditCard className="w-6 h-6" />}
            title="充值中心"
            desc="购买 Token 额度"
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
          />
          <QuickCard
            href="/supply"
            icon={<Server className="w-6 h-6" />}
            title="供给端"
            desc="贡献算力赚收益"
            color="text-amber-400"
            bgColor="bg-amber-500/10"
          />
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  desc,
  color,
  bgColor,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Link
      href={href}
      className="pv-card p-5 group hover:border-violet-500/30 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
      </div>
      <h4 className="font-bold mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{desc}</p>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="pv-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  );
}
