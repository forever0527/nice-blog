/**
 * @file 文章列表页面
 * @description 文章的增删改查、批量操作、搜索筛选。
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Article } from '../api/client';

function formatDate(d: string) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function daysAgo(d: string) {
  if (!d) return 999;
  const date = new Date(d);
  if (isNaN(date.getTime())) return 999;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [batchTag, setBatchTag] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api.getArticles().then(setArticles).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = articles.filter(a => {
    if (filter === 'draft' && !a.draft) return false;
    if (filter === 'published' && a.draft) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.tag.toLowerCase().includes(q) && !a.slug.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    all: articles.length,
    published: articles.filter(a => !a.draft).length,
    draft: articles.filter(a => a.draft).length,
  };

  const toggleSelect = (slug: string) => {
    const next = new Set(selected);
    next.has(slug) ? next.delete(slug) : next.add(slug);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.slug)));
  };

  const handleDelete = async (slug: string) => {
    await api.deleteArticle(slug);
    setDeleteTarget(null);
    load();
  };

  const handleBatchDelete = async () => {
    await api.batchDelete([...selected]);
    setSelected(new Set());
    setBatchDeleteOpen(false);
    load();
  };

  const handleBatchTag = async () => {
    if (!batchTag || !selected.size) return;
    await api.batchTag([...selected], batchTag);
    setSelected(new Set());
    setBatchTag('');
    load();
  };

  const handleBatchDraft = async (draft: boolean) => {
    await api.batchDraft([...selected], draft);
    setSelected(new Set());
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-zinc-950/80 backdrop-blur-sm z-10 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">文章管理</h1>
          <p className="mt-1 text-sm text-zinc-500">共 {articles.length} 篇，{counts.published} 已发布，{counts.draft} 草稿</p>
        </div>
        <Link
          to="/articles/new"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
          新建文章
        </Link>
      </div>

      {/* 筛选 + 搜索 */}
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm">
        <div className="flex gap-1 rounded-xl bg-zinc-800/50 p-1">
          {([
            { key: 'all', label: '全部', count: counts.all },
            { key: 'published', label: '已发布', count: counts.published },
            { key: 'draft', label: '草稿', count: counts.draft },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm transition-all ${
                filter === f.key
                  ? 'bg-zinc-700/80 text-zinc-100 font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40'
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1 py-0.5 rounded-md ${
                filter === f.key ? 'bg-zinc-600/60 text-zinc-300' : 'bg-zinc-800/60 text-zinc-500'
              }`}>{f.count}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索标题、标签..."
            className="w-56 rounded-xl border border-zinc-700/60 bg-zinc-800/50 pl-9 pr-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* 批量操作 */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-[10px] font-bold text-white">{selected.size}</span>
            <span className="text-sm text-blue-300">已选</span>
          </div>
          <div className="h-4 w-px bg-blue-500/20" />
          <div className="flex items-center gap-2">
            <input
              value={batchTag}
              onChange={e => setBatchTag(e.target.value)}
              placeholder="新标签名"
              className="w-28 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-2.5 py-1.5 text-sm text-zinc-200 outline-none focus:border-blue-500/50"
            />
            <button onClick={handleBatchTag} disabled={!batchTag} className="rounded-lg bg-zinc-800/80 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 transition-all">改标签</button>
          </div>
          <button onClick={() => handleBatchDraft(false)} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all">发布</button>
          <button onClick={() => handleBatchDraft(true)} className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/20 transition-all">转草稿</button>
          <button onClick={() => setBatchDeleteOpen(true)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 transition-all">删除</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-zinc-500 hover:text-zinc-300 transition-colors">取消</button>
        </div>
      )}

      {/* 文章卡片列表 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({length:5}).map((_,i) => (
            <div key={i} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-5 h-5 rounded bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-zinc-800" />
                  <div className="h-3 w-72 rounded bg-zinc-800/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 bg-zinc-900/30 py-16">
          <svg className="w-12 h-12 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          <p className="text-zinc-500 font-medium">{search ? '没有找到匹配的文章' : '还没有文章'}</p>
          <p className="text-zinc-600 text-sm mt-1">{search ? '试试其他关键词' : '点击右上角新建第一篇'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const recent = daysAgo(a.date) < 7;
            return (
              <div key={a.slug} className={`group relative flex items-center gap-4 rounded-2xl border bg-zinc-900/40 px-5 py-4 transition-all hover:bg-zinc-900/80 hover:border-zinc-700/60 ${
                selected.has(a.slug) ? 'border-blue-500/30 bg-blue-500/5' : 'border-zinc-800/50'
              }`}>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(a.slug)}
                  onChange={() => toggleSelect(a.slug)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500/30 accent-blue-500 cursor-pointer"
                />

                {/* 封面缩略图 */}
                {a.img && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-800/60">
                    <img src={a.img} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-zinc-200 truncate max-w-md group-hover:text-blue-400 transition-colors">{a.title}</h3>
                    {recent && (
                      <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 tracking-wide">NEW</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500 max-w-lg leading-relaxed">{a.desc || '暂无摘要'}</p>
                </div>

                {/* 标签 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/90"
                    style={{ backgroundColor: a.color || '#0040ff' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    {a.tag}
                  </span>
                </div>

                {/* 日期 */}
                <div className="shrink-0 text-right w-24">
                  <p className={`text-xs font-medium ${recent ? 'text-emerald-400' : 'text-zinc-500'}`}>{formatDate(a.date)}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{a.date}</p>
                </div>

                {/* 状态 */}
                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                    a.draft
                      ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.draft ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    {a.draft ? '草稿' : '已发布'}
                  </span>
                </div>

                {/* 操作 */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/articles/${a.slug}/edit`}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                    编辑
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(a.slug)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部统计 */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-zinc-600 pt-2">
          <span>显示 {filtered.length} / {articles.length} 篇</span>
          <span>排序：按日期降序</span>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">确认删除</h3>
                <p className="text-xs text-zinc-500 mt-0.5">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              确定要删除文章 <span className="font-medium text-zinc-200">「{deleteTarget}」</span> 吗？
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors">取消</button>
              <button onClick={() => handleDelete(deleteTarget)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-95">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      {batchDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBatchDeleteOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">批量删除</h3>
                <p className="text-xs text-zinc-500 mt-0.5">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              确定要删除选中的 <span className="font-bold text-red-400">{selected.size}</span> 篇文章吗？
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBatchDeleteOpen(false)} className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors">取消</button>
              <button onClick={handleBatchDelete} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-95">确认删除 {selected.size} 篇</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
