/**
 * @file AIGC 管理页面
 * @description AI 生成作品的增删改排序，操作 aigc.json 数据。
 */

import { useEffect, useState } from 'react';
import { api, AigcData, AigcWork } from '../api/client';

export default function AigcManager() {
  const [data, setData] = useState<AigcData>({ subtitle: '', works: [] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => { api.getAigc().then(setData).catch(() => {}); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveAigc(data);
      setMsg('已保存');
      setTimeout(() => setMsg(''), 2000);
    } finally {
      setSaving(false);
    }
  }

  function addWork() {
    setData({ ...data, works: [...data.works, { src: '', title: '', model: '', tag: '' }] });
    setEditingIdx(data.works.length);
  }

  function removeWork(idx: number) {
    setData({ ...data, works: data.works.filter((_, i) => i !== idx) });
    if (editingIdx === idx) setEditingIdx(null);
  }

  function updateWork(idx: number, field: keyof AigcWork, value: string) {
    const works = [...data.works];
    works[idx] = { ...works[idx], [field]: value };
    setData({ ...data, works });
  }

  function moveWork(idx: number, dir: -1 | 1) {
    const works = [...data.works];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= works.length) return;
    [works[idx], works[newIdx]] = [works[newIdx], works[idx]];
    setData({ ...data, works });
    setEditingIdx(newIdx);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-zinc-950/80 backdrop-blur-sm z-10 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">AIGC 管理</h1>
          <p className="mt-1 text-sm text-zinc-500">管理 AIGC 页面的作品展示</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-emerald-400">{msg}</span>}
          <button onClick={handleSave} disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 副标题 */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <label className="block text-xs text-zinc-500 mb-1">页面副标题</label>
        <input value={data.subtitle} onChange={e => setData({ ...data, subtitle: e.target.value })}
          className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
      </div>

      {/* 作品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.works.map((work, i) => (
          <div key={i}
            onClick={() => setEditingIdx(editingIdx === i ? null : i)}
            className={`rounded-2xl border bg-zinc-900/50 overflow-hidden cursor-pointer transition-all ${
              editingIdx === i ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800/60 hover:border-zinc-700'
            }`}>
            {/* 预览 */}
            <div className="aspect-video bg-zinc-800 relative">
              {work.src && <img src={work.src} alt={work.title} className="w-full h-full object-cover" />}
              {!work.src && <div className="flex items-center justify-center h-full text-zinc-600 text-sm">无图片</div>}
              <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={e => { e.stopPropagation(); moveWork(i, -1); }}
                  className="rounded-md bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white/70 hover:text-white">↑</button>
                <button onClick={e => { e.stopPropagation(); moveWork(i, 1); }}
                  className="rounded-md bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white/70 hover:text-white">↓</button>
              </div>
              {work.tag && (
                <span className="absolute top-2 left-2 rounded-md bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white/80">{work.tag}</span>
              )}
            </div>

            <div className="p-3">
              <p className="text-sm text-zinc-200 font-medium">{work.title || '未命名'}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{work.model}</p>
            </div>

            {/* 编辑表单 */}
            {editingIdx === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/60 pt-3" onClick={e => e.stopPropagation()}>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">图片路径</label>
                  <input value={work.src} onChange={e => updateWork(i, 'src', e.target.value)} placeholder="/img/bg/0-1.webp"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-300 font-mono focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">标题</label>
                    <input value={work.title} onChange={e => updateWork(i, 'title', e.target.value)}
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">标签</label>
                    <input value={work.tag} onChange={e => updateWork(i, 'tag', e.target.value)}
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 mb-1">生成模型</label>
                    <input value={work.model} onChange={e => updateWork(i, 'model', e.target.value)} placeholder="Midjourney"
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                  <button onClick={() => removeWork(i)}
                    className="mt-5 rounded-lg bg-red-600/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/20 transition-colors">删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addWork}
        className="rounded-2xl border border-dashed border-zinc-700/50 bg-zinc-900/30 p-6 text-center text-sm text-zinc-500 hover:border-blue-500/30 hover:text-zinc-300 transition-all w-full">
        + 添加作品
      </button>
    </div>
  );
}
