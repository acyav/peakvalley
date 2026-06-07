"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  BarChart3,
  Receipt,
  Key,
  Clock,
  LogOut,
  Zap,
  MessageSquare,
  Bot,
  CreditCard,
  ExternalLink,
  Building2,
  Wallet,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "总览" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "在线聊天" },
  { href: "/dashboard/agents", icon: Bot, label: "AI助手" },
  { href: "/dashboard/usage", icon: BarChart3, label: "用量" },
  { href: "/dashboard/billing", icon: Receipt, label: "账单" },
  { href: "/dashboard/billing/recharge", icon: CreditCard, label: "充值" },
  { href: "/dashboard/supply", icon: Wallet, label: "收益提现" },
  { href: "/dashboard/api-keys", icon: Key, label: "API Key" },
  { href: "/dashboard/org", icon: Building2, label: "企业组织" },
  { href: "/dashboard/pricing", icon: Clock, label: "价格" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen pv-gradient flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-4 flex flex-col">
        <div className="flex items-center gap-2 px-3 mb-2">
          <Zap className="w-6 h-6 text-violet-400" />
          <span className="text-lg font-bold">PeakValley</span>
        </div>
        <p className="px-3 text-xs text-gray-500 mb-6">AI Token 峰谷调度平台</p>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/10">
            <Link
              href="/supply"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition"
            >
              <ExternalLink className="w-4 h-4" />
              供给端入口
            </Link>
          </div>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-red-400 transition"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
