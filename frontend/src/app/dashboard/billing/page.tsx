"use client";

import { useEffect, useState } from "react";
import { billingApi } from "@/lib/api";

export default function BillingPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    billingApi.getBalance().then((d) => setBalance(d.balance)).catch(console.error);
    billingApi.getRecords().then((d) => setRecords(d.records || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">账单</h1>

      <div className="pv-card p-6">
        <p className="text-sm text-gray-400">当前余额</p>
        <p className="text-4xl font-bold font-mono mt-2">
          ¥{balance?.toFixed(2) ?? "--"}
        </p>
      </div>

      <div className="pv-card p-6">
        <h3 className="text-lg font-semibold mb-4">历史账单</h3>
        {records.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无账单记录</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-2">账期</th>
                <th className="text-right py-2">Token 数</th>
                <th className="text-right py-2">费用</th>
                <th className="text-right py-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-2">{r.period_start}</td>
                  <td className="text-right py-2 font-mono">{r.total_tokens?.toLocaleString()}</td>
                  <td className="text-right py-2 font-mono">¥{r.total_cost?.toFixed(2)}</td>
                  <td className="text-right py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      r.status === "paid" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {r.status === "paid" ? "已付" : "待付"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
