"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Code2,
  Palette,
  Briefcase,
  ArrowRight,
  Bot,
  Zap,
  MessageSquare,
} from "lucide-react";

interface Agent {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  tags: string[];
  models: string[];
  samplePrompts: string[];
}

const AGENTS: Agent[] = [
  {
    id: "ai-assistant",
    icon: <Sparkles className="w-8 h-8" />,
    title: "AI 助理",
    subtitle: "全能型智能助手",
    description: "基于 DeepSeek/GLM/千问 多模型驱动，擅长知识问答、逻辑推理、内容创作。适合日常学习、研究、信息处理等场景。",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    tags: ["知识问答", "逻辑推理", "内容创作"],
    models: ["deepseek-chat", "glm-4", "qwen-max"],
    samplePrompts: ["帮我总结一下量子计算的基本原理", "请帮我写一封商务邮件", "分析一下当前 AI 行业的趋势"],
  },
  {
    id: "code-assistant",
    icon: <Code2 className="w-8 h-8" />,
    title: "编码助手",
    subtitle: "程序员的得力伙伴",
    description: "精通 Python、JavaScript、Java、C++ 等主流语言，支持代码生成、代码审查、Bug 修复、算法优化。",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    tags: ["代码生成", "代码审查", "Debug"],
    models: ["deepseek-coder", "glm-4"],
    samplePrompts: ["写一个快速排序算法的 Python 实现", "帮我审查这段代码的性能问题", "解释什么是递归，并给出一个例子"],
  },
  {
    id: "art-creation",
    icon: <Palette className="w-8 h-8" />,
    title: "艺术创作",
    subtitle: "灵感无限的设计伙伴",
    description: "支持文生图提示词优化、设计概念生成、创意写作、品牌文案等。激发你的创意潜能。",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    tags: ["文生图提示词", "创意写作", "品牌文案"],
    models: ["glm-4"],
    samplePrompts: ["为一家咖啡店设计一个品牌故事", "写一个科幻短片的剧本大纲", "优化这段提示词以获得更好的图像效果"],
  },
  {
    id: "office-assistant",
    icon: <Briefcase className="w-8 h-8" />,
    title: "办公辅助",
    subtitle: "高效办公的智能秘书",
    description: "擅长文档撰写、会议纪要整理、邮件起草、数据分析报告、PPT 大纲生成等办公场景。",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    tags: ["文档撰写", "数据分析", "会议纪要"],
    models: ["deepseek-chat", "qwen-max"],
    samplePrompts: ["帮我整理一份会议纪要模板", "分析这组销售数据并给出建议", "写一份季度工作总结报告"],
  },
];

export default function AgentsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const activeAgent = AGENTS.find((a) => a.id === selected);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-violet-400" />
          AI 助手矩阵
        </h1>
        <p className="text-gray-400 mt-2">
          4 类 AI 助手，满足不同场景需求。基于峰谷定价，低谷时段使用成本更低。
        </p>
      </div>

      {!selected ? (
        <div className="grid grid-cols-2 gap-4">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelected(agent.id)}
              className={`group relative p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] ${agent.borderColor} ${agent.bgColor} hover:bg-opacity-20`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-14 h-14 rounded-xl ${agent.bgColor} flex items-center justify-center mb-4 ${agent.color}`}>
                  {agent.icon}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
              </div>
              <h3 className="text-lg font-bold mb-1">{agent.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{agent.subtitle}</p>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{agent.description}</p>
              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="mb-6 text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
          >
            ← 返回助手列表
          </button>

          {activeAgent && (
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Agent Info */}
              <div className="col-span-1">
                <div className={`p-6 rounded-2xl border ${activeAgent.borderColor} ${activeAgent.bgColor}`}>
                  <div className={`w-16 h-16 rounded-xl ${activeAgent.bgColor} flex items-center justify-center mb-4 ${activeAgent.color}`}>
                    {activeAgent.icon}
                  </div>
                  <h2 className="text-xl font-bold mb-2">{activeAgent.title}</h2>
                  <p className="text-sm text-gray-400 mb-4">{activeAgent.subtitle}</p>
                  <p className="text-sm text-gray-500 mb-6">{activeAgent.description}</p>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">支持模型</p>
                    <div className="flex flex-wrap gap-2">
                      {activeAgent.models.map((m) => (
                        <span key={m} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/dashboard/chat")}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    开始对话
                  </button>
                </div>
              </div>

              {/* Right: Sample Prompts */}
              <div className="col-span-2">
                <h3 className="text-lg font-bold mb-4">示例对话</h3>
                <div className="space-y-3">
                  {activeAgent.samplePrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => router.push("/dashboard/chat")}
                      className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 text-left transition group"
                    >
                      <p className="text-sm text-gray-300 group-hover:text-white transition">{prompt}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition">
                        <Zap className="w-3 h-3" />
                        点击开始对话
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    提示：当前为谷时时段，使用成本仅为峰时的 38%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
