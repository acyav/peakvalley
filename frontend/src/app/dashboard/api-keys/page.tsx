"use client";

import { useState } from "react";

export default function ApiKeysPage() {
  const [keys] = useState([
    { id: "1", prefix: "pv-a3f2", name: "开发测试", created: "2026-06-07", lastUsed: "刚刚" },
  ]);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Key 管理</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition"
        >
          + 创建 Key
        </button>
      </div>

      {showCreate && (
        <div className="pv-card p-6">
          <h3 className="font-semibold mb-3">创建新的 API Key</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Key 名称（如：开发环境）"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition">
                创建
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pv-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 bg-white/5">
              <th className="text-left px-4 py-3">名称</th>
              <th className="text-left px-4 py-3">前缀</th>
              <th className="text-left px-4 py-3">创建时间</th>
              <th className="text-left px-4 py-3">最后使用</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-t border-white/5">
                <td className="px-4 py-3">{key.name}</td>
                <td className="px-4 py-3 font-mono text-violet-400">{key.prefix}...</td>
                <td className="px-4 py-3 text-gray-400">{key.created}</td>
                <td className="px-4 py-3 text-gray-400">{key.lastUsed}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-red-400 hover:text-red-300 text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pv-card p-6">
        <h3 className="font-semibold mb-3">使用方式</h3>
        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-gray-300">
          <p className="text-gray-500 mb-1"># Python 示例 - 只需改 base_url</p>
          <pre>{`from openai import OpenAI

client = OpenAI(
    base_url="https://api.peakvalley.cn/api/v1/gateway",
    api_key="pv-your-key-here"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "你好"}]
)`}</pre>
        </div>
      </div>
    </div>
  );
}
