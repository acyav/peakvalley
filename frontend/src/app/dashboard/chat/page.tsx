"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Loader2, Trash2, AlertCircle, Zap } from "lucide-react";
import { streamChat, ChatMessage } from "@/lib/api";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  billing?: {
    tier: string;
    multiplier: number;
    cost: number;
    tokens: number;
    remaining_balance: number;
  };
}

const WELCOME_MSG: DisplayMessage = {
  role: "assistant",
  content: "你好！我是 PeakValley AI 助手。我已连接真实 LLM 模型，可以帮你回答各种问题。试试切换不同模型对话吧！",
  timestamp: new Date(),
};

const MODELS = [
  { id: "glm-4", name: "GLM-4 Flash", badge: "免费", badgeColor: "bg-emerald-500/20 text-emerald-400" },
  { id: "deepseek-chat", name: "DeepSeek Chat", badge: "推荐", badgeColor: "bg-violet-500/20 text-violet-400" },
  { id: "qwen-max", name: "通义千问", badge: "高速", badgeColor: "bg-blue-500/20 text-blue-400" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("glm-4");
  const [lastBilling, setLastBilling] = useState<DisplayMessage["billing"]>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const getCurrentTier = () => {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 8) return { label: "谷时", multiplier: 0.5, color: "text-emerald-400" };
    if (hour >= 10 && hour < 18) return { label: "峰时", multiplier: 1.3, color: "text-rose-400" };
    return { label: "平时", multiplier: 1.0, color: "text-amber-400" };
  };
  const tier = getCurrentTier();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: DisplayMessage = { role: "user", content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setErrorMsg("");

    // 准备消息历史（发送给 API 的格式）
    const apiMessages: ChatMessage[] = [...messages, userMsg]
      .map((m) => ({ role: m.role, content: m.content }));

    // 添加空的 assistant 消息占位
    const assistantMsg: DisplayMessage = { role: "assistant", content: "", timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMsg]);

    let fullContent = "";

    await streamChat(
      apiMessages,
      model,
      // onDelta - 逐字追加
      (delta) => {
        fullContent += delta;
        setMessages((prev) => {
          const arr = [...prev];
          arr[arr.length - 1] = {
            ...arr[arr.length - 1],
            content: fullContent,
          };
          return arr;
        });
      },
      // onBilling - 计费信息
      (billing) => {
        setLastBilling(billing);
        setMessages((prev) => {
          const arr = [...prev];
          arr[arr.length - 1] = {
            ...arr[arr.length - 1],
            billing,
          };
          return arr;
        });
      },
      // onError
      (error) => {
        setErrorMsg(error);
        if (!fullContent) {
          setMessages((prev) => {
            const arr = [...prev];
            arr[arr.length - 1] = {
              ...arr[arr.length - 1],
              content: `⚠️ 请求出错：${error}`,
            };
            return arr;
          });
        }
      },
      // onDone
      () => {
        setLoading(false);
      },
    );
  };

  const clearChat = () => {
    setMessages([WELCOME_MSG]);
    setLastBilling(null);
    setErrorMsg("");
  };

  const selectedModelInfo = MODELS.find((m) => m.id === model);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            在线聊天
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            当前时段：<span className={tier.color}>{tier.label}</span>
            <span className="text-gray-500 ml-2">{tier.multiplier}x 价格</span>
            {lastBilling && (
              <span className="ml-3 text-gray-500">
                · 余额 <span className="text-emerald-400">¥{lastBilling.remaining_balance}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="px-3 py-1.5 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {selectedModelInfo && (
              <span className={`absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full ${selectedModelInfo.badgeColor}`}>
                {selectedModelInfo.badge}
              </span>
            )}
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-red-400 transition"
            title="清空对话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant"
                ? "bg-violet-500/20"
                : "bg-white/10"
            }`}>
              {msg.role === "assistant" ? (
                <Sparkles className="w-4 h-4 text-violet-400" />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "assistant"
                ? "bg-white/5 border border-white/10"
                : "bg-violet-600/20 border border-violet-500/30"
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {msg.billing && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Zap className="w-3 h-3" />
                    <span>{msg.billing.tokens} tokens</span>
                    <span>· ¥{msg.billing.cost.toFixed(6)}</span>
                    <span className={
                      msg.billing.tier === "valley" ? "text-emerald-400" :
                      msg.billing.tier === "peak" ? "text-rose-400" : "text-amber-400"
                    }>
                      {msg.billing.tier === "valley" ? "谷" : msg.billing.tier === "peak" ? "峰" : "平"}{msg.billing.multiplier}x
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                <span className="text-sm text-gray-400">正在思考...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="输入消息，按 Enter 发送..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            发送
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          已连接真实 LLM · 当前模型：{selectedModelInfo?.name || model} · AI 生成内容仅供参考
        </p>
      </div>
    </div>
  );
}
