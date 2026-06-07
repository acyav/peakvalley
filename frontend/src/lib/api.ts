/**
 * PeakValley API 请求封装
 */
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await getAuthHeader()),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// ─── 具体接口 ───

export const pricingApi = {
  getCurrent: () => apiFetch<any>("/pricing/current"),
  getSchedule: () => apiFetch<any>("/pricing/schedule"),
};

export const billingApi = {
  getUsage: () => apiFetch<any>("/billing/usage"),
  getBalance: () => apiFetch<any>("/billing/balance"),
  getRecords: (limit = 30) => apiFetch<any>(`/billing/records?limit=${limit}`),
};

export const gatewayApi = {
  listModels: () => apiFetch<any>("/gateway/models"),
};

export const adminApi = {
  getStats: () => apiFetch<any>("/admin/stats"),
  getProviders: () => apiFetch<any>("/admin/providers"),
};

export const orgApi = {
  getInfo: () => apiFetch<any>("/org/info"),
  getMembers: () => apiFetch<any>("/org/members"),
  inviteMember: (email: string, role: string) =>
    apiFetch<any>("/org/invite", { method: "POST", body: JSON.stringify({ email, role }) }),
  removeMember: (memberId: string) =>
    apiFetch<any>(`/org/members/${memberId}`, { method: "DELETE" }),
  updateMemberRole: (memberId: string, role: string) =>
    apiFetch<any>(`/org/members/${memberId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  updateInfo: (data: { name?: string; quota_limit?: number }) =>
    apiFetch<any>("/org/info", { method: "PATCH", body: JSON.stringify(data) }),
  getUsage: () => apiFetch<any>("/org/usage"),
};

export const supplyApi = {
  getAccount: () => apiFetch<any>("/supply/account"),
  getDailyEarnings: () => apiFetch<any>("/supply/earnings/daily"),
  requestWithdrawal: (amount: number, method: string, accountInfo: string) =>
    apiFetch<any>("/supply/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, method, account_info: accountInfo }),
    }),
  getWithdrawals: (limit = 20) => apiFetch<any>(`/supply/withdrawals?limit=${limit}`),
  getNodes: () => apiFetch<any>("/supply/nodes"),
};

// ─── 聊天接口（SSE 流式） ───

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  model: string,
  onDelta: (text: string) => void,
  onBilling: (billing: any) => void,
  onError: (error: string) => void,
  onDone: () => void,
): Promise<void> {
  // 获取 session，如果为空则尝试刷新
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    // 尝试刷新 session
    const { data: refreshData } = await supabase.auth.refreshSession();
    session = refreshData.session;
  }

  const token = session?.access_token;
  if (!token) {
    onError("登录状态已过期，请重新登录");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/chat/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages, model, temperature: 0.7 }),
      signal: AbortSignal.timeout(30000), // 30秒超时
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      onError(err.detail || `请求失败: ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError("无法读取响应流");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.delta) {
            onDelta(parsed.delta);
          }
          if (parsed.billing) {
            onBilling(parsed.billing);
          }
        } catch {
          // 忽略无法解析的行
        }
      }
    }
    onDone();
  } catch (err: any) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      onError("请求超时，模型响应过慢，请切换至 GLM-4 Flash 或稍后重试");
    } else {
      onError(err.message || "请求失败");
    }
    onDone();
  }
}
