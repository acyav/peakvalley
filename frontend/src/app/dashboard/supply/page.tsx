"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Coins,
  CreditCard,
  Landmark,
  Smartphone,
} from "lucide-react";
import { supplyApi } from "@/lib/api";

interface SupplyAccount {
  total_earned: number;
  available_balance: number;
  pending_withdrawal: number;
  withdrawn: number;
  node_count: number;
  online_nodes: number;
}

interface DailyEarning {
  date: string;
  tokens_served: number;
  earned: number;
  peak_earned: number;
  valley_earned: number;
  standard_earned: number;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  method: string;
  account_info: string;
  status: string;
  created_at: string;
  processed_at: string;
  remark: string;
}

interface SupplyNode {
  id: string;
  name: string;
  gpu_model: string;
  status: string;
  total_uptime_hours: number;
  total_tokens_served: number;
  total_earned: number;
  last_heartbeat: string;
}

const METHOD_LABELS: Record<string, { label: string; icon: typeof CreditCard }> = {
  alipay: { label: "支付宝", icon: Smartphone },
  wechat: { label: "微信", icon: Smartphone },
  bank: { label: "银行卡", icon: Landmark },
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "审核中", color: "text-amber-400", icon: Clock },
  processing: { label: "处理中", color: "text-blue-400", icon: Loader2 },
  completed: { label: "已完成", color: "text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "已拒绝", color: "text-red-400", icon: XCircle },
};

export default function SupplyPage() {
  const [account, setAccount] = useState<SupplyAccount | null>(null);
  const [earnings, setEarnings] = useState<DailyEarning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [nodes, setNodes] = useState<SupplyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "withdraw" | "records" | "nodes">("overview");

  // 提现表单
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("alipay");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [acc, earn, wd, nd] = await Promise.all([
        supplyApi.getAccount().catch(() => null),
        supplyApi.getDailyEarnings().catch(() => ({ daily: [] })),
        supplyApi.getWithdrawals().catch(() => ({ records: [] })),
        supplyApi.getNodes().catch(() => ({ nodes: [] })),
      ]);
      if (acc) setAccount(acc as SupplyAccount);
      setEarnings((earn as any).daily || []);
      setWithdrawals((wd as any).records || []);
      setNodes((nd as any).nodes || []);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      setError("最小提现金额为 ¥10");
      return;
    }
    if (!withdrawAccount.trim()) {
      setError("请输入收款账号");
      return;
    }

    setWithdrawLoading(true);
    setError("");
    try {
      await supplyApi.requestWithdrawal(amount, withdrawMethod, withdrawAccount.trim());
      setWithdrawSuccess(`提现 ¥${amount.toFixed(2)} 申请已提交`);
      setWithdrawAmount("");
      setWithdrawAccount("");
      loadData();
    } catch (e: any) {
      setError(e.message || "提现失败");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // 计算近7天收益
  const recent7Days = earnings.slice(-7);
  const recent7Total = recent7Days.reduce((s, d) => s + (d.earned || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            收益提现
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            节点数 {account?.node_count || 0} · 在线 {account?.online_nodes || 0}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Success */}
      {withdrawSuccess && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {withdrawSuccess}
          <button onClick={() => setWithdrawSuccess("")} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="pv-card p-5">
          <p className="text-xs text-gray-400 mb-1">累计收益</p>
          <p className="text-2xl font-bold text-emerald-400">¥{(account?.total_earned || 0).toFixed(2)}</p>
        </div>
        <div className="pv-card p-5">
          <p className="text-xs text-gray-400 mb-1">可提现</p>
          <p className="text-2xl font-bold text-violet-400">¥{(account?.available_balance || 0).toFixed(2)}</p>
        </div>
        <div className="pv-card p-5">
          <p className="text-xs text-gray-400 mb-1">提现中</p>
          <p className="text-2xl font-bold text-amber-400">¥{(account?.pending_withdrawal || 0).toFixed(2)}</p>
        </div>
        <div className="pv-card p-5">
          <p className="text-xs text-gray-400 mb-1">已提现</p>
          <p className="text-2xl font-bold text-blue-400">¥{(account?.withdrawn || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { key: "overview", label: "收益概览", icon: TrendingUp },
          { key: "withdraw", label: "申请提现", icon: ArrowUpRight },
          { key: "records", label: "提现记录", icon: Clock },
          { key: "nodes", label: "我的节点", icon: Server },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === key
                ? "bg-emerald-600/20 text-emerald-300"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 7-day summary */}
          <div className="pv-card p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              近 7 天收益
              <span className="text-sm text-emerald-400 ml-auto">总计 ¥{recent7Total.toFixed(4)}</span>
            </h3>
            {recent7Days.length > 0 ? (
              <div className="space-y-2">
                {recent7Days.map((d) => (
                  <div key={d.date} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                    <span className="text-sm text-gray-300">{d.date}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{(d.tokens_served || 0).toLocaleString()} tokens</span>
                      <span className="text-emerald-400 font-medium">+¥{(d.earned || 0).toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">暂无收益数据，部署节点开始贡献算力即可获得收益</p>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === "withdraw" && (
        <div className="pv-card p-6 max-w-lg">
          <h3 className="font-medium mb-6 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            申请提现
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">提现金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="最小 ¥10"
                  min="10"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                可提现余额：<span className="text-emerald-400">¥{(account?.available_balance || 0).toFixed(2)}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">收款方式</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(METHOD_LABELS).map(([key, { label, icon: Icon }]) => (
                  <button
                    key={key}
                    onClick={() => setWithdrawMethod(key)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                      withdrawMethod === key
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">收款账号</label>
              <input
                type="text"
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                placeholder={
                  withdrawMethod === "alipay" ? "支付宝账号" :
                  withdrawMethod === "wechat" ? "微信号" :
                  "银行卡号"
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawLoading || !withdrawAmount || !withdrawAccount.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {withdrawLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
              提交提现申请
            </button>

            <p className="text-xs text-gray-500 text-center">
              提现申请提交后，预计 1-3 个工作日到账
            </p>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === "records" && (
        <div className="pv-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">时间</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">金额</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">方式</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">备注</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const statusInfo = STATUS_LABELS[w.status] || STATUS_LABELS.pending;
                const methodInfo = METHOD_LABELS[w.method] || METHOD_LABELS.alipay;
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 text-gray-300">
                      {w.created_at ? new Date(w.created_at).toLocaleString("zh-CN") : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-400">
                      ¥{w.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{methodInfo.label}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{w.remark || "-"}</td>
                  </tr>
                );
              })}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">暂无提现记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Nodes Tab */}
      {activeTab === "nodes" && (
        <div className="space-y-4">
          {nodes.length > 0 ? (
            nodes.map((n) => (
              <div key={n.id} className="pv-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      n.status === "online" ? "bg-emerald-500/20" : "bg-gray-500/20"
                    }`}>
                      <Server className={`w-5 h-5 ${
                        n.status === "online" ? "text-emerald-400" : "text-gray-400"
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{n.name}</h4>
                      <p className="text-xs text-gray-400">{n.gpu_model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      n.status === "online"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-gray-500/10 text-gray-400"
                    }`}>
                      {n.status === "online" ? "在线" : "离线"}
                    </span>
                    <span className="text-gray-400">{(n.total_uptime_hours || 0).toFixed(1)}h</span>
                    <span className="text-emerald-400">¥{(n.total_earned || 0).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="pv-card p-12 text-center">
              <Server className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">暂无供给节点</h3>
              <p className="text-sm text-gray-400 mb-4">下载 TokenEngine 客户端，部署节点开始赚取收益</p>
              <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm transition">
                下载客户端
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
