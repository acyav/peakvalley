"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Building2, Sparkles, Code2, Palette, Briefcase } from "lucide-react";

const STEPS = [
  { id: "type", label: "选择身份" },
  { id: "info", label: "填写信息" },
  { id: "done", label: "注册完成" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState<"individual" | "enterprise" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const role = userType === "enterprise" ? "org_admin" : "user";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, name, org_name: orgName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep(2);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  const benefits = [
    { icon: <Sparkles className="w-5 h-5" />, title: "AI助理", desc: "智能对话、知识问答" },
    { icon: <Code2 className="w-5 h-5" />, title: "编码助手", desc: "代码生成、Debug" },
    { icon: <Palette className="w-5 h-5" />, title: "艺术创作", desc: "文生图、设计辅助" },
    { icon: <Briefcase className="w-5 h-5" />, title: "办公辅助", desc: "文档、邮件、翻译" },
  ];

  return (
    <div className="min-h-screen pv-gradient flex items-center justify-center px-4">
      <div className="pv-card p-8 w-full max-w-lg">
        {/* 步骤条 */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                i <= step
                  ? "bg-violet-600 text-white"
                  : "bg-white/10 text-gray-500"
              }`}>
                {i + 1}
              </div>
              <span className={`ml-2 text-sm ${i <= step ? "text-white" : "text-gray-500"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition ${
                  i < step ? "bg-violet-600" : "bg-white/10"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: 选择身份 */}
        {step === 0 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">选择使用身份</h1>
              <p className="text-gray-400 mt-2">根据您的需求选择合适的服务模式</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setUserType("individual"); setStep(1); }}
                className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <User className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-bold text-lg mb-1">个人开发者</h3>
                <p className="text-sm text-gray-400">适合独立开发者、学生、AI爱好者</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">按量付费</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">API调用</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">在线聊天</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setUserType("enterprise"); setStep(1); }}
                className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-1">企业用户</h3>
                <p className="text-sm text-gray-400">适合公司、团队、算力共享</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">组织池</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">阶梯折扣</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">月结发票</span>
                </div>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                我们提供 4 类 AI 助手，满足不同场景需求：
              </p>
              <div className="flex justify-center gap-4 mt-3">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="text-violet-400">{b.icon}</span>
                    <span>{b.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: 填写信息 */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">
                {userType === "enterprise" ? "企业注册" : "个人注册"}
              </h1>
              <p className="text-gray-400 mt-2">
                {userType === "enterprise"
                  ? "创建组织，享受企业级服务"
                  : "注册即送 ¥10 体验金"}
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  required
                />
              </div>

              {userType === "enterprise" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">企业名称</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  密码
                  <span className="text-xs text-gray-500 ml-2">（至少8位，含大小写+数字+特殊字符）</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  required
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 py-2.5 border border-white/10 rounded-lg font-medium hover:border-white/30 transition"
                >
                  上一步
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {loading ? "注册中..." : "注册"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: 完成 */}
        {step === 2 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">注册成功！</h2>
            <p className="text-gray-400">已发送验证邮件，请查收后登录</p>
            <p className="text-sm text-gray-500 mt-4">2秒后自动跳转...</p>
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          已有账号？{" "}
          <a href="/login" className="text-violet-400 hover:underline">
            登录
          </a>
        </p>
      </div>
    </div>
  );
}
