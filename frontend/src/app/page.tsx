"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  TrendingDown,
  Shield,
  Clock,
  ArrowRight,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  const [currentTier, setCurrentTier] = useState("valley");
  const [currentHour, setCurrentHour] = useState(0);

  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      setCurrentHour(h);
      if (h >= 22 || h < 8) setCurrentTier("valley");
      else if (h >= 10 && h < 18) setCurrentTier("peak");
      else setCurrentTier("standard");
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const tierConfig = {
    peak: { label: "高峰", multiplier: "1.3x", color: "text-red-400", bg: "bg-red-500/10" },
    valley: { label: "低谷", multiplier: "0.5x", color: "text-blue-400", bg: "bg-blue-500/10" },
    standard: { label: "平段", multiplier: "1.0x", color: "text-gray-400", bg: "bg-gray-500/10" },
  }[currentTier];

  return (
    <div className="min-h-screen pv-gradient">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-violet-400" />
          <span className="text-xl font-bold">PeakValley</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
            登录
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition"
          >
            免费注册
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400">
            当前时段：<span className={tierConfig?.color ?? ""}>{tierConfig?.label ?? ""}</span>
            <span className="text-gray-500 ml-1">{tierConfig?.multiplier ?? ""}</span>
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          AI Token
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            {" "}削峰补枯
          </span>
          <br />
          调度平台
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          像电力调度一样管理 AI 算力。低谷便宜跑任务，高峰智能调度，
          <br />
          让每一枚 Token 都花在刀刃上。
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-lg font-medium transition flex items-center gap-2"
          >
            开始使用 <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-lg font-medium transition"
          >
            查看演示
          </Link>
        </div>
      </section>

      {/* 实时价格时钟 */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div className="pv-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            24 小时价格时钟
          </h3>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }, (_, i) => {
              let tier = "standard";
              if (i >= 22 || i < 8) tier = "valley";
              else if (i >= 10 && i < 18) tier = "peak";

              const isCurrent = i === currentHour;
              const colors = {
                peak: "bg-red-500/30 border-red-500/50",
                valley: "bg-blue-500/30 border-blue-500/50",
                standard: "bg-gray-500/20 border-gray-500/30",
              }[tier];

              return (
                <div
                  key={i}
                  className={`rounded-md p-1 text-center text-xs border transition-all ${
                    colors
                  } ${isCurrent ? "ring-2 ring-violet-400 scale-110" : ""}`}
                >
                  <div className="text-gray-500">{i}:00</div>
                  <div className={`font-mono font-bold ${isCurrent ? "text-white" : "text-gray-300"}`}>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500/50" /> 高峰 1.3x
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500/50" /> 低谷 0.5x
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-500/30" /> 平段 1.0x
            </span>
          </div>
        </div>
      </section>

      {/* 特性 */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingDown,
              title: "低谷 5 折算力",
              desc: "22:00-08:00 低谷时段 Token 价格低至 0.5x，学生夜间跑任务省一半",
            },
            {
              icon: BarChart3,
              title: "OpenAI 兼容",
              desc: "只需改一行 base_url，零迁移成本接入，所有 OpenAI SDK 直接可用",
            },
            {
              icon: Shield,
              title: "智能调度",
              desc: "多模型自动路由，DeepSeek/千问/GLM 多供应商保障可用性",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="pv-card p-6 hover:border-violet-500/30 transition">
              <Icon className="w-8 h-8 text-violet-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-gray-500 text-sm">
        PeakValley 峰谷算力 © 2026 — AI Token 削峰补枯调度平台
      </footer>
    </div>
  );
}
