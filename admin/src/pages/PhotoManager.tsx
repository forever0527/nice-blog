/**
 * @file 照片管理页面
 * @description 照片的增删改编辑，直接操作 src/content/photos.ts。
 */

import { useEffect, useState } from 'react';
import { api, PhotoItem } from '../api/client';

const emptyPhoto: PhotoItem = {
  slug: '', src: '', title: '', year: '', month: '', day: '', location: '', desc: '',
};

export default function PhotoManager() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [editing, setEditing] = useState<PhotoItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getPhotos().then(setPhotos).catch(() => {}); }, []);

  function startEdit(photo: PhotoItem) {
    setEditing({ ...photo });
    setIsAdding(false);
  }

  function startAdd() {
    const now = new Date();
    setEditing({
      ...emptyPhoto,
      slug: String(Date.now()),
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      day: String(now.getDate()).padStart(2, '0'),
    });
    setIsAdding(true);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      if (isAdding) {
        await api.addPhoto(editing);
      } else {
        const updated = photos.map(p => p.slug === editing.slug ? editing : p);
        await api.savePhotos(updated);
      }
      const fresh = await api.getPhotos();
      setPhotos(fresh);
      setEditing(null);
      setIsAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('确定删除这张照片？')) return;
    await api.deletePhoto(slug);
    const fresh = await api.getPhotos();
    setPhotos(fresh);
    if (editing?.slug === slug) setEditing(null);
  }

  function updateField(field: keyof PhotoItem, value: string) {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-zinc-950/80 backdrop-blur-sm z-10 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">照片管理</h1>
          <p className="mt-1 text-sm text-zinc-500">共 {photos.length} 张照片</p>
        </div>
        <button onClick={startAdd}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          添加照片
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 照片列表 */}
        <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {photos.map(p => (
            <div key={p.slug}
              onClick={() => startEdit(p)}
              className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all ${
                editing?.slug === p.slug
                  ? 'bg-blue-600/10 border border-blue-500/30'
                  : 'bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700'
              }`}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                {p.src && <img src={p.src} alt={p.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 font-medium truncate">{p.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{p.year}.{p.month}.{p.day} · {p.location}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 编辑面板 */}
        <div className="lg:col-span-2">
          {editing ? (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-100">{isAdding ? '添加照片' : '编辑照片'}</h2>
                <div className="flex gap-2">
                  {!isAdding && (
                    <button onClick={() => handleDelete(editing.slug)}
                      className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/20 transition-colors">
                      删除
                    </button>
                  )}
                </div>
              </div>

              {/* 预览 */}
              {editing.src && (
                <div className="w-full max-h-64 rounded-xl overflow-hidden bg-zinc-800">
                  <img src={editing.src} alt={editing.title} className="w-full h-full object-contain max-h-64" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">图片路径 (src)</label>
                  <input value={editing.src} onChange={e => updateField('src', e.target.value)}
                    placeholder="/img/bg/1.webp"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">标题</label>
                  <input value={editing.title} onChange={e => updateField('title', e.target.value)}
                    placeholder="城市 · 黄昏"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">年份</label>
                  <input value={editing.year} onChange={e => updateField('year', e.target.value)}
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">月</label>
                    <input value={editing.month} onChange={e => updateField('month', e.target.value)}
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">日</label>
                    <input value={editing.day} onChange={e => updateField('day', e.target.value)}
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">拍摄地点</label>
                  <input value={editing.location} onChange={e => updateField('location', e.target.value)}
                    placeholder="上海 · 外滩"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">描述</label>
                  <textarea value={editing.desc} onChange={e => updateField('desc', e.target.value)} rows={4}
                    placeholder="照片背后的故事..."
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors resize-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button onClick={() => { setEditing(null); setIsAdding(false); }}
                  className="rounded-lg bg-zinc-800 px-5 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 rounded-2xl border border-dashed border-zinc-800 text-zinc-600 text-sm">
              选择左侧照片进行编辑，或点击「添加照片」
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
