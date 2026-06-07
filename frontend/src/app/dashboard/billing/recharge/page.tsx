"use client";

import { useState } from "react";
import { CreditCard, Zap, Receipt, Check, AlertCircle } from "lucide-react";

const PACKAGES = [
  {
    id: "starter",
    name: "入门包",
    price: 10,
    tokens: "100万 tokens",
    savings: "",
    popular: false,
    features: ["适用于个人体验", "支持所有模型", "7天有效期", "基础客服"],
  },
  {
    id: "pro",
    name: "专业包",
    price: 50,
    tokens: "600万 tokens",
    savings: "节省 17%",
    popular: true,
    features: ["适用于个人开发者", "支持所有模型", "30天有效期", "优先客服", "API 高并发"],
  },
  {
    id: "team",
    name: "团队包",
    price: 200,
    tokens: "2800万 tokens",
    savings: "节省 29%",
    popular: false,
    features: ["适用于小型团队", "支持所有模型", "90天有效期", "专属客服", "API 高并发", "组织共享额度"],
  },
  {
    id: "enterprise",
    name: "企业包",
    price: 1000,
    tokens: "1.6亿 tokens",
    savings: "节省 38%",
    popular: false,
    features: ["适用于企业客户", "支持所有模型", "365天有效期", "专属客户成功经理", "SLA 保障 99.9%", "月结 + 发票", "私有化部署咨询"],
  },
];

export default function RechargePage() {
  const [selected, setSelected] = useState("pro");
  const [invoiceMode, setInvoiceMode] = useState(false);

  const pkg = PACKAGES.find((p) => p.id === selected);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-violet-400" />
          充值中心
        </h1>
        <p className="text-gray-400 mt-2">选择合适的套餐，享受峰谷定价带来的成本优势</p>
      </div>

      {/* Pricing Notice */}
      <div className="flex items-center gap-6 mb-8 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">0.5x</p>
          <p className="text-xs text-gray-400">谷时 (22:00-08:00)</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-400">1.0x</p>
          <p className="text-xs text-gray-400">平时 (08:00-10:00, 18:00-22:00)</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <p className="text-2xl font-bold text-rose-400">1.3x</p>
          <p className="text-xs text-gray-400">峰时 (10:00-18:00)</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm text-gray-400">建议：在谷时批量处理任务，可节省 62% 成本</p>
        </div>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {PACKAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`relative p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
              selected === p.id
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 rounded-full text-xs font-medium">
                最受欢迎
              </div>
            )}
            <h3 className="font-bold mb-1">{p.name}</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold">¥{p.price}</span>
              {p.savings && (
                <span className="text-xs text-emerald-400">{p.savings}</span>
              )}
            </div>
            <p className="text-sm text-violet-400 mb-3">{p.tokens}</p>
            <ul className="space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Check className="w-3 h-3 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Action Area */}
      <div className="grid grid-cols-2 gap-6">
        {/* Payment */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400" />
            支付方式
          </h3>
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-violet-500/30 bg-violet-500/5 cursor-pointer">
              <input type="radio" name="pay" defaultChecked className="accent-violet-500" />
              <span className="text-sm">支付宝</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
              <input type="radio" name="pay" className="accent-violet-500" />
              <span className="text-sm">微信支付</span>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
            <div>
              <p className="text-sm text-gray-400">应付金额</p>
              <p className="text-2xl font-bold">¥{pkg?.price}</p>
            </div>
            <button className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition">
              立即支付
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-violet-400" />
            发票申请
          </h3>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="invoice"
              checked={invoiceMode}
              onChange={(e) => setInvoiceMode(e.target.checked)}
              className="accent-violet-500"
            />
            <label htmlFor="invoice" className="text-sm text-gray-400 cursor-pointer">
              需要开具发票
            </label>
          </div>

          {invoiceMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">发票类型</label>
                <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option>增值税普通发票（电子）</option>
                  <option>增值税专用发票</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">发票抬头</label>
                <input
                  type="text"
                  placeholder="请输入企业全称"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">纳税人识别号</label>
                <input
                  type="text"
                  placeholder="请输入税号"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">接收邮箱</label>
                <input
                  type="email"
                  placeholder="发票将发送至该邮箱"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition text-sm">
                提交发票申请
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-400">企业用户充值满 ¥200 可申请开票</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
