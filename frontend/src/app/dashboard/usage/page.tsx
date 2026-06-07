"use client";

import { useEffect, useState } from "react";
import { pricingApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function UsagePage() {
  const [schedule, setSchedule] = useState<any>(null);

  useEffect(() => {
    pricingApi.getSchedule().then(setSchedule).catch(console.error);
  }, []);

  const chartData = schedule?.schedule?.map((s: any) => ({
    hour: `${s.hour}:00`,
    multiplier: s.multiplier,
    tier: s.tier,
    fill: s.tier === "peak" ? "#ef4444" : s.tier === "valley" ? "#3b82f6" : "#6b7280",
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">用量统计</h1>

      <div className="pv-card p-6">
        <h3 className="text-lg font-semibold mb-4">24 小时价格倍率</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" tick={{ fill: "#9ca3af", fontSize: 10 }} interval={2} />
              <YAxis tick={{ fill: "#9ca3af" }} domain={[0, 1.5]} />
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#f3f4f6" }}
                formatter={(value: any) => [`${value}x`, "倍率"]}
              />
              <Bar dataKey="multiplier" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pv-card p-6">
        <p className="text-gray-400 text-sm">
          详细的按天/周/月 Token 用量图表将在 P1 阶段上线，目前展示 24h 价格倍率作为参考。
        </p>
      </div>
    </div>
  );
}
