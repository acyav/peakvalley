"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Server,
  Cpu,
  Wallet,
  Download,
  ChevronRight,
  Shield,
  Globe,
  TrendingUp,
  Monitor,
  Terminal,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Download className="w-6 h-6" />,
    title: "一键部署",
    desc: "Windows / macOS / Linux 客户端，3 分钟完成部署",
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "算力贡献",
    desc: "将闲置 GPU/CPU 资源接入 TokenEngine，自动调度",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "实时收益",
    desc: "按贡献算力实时结算，支持多种提现方式",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "安全隔离",
    desc: "容器化沙箱运行，保障设备安全与数据隐私",
  },
];

const OS_LIST = [
  { icon: <Monitor className="w-5 h-5" />, name: "Windows", version: "Win10+", size: "45MB" },
  { icon: <Terminal className="w-5 h-5" />, name: "macOS", version: "Intel/Apple Silicon", size: "52MB" },
  { icon: <Globe className="w-5 h-5" />, name: "Linux", version: "Ubuntu 20.04+", size: "38MB" },
];

const STEPS = [
  { step: "01", title: "下载客户端", desc: "选择对应系统版本，一键安装" },
  { step: "02", title: "注册节点", desc: "绑定账号，配置算力资源" },
  { step: "03", title: "开始贡献", desc: "TokenEngine 自动调度，无需值守" },
  { step: "04", title: "收益提现", desc: "按贡献量结算，随时提现到账户" },
];

export default function SupplyPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen pv-gradient">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-6xl mx-auto px-8 py-20 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
              <Server className="w-4 h-4" />
              供给端入口
            </div>
            <h1 className="text-5xl font-bold mb-6">
              让你的闲置算力
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-violet-400">
                创造持续收益
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              加入 PeakValley 分布式算力网络，将闲置 GPU/CPU 资源接入 TokenEngine，
              为 AI 应用提供算力支持，同时获得稳定收益。
            </p>
            <div className="flex items-center justify-center gap-4">
              <button className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition flex items-center gap-2">
                <Download className="w-5 h-5" />
                下载客户端
              </button>
              <Link
                href="/dashboard"
                className="px-8 py-3 border border-white/20 hover:border-white/40 rounded-xl font-medium transition"
              >
                返回需求端
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-8 -mt-10">
        <div className="grid grid-cols-4 gap-4">
          {[
            { value: "12,000+", label: "活跃节点", color: "text-emerald-400" },
            { value: "2.5 PFLOPS", label: "总算力", color: "text-blue-400" },
            { value: "¥3.2M", label: "累计分成", color: "text-violet-400" },
            { value: "99.7%", label: "在线率", color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="pv-card p-6 text-center">
              <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">为什么选择 PeakValley 供给端？</h2>
          <p className="text-gray-400">零门槛参与，稳定收益，安全可靠</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="pv-card p-6 text-center group hover:border-emerald-500/30 transition">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-400 group-hover:scale-110 transition">
                {f.icon}
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">如何参与</h2>
          <p className="text-gray-400">简单四步，开始赚取收益</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              <div className="pv-card p-6 h-full">
                <div className="text-4xl font-bold text-emerald-500/20 mb-3">{s.step}</div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Downloads */}
      <div className="max-w-6xl mx-auto px-8 pb-20">
        <div className="pv-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">下载 TokenEngine 客户端</h2>
              <p className="text-gray-400">支持主流操作系统，一键安装，自动运行</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400">v2.1.0 最新版</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {OS_LIST.map((os) => (
              <button
                key={os.name}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-emerald-400 transition">
                  {os.icon}
                </div>
                <div className="text-left">
                  <h4 className="font-bold">{os.name}</h4>
                  <p className="text-xs text-gray-400">{os.version} · {os.size}</p>
                </div>
                <Download className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 ml-auto transition" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Calculator */}
      <div className="max-w-6xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-2 gap-8">
          <div className="pv-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold">收益计算器</h3>
            </div>
            <RevenueCalculator />
          </div>
          <div className="pv-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Server className="w-6 h-6 text-violet-400" />
              <h3 className="text-xl font-bold">网络拓扑</h3>
            </div>
            <NetworkTopology />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-6xl mx-auto px-8 pb-20">
        <div className="pv-card p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            加入 12,000+ 算力节点，让你的闲置设备创造价值。
            现在注册即送 ¥50 新手奖励。
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition">
              立即注册
            </button>
            <button className="px-8 py-3 border border-white/20 hover:border-white/40 rounded-xl font-medium transition">
              查看文档
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueCalculator() {
  const [gpuHours, setGpuHours] = useState(8);
  const [gpuType, setGpuType] = useState("rtx4090");

  const rates: Record<string, number> = {
    rtx4090: 2.5,
    rtx3090: 1.8,
    a100: 4.0,
    "3090ti": 2.0,
  };

  const daily = gpuHours * rates[gpuType];
  const monthly = daily * 30;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">GPU 型号</label>
        <select
          value={gpuType}
          onChange={(e) => setGpuType(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="rtx4090">NVIDIA RTX 4090</option>
          <option value="rtx3090">NVIDIA RTX 3090</option>
          <option value="a100">NVIDIA A100</option>
          <option value="3090ti">NVIDIA RTX 3090 Ti</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          每日在线时长：{gpuHours} 小时
        </label>
        <input
          type="range"
          min={1}
          max={24}
          value={gpuHours}
          onChange={(e) => setGpuHours(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-xs text-gray-400 mb-1">预计日收益</p>
          <p className="text-2xl font-bold text-emerald-400">¥{daily.toFixed(1)}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
          <p className="text-xs text-gray-400 mb-1">预计月收益</p>
          <p className="text-2xl font-bold text-emerald-400">¥{monthly.toFixed(0)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">
        * 收益受峰谷时段影响，实际收益可能有所不同
      </p>
    </div>
  );
}

function NetworkTopology() {
  return (
    <div className="relative h-64 flex items-center justify-center">
      {/* Central Node */}
      <div className="absolute w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center z-10">
        <Server className="w-8 h-8 text-emerald-400" />
      </div>
      {/* Satellite Nodes */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60 * Math.PI) / 180;
        const r = 90;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        return (
          <div
            key={i}
            className="absolute w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center animate-pulse"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <Cpu className="w-4 h-4 text-gray-400" />
          </div>
        );
      })}
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const r = 90;
          const cx = 128;
          const cy = 128;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(16,185,129,0.2)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>
    </div>
  );
}
