"use client";

import { useEffect, useState } from "react";
import { pricingApi } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function PricingPage() {
  const [pricing, setPricing] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);

  useEffect(() => {
    pricingApi.getCurrent().then(setPricing).catch(console.error);
    pricingApi.getSchedule().then(setSchedule).catch(console.error);
  }, []);

  const areaData = schedule?.schedule?.map((s: any) => ({
    hour: `${s.hour}:00`,
    multiplier: s.multiplier,
    tier: s.tier,
  })) || [];

  const currentTier = pricing?.current_tier || "standard";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">价格面板</h1>

      {/* 当前价格 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { tier: "peak", label: "高峰", multiplier: 1.3, hours: "10:00-18:00", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { tier: "standard", label: "平段", multiplier: 1.0, hours: "08:00-10:00 / 18:00-22:00", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" },
          { tier: "valley", label: "低谷", multiplier: 0.5, hours: "22:00-08:00", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
        ].map(({ tier, label, multiplier, hours, color, bg }) => (
          <div
            key={tier}
            className={`pv-card p-5 border ${bg} ${
              currentTier === tier ? "ring-2 ring-violet-400" : ""
            }`}
          >
            {currentTier === tier && (
              <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                当前
              </span>
            )}
            <p className={`text-2xl font-bold mt-2 ${color}`}>{label}</p>
            <p className="text-3xl font-bold font-mono mt-1">{multiplier}x</p>
            <p className="text-sm text-gray-500 mt-2">{hours}</p>
          </div>
        ))}
      </div>

      {/* 24h 价格曲线 */}
      <div className="pv-card p-6">
        <h3 className="text-lg font-semibold mb-4">24 小时价格曲线</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" tick={{ fill: "#9ca3af", fontSize: 10 }} interval={2} />
              <YAxis tick={{ fill: "#9ca3af" }} domain={[0, 1.5]} />
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#f3f4f6" }}
                formatter={(value: any) => [`${value}x`, "价格倍率"]}
              />
              <Area
                type="stepAfter"
                dataKey="multiplier"
                stroke="#8b5cf6"
                fill="url(#priceGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 模型价格表 */}
      {pricing?.models && (
        <div className="pv-card p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">模型价格表（当前倍率 {pricing.current_multiplier}x）</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-2">模型</th>
                <th className="text-left py-2">供应商</th>
                <th className="text-right py-2">输入 /1K tokens</th>
                <th className="text-right py-2">输出 /1K tokens</th>
                <th className="text-right py-2">基础价（输入）</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pricing.models).map(([model, info]: [string, any]) => (
                <tr key={model} className="border-t border-white/5">
                  <td className="py-2 font-mono text-violet-400">{model}</td>
                  <td className="py-2">{info.provider}</td>
                  <td className="text-right py-2 font-mono">¥{info.input_per_1k}</td>
                  <td className="text-right py-2 font-mono">¥{info.output_per_1k}</td>
                  <td className="text-right py-2 font-mono text-gray-500">¥{info.base_input_per_1k}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
