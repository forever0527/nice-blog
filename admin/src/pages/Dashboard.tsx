/**
 * @file 仪表盘页面
 * @description 展示文章统计、标签分布、最近发布、构建状态等概览信息。
 */

import { useEffect, useState } from 'react';
import { api, type Article } from '../api/client';

interface Stats {
  total: number;
  drafts: number;
  published: number;
  tags: Record<string, number>;
  recent: Article[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [building, setBuilding] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => { api.getStats().then(setStats).catch(console.error); }, []);
  useEffect(() => {
    const check = () => api.getBuildStatus().then(r => {
      setBuilding(r.building || r.queued);
      setPending(r.pending);
    }).catch(() => {});
    check();
    const timer = setInterval(check, 3000);
    return () => clearInterval(timer);
  }, []);

  if (!stats) return <div className="text-zinc-500">加载中...</div>;

  const cards = [
    { label: '文章总数', value: stats.total, color: 'bg-blue-500' },
    { label: '已发布', value: stats.published, color: 'bg-emerald-500' },
    { label: '草稿', value: stats.drafts, color: 'bg-amber-500' },
    { label: '标签数', value: Object.keys(stats.tags).length, color: 'bg-purple-500' },
  ];

  const tagEntries = Object.entries(stats.tags).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-100">仪表盘</h1>
        <div className="flex items-center gap-3">
          {building && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              正在构建前端...
            </div>
          )}
          {!building && pending && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm text-blue-400">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              等待构建...
            </div>
          )}
          <button onClick={() => api.triggerBuild()} disabled={building}
            className="rounded-lg bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80 disabled:opacity-50 transition-all">
            手动构建
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-zinc-100">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 标签分布 */}
        <div className="col-span-1 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">标签分布</h2>
          <div className="space-y-3">
            {tagEntries.map(([tag, count]) => (
              <div key={tag}>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">{tag}</span>
                  <span className="text-zinc-500">{count} 篇</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {tagEntries.length === 0 && <p className="text-sm text-zinc-600">暂无数据</p>}
          </div>
        </div>

        {/* 最近发布 */}
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">最近发布</h2>
          <div className="divide-y divide-zinc-800">
            {stats.recent.map(a => (
              <div key={a.slug} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{a.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{a.date} · {a.tag}</p>
                </div>
                <span
                  className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.draft ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {a.draft ? '草稿' : '已发布'}
                </span>
              </div>
            ))}
            {stats.recent.length === 0 && <p className="py-4 text-sm text-zinc-600">暂无文章</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
