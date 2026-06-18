/**
 * @file 媒体管理页面
 * @description 图片上传、标签分类、图片预览与管理。
 */

import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';

export default function MediaManager() {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [allTags, setAllTags] = useState<Record<string, string[]>>({});
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.getMedia().then(setImages).catch(() => {});
    api.getCategories().then(d => {
      setCategories(d.categories);
      setCategoryCounts(d.counts);
    }).catch(() => {});
    api.getAllTags().then(setAllTags).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const filteredImages = filterTag
    ? images.filter(url => allTags[url]?.includes(filterTag))
    : images;

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const res = await api.uploadMedia(file);
        if (editTags.length > 0 && res.url) {
          await api.saveImageTags(res.url, editTags);
        }
      }
    }
    setUploading(false);
    setEditTags([]);
    load();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  }

  function copyPath(url: string) {
    navigator.clipboard.writeText(url);
  }

  async function saveSelectedTags() {
    if (!selectedImg) return;
    await api.saveImageTags(selectedImg, editTags);
    load();
  }

  /** 切换标签选中状态 */
  function toggleTag(tag: string) {
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  useEffect(() => {
    if (selectedImg) {
      setEditTags(allTags[selectedImg] || []);
    }
  }, [selectedImg]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-zinc-950/80 backdrop-blur-sm z-10 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">媒体管理</h1>
          <p className="mt-1 text-sm text-zinc-500">共 {images.length} 张图片</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
          {uploading ? '上传中...' : '上传图片'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
      </div>

      {/* 分类标签过滤 */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterTag(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filterTag === null
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80'
          }`}>
          全部 ({images.length})
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilterTag(filterTag === cat ? null : cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filterTag === cat
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80'
            }`}>
            {cat} ({categoryCounts[cat] || 0})
          </button>
        ))}
      </div>

      {/* 上传标签选择 */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
        <p className="text-xs text-zinc-500 mb-2">上传时添加标签（可多选，可不选）</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => toggleTag(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                editTags.includes(cat) && !selectedImg
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 上传区域 */}
      <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        className="rounded-2xl border-2 border-dashed border-zinc-700/50 bg-zinc-900/30 p-8 text-center transition-colors hover:border-blue-500/30 hover:bg-blue-500/5">
        <svg className="mx-auto w-10 h-10 text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"/></svg>
        <p className="text-sm text-zinc-400">拖拽图片到此处上传</p>
        <p className="text-xs text-zinc-600 mt-1">支持 JPG、PNG、WebP、GIF</p>
      </div>

      {/* 图片网格 */}
      <div className="grid grid-cols-5 gap-3">
        {filteredImages.map(url => (
          <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900 cursor-pointer transition-all hover:border-zinc-600"
            onClick={() => setSelectedImg(selectedImg === url ? null : url)}>
            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white/70 truncate">{url.split('/').pop()}</p>
            </div>
            {allTags[url] && allTags[url].length > 0 && (
              <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                {allTags[url].slice(0, 2).map(tag => (
                  <span key={tag} className="rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] text-white/80">{tag}</span>
                ))}
                {allTags[url].length > 2 && (
                  <span className="rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] text-white/80">+{allTags[url].length - 2}</span>
                )}
              </div>
            )}
            {selectedImg === url && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-xl" />
            )}
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12 text-zinc-600 text-sm">
          {filterTag ? `没有 "${filterTag}" 标签的图片` : '暂无图片'}
        </div>
      )}

      {/* 选中图片详情 */}
      {selectedImg && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-800/60 shrink-0">
              <img src={selectedImg} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 font-mono truncate">{selectedImg}</p>
              <p className="text-xs text-zinc-500 mt-1">{selectedImg.split('/').pop()}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => copyPath(selectedImg)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">复制路径</button>
              <button onClick={() => { navigator.clipboard.writeText(`![](${selectedImg})`); }} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">复制 Markdown</button>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">标签</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => toggleTag(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    editTags.includes(cat)
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/80'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            <button onClick={saveSelectedTags}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors active:scale-95">
              保存标签
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
