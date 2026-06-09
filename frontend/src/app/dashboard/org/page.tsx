"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  UserPlus,
  Shield,
  Eye,
  Trash2,
  Settings,
  BarChart3,
  Loader2,
  AlertCircle,
  Check,
  X,
  Edit3,
  Coins,
  Zap,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Laptop,
} from "lucide-react";
import { orgApi, billingApi, supplyApi } from "@/lib/api";

interface OrgInfo {
  id: string;
  name: string;
  type: string;
  quota_limit: number;
  pricing_tier: string;
  member_count: number;
  created_at: string;
  my_role: string;
}

interface OrgMember {
  id: string;
  email: string;
  role: string;
  balance: number;
  joined_at: string;
  status: string;
}

interface MemberUsage {
  user_id: string;
  email: string;
  tokens: number;
  cost: number;
  requests: number;
}

const ROLE_LABELS: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "管理员", icon: Shield, color: "text-violet-400 bg-violet-500/10" },
  member: { label: "成员", icon: Users, color: "text-blue-400 bg-blue-500/10" },
  viewer: { label: "观察者", icon: Eye, color: "text-gray-400 bg-gray-500/10" },
  enterprise: { label: "企业主", icon: Building2, color: "text-emerald-400 bg-emerald-500/10" },
};

const ORG_TYPE_LABELS: Record<string, string> = {
  university: "高校团队",
  company: "企业组织",
  personal: "个人",
};

export default function OrgPage() {
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [usage, setUsage] = useState<{ total_tokens: number; total_cost: number; members_usage: MemberUsage[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "usage" | "settings">("members");

  // 个人工作室数据（无组织时展示）
  const [personalStats, setPersonalStats] = useState<{
    total_tokens: number;
    total_cost: number;
    total_requests: number;
    total_earned: number;
    node_count: number;
    online_nodes: number;
    recent_activity: { date: string; action: string; amount: string }[];
  } | null>(null);

  // 邀请状态
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");

  // 编辑组织名
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [info, mem, usg] = await Promise.all([
        orgApi.getInfo().catch(() => null),
        orgApi.getMembers().catch(() => ({ members: [] })),
        orgApi.getUsage().catch(() => null),
      ]);
      if (info) {
        setOrgInfo(info as OrgInfo);
        setNewName((info as OrgInfo).name);
      } else {
        // 无组织时加载个人工作室数据
        await loadPersonalStats();
      }
      setMembers((mem as any).members || []);
      if (usg) setUsage(usg as any);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalStats = async () => {
    try {
      const [usage, balance, supplyAcc, records] = await Promise.all([
        billingApi.getUsage().catch(() => null),
        billingApi.getBalance().catch(() => ({ balance: 0 })),
        supplyApi.getAccount().catch(() => null),
        billingApi.getRecords().catch(() => ({ records: [] })),
      ]);

      const recs = (records as any)?.records || [];
      const activity = recs.slice(0, 5).map((r: any) => ({
        date: r.period_start ? new Date(r.period_start).toLocaleDateString("zh-CN") : "-",
        action: r.status === "paid" ? "账单结算" : "账单生成",
        amount: `¥${(r.sell_price || 0).toFixed(2)}`,
      }));

      setPersonalStats({
        total_tokens: (usage as any)?.total_tokens || 0,
        total_cost: (usage as any)?.total_cost || 0,
        total_requests: (usage as any)?.request_count || 0,
        total_earned: (supplyAcc as any)?.total_earned || 0,
        node_count: (supplyAcc as any)?.node_count || 0,
        online_nodes: (supplyAcc as any)?.online_nodes || 0,
        recent_activity: activity.length > 0 ? activity : [
          { date: new Date().toLocaleDateString("zh-CN"), action: "开始使用 PeakValley", amount: "-" },
        ],
      });
    } catch {
      setPersonalStats({
        total_tokens: 0, total_cost: 0, total_requests: 0,
        total_earned: 0, node_count: 0, online_nodes: 0,
        recent_activity: [{ date: "今天", action: "开始使用 PeakValley", amount: "-" }],
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteSuccess("");
    setError("");
    try {
      await orgApi.inviteMember(inviteEmail.trim(), inviteRole);
      setInviteSuccess(`已邀请 ${inviteEmail}`);
      setInviteEmail("");
      loadData();
    } catch (e: any) {
      setError(e.message || "邀请失败");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`确定移除 ${email} 吗？`)) return;
    try {
      await orgApi.removeMember(memberId);
      loadData();
    } catch (e: any) {
      setError(e.message || "移除失败");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await orgApi.updateMemberRole(memberId, newRole);
      loadData();
    } catch (e: any) {
      setError(e.message || "更新失败");
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    try {
      await orgApi.updateInfo({ name: newName.trim() });
      setEditingName(false);
      loadData();
    } catch (e: any) {
      setError(e.message || "更新失败");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!orgInfo) {
    // ─── 个人工作室视图 ───
    return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            个人工作室
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            独立开发者 / 个人创作者 / 小型团队 —— 一人即组织
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="pv-card p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Zap className="w-4 h-4 text-violet-400" />
              累计消耗 Token
            </div>
            <p className="text-2xl font-bold text-violet-400">
              {personalStats ? personalStats.total_tokens.toLocaleString() : "0"}
            </p>
          </div>
          <div className="pv-card p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Coins className="w-4 h-4 text-amber-400" />
              累计消费
            </div>
            <p className="text-2xl font-bold text-amber-400">
              ¥{personalStats ? personalStats.total_cost.toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="pv-card p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              供给收益
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              ¥{personalStats ? personalStats.total_earned.toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="pv-card p-5">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Laptop className="w-4 h-4 text-blue-400" />
              在线节点
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {personalStats ? `${personalStats.online_nodes}/${personalStats.node_count}` : "0/0"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: 动态 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="pv-card p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                最近动态
              </h3>
              <div className="space-y-3">
                {(personalStats?.recent_activity || []).map((act, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <span className="text-sm text-gray-300">{act.action}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{act.date}</span>
                      <span className="text-amber-400 font-medium">{act.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pv-card p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                个人资源供给
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                你的闲置算力设备（PC / 服务器 / 云实例）都可以接入 PeakValley，在低谷时段为平台提供算力，赚取收益。
              </p>
              <div className="flex gap-3">
                <div className="flex-1 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">个人设备接入</p>
                  <p className="text-lg font-bold">家用 PC / 笔记本</p>
                  <p className="text-xs text-gray-500 mt-1">RTX 3060+ 即可参与</p>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">云端实例调度</p>
                  <p className="text-lg font-bold">弹性云服务器</p>
                  <p className="text-xs text-gray-500 mt-1">按小时计费，低谷更划算</p>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">校园/实验室</p>
                  <p className="text-lg font-bold">集群闲时复用</p>
                  <p className="text-xs text-gray-500 mt-1">夜间算力不浪费</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 升级选项 */}
          <div className="space-y-6">
            <div className="pv-card p-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                升级为团队
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                需要多人协作？升级为企业/团队组织，解锁成员管理、额度分配、用量分析等功能。
              </p>
              <button
                onClick={() => alert("团队创建功能即将上线")}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                创建团队
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pv-card p-6">
              <h3 className="font-medium mb-3 text-sm">平台模式说明</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">C</span>
                  <span><strong className="text-gray-300">消费端</strong>：按需调用 AI 模型，享受峰谷折扣</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">S</span>
                  <span><strong className="text-gray-300">供给端</strong>：共享闲置算力，低谷时段赚取收益</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">P</span>
                  <span><strong className="text-gray-300">平台</strong>：智能调度，削峰补枯，双向撮合</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button onClick={handleSaveName} className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 transition">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setEditingName(false); setNewName(orgInfo.name); }} className="p-1 rounded bg-white/10 hover:bg-white/20 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {orgInfo.name}
                <button onClick={() => setEditingName(true)} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition">
                  <Edit3 className="w-4 h-4" />
                </button>
              </>
            )}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span>{ORG_TYPE_LABELS[orgInfo.type] || orgInfo.type}</span>
            <span>·</span>
            <span>{orgInfo.member_count} 名成员</span>
            <span>·</span>
            <span>额度上限 ¥{orgInfo.quota_limit.toLocaleString()}</span>
            <span>·</span>
            <span>{orgInfo.pricing_tier} 定价</span>
          </div>
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
      {inviteSuccess && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          {inviteSuccess}
          <button onClick={() => setInviteSuccess("")} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { key: "members", label: "成员管理", icon: Users },
          { key: "usage", label: "用量总览", icon: BarChart3 },
          { key: "settings", label: "组织设置", icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === key
                ? "bg-violet-600/20 text-violet-300"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <div>
          {/* Invite Card */}
          <div className="pv-card p-4 mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-violet-400" />
              邀请新成员
            </h3>
            <div className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="输入成员邮箱"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none"
              >
                <option value="member">成员</option>
                <option value="admin">管理员</option>
                <option value="viewer">观察者</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviteLoading}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                邀请
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="pv-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">成员</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">角色</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">余额</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">加入时间</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const roleInfo = ROLE_LABELS[m.role] || ROLE_LABELS.member;
                  const RoleIcon = roleInfo.icon;
                  return (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                            {m.email[0].toUpperCase()}
                          </div>
                          <span>{m.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full ${roleInfo.color} border-0 focus:outline-none cursor-pointer`}
                          disabled={m.id === orgInfo.id && orgInfo.my_role === "enterprise"}
                        >
                          <option value="admin">管理员</option>
                          <option value="member">成员</option>
                          <option value="viewer">观察者</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-400">¥{m.balance.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString("zh-CN") : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemove(m.id, m.email)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition"
                          title="移除成员"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      暂无成员
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="pv-card p-5">
              <p className="text-sm text-gray-400 mb-1">总 Token 消耗</p>
              <p className="text-2xl font-bold text-violet-400">
                {usage ? usage.total_tokens.toLocaleString() : "0"}
              </p>
              <p className="text-xs text-gray-500 mt-1">近30天</p>
            </div>
            <div className="pv-card p-5">
              <p className="text-sm text-gray-400 mb-1">总费用</p>
              <p className="text-2xl font-bold text-amber-400">
                ¥{usage ? usage.total_cost.toFixed(2) : "0.00"}
              </p>
              <p className="text-xs text-gray-500 mt-1">近30天</p>
            </div>
            <div className="pv-card p-5">
              <p className="text-sm text-gray-400 mb-1">人均费用</p>
              <p className="text-2xl font-bold text-emerald-400">
                ¥{usage && usage.members_usage.length > 0
                  ? (usage.total_cost / usage.members_usage.length).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-xs text-gray-500 mt-1">{usage?.members_usage.length || 0} 位活跃成员</p>
            </div>
          </div>

          {/* Per-member breakdown */}
          <div className="pv-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="font-medium flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                成员用量明细
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">成员</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">请求数</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Token</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">费用</th>
                </tr>
              </thead>
              <tbody>
                {(usage?.members_usage || []).map((u) => (
                  <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{u.requests}</td>
                    <td className="px-4 py-3 text-right text-violet-400">{u.tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-amber-400">¥{u.cost.toFixed(4)}</td>
                  </tr>
                ))}
                {(!usage?.members_usage?.length) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">暂无用量数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="pv-card p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              组织基本信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">组织 ID</p>
                <p className="text-sm font-mono text-gray-300">{orgInfo.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">组织类型</p>
                <p className="text-sm">{ORG_TYPE_LABELS[orgInfo.type] || orgInfo.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">创建时间</p>
                <p className="text-sm text-gray-300">
                  {orgInfo.created_at ? new Date(orgInfo.created_at).toLocaleDateString("zh-CN") : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">定价等级</p>
                <p className="text-sm text-gray-300">{orgInfo.pricing_tier}</p>
              </div>
            </div>
          </div>

          <div className="pv-card p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              用量额度
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">已使用 / 额度上限</span>
                  <span className="text-sm text-amber-400">
                    ¥{usage?.total_cost.toFixed(2) || "0.00"} / ¥{orgInfo.quota_limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(((usage?.total_cost || 0) / orgInfo.quota_limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
