/**
 * @file 文章编辑器
 * @description Markdown 文章的创建与编辑，支持实时预览、图片上传、快捷键保存。
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { api, type ArticleDetail } from '../api/client';

marked.setOptions({ breaks: true, gfm: true });

function renderMd(src: string): string {
  return marked.parse(src) as string;
}

export default function ArticleEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = !slug;

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tag, setTag] = useState('');
  const [color, setColor] = useState('#0040ff');
  const [img, setImg] = useState('/img/bg/1.webp');
  const [content, setContent] = useState('');
  const [draft, setDraft] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [dirty, setDirty] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaList, setMediaList] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const originalRef = useRef('');

  // 加载文章
  useEffect(() => {
    if (slug) {
      api.getArticle(slug).then(a => {
        setTitle(a.title);
        setDesc(a.desc);
        setDate(a.date);
        setTag(a.tag);
        setColor(a.color || '#0040ff');
        setImg(a.img || '/img/bg/1.webp');
        setContent(a.content || '');
        setDraft(a.draft || false);
        setTimeout(() => { originalRef.current = JSON.stringify({ title: a.title, desc: a.desc, date: a.date, tag: a.tag, color: a.color, img: a.img, content: a.content }); }, 100);
      });
    }
  }, [slug]);

  // 脏标记
  useEffect(() => {
    if (!originalRef.current) return;
    const current = JSON.stringify({ title, desc, date, tag, color, img, content });
    setDirty(current !== originalRef.current);
  }, [title, desc, date, tag, color, img, content]);

  // 未保存提醒
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Ctrl+S 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(draft);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  async function handleSave(isDraft: boolean) {
    if (!title.trim()) { alert('请输入标题'); return; }
    setSaving(true);
    try {
      const data = { title, desc, date, tag, color, img, content, draft: isDraft };
      if (isNew) {
        const res = await api.createArticle({ ...data, slug: customSlug || undefined });
        navigate(`/articles/${res.slug}/edit`);
      } else {
        await api.updateArticle(slug!, data);
      }
      setDraft(isDraft);
      originalRef.current = JSON.stringify({ title, desc, date, tag, color, img, content });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      alert(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  // Markdown 工具栏操作
  function insertMarkdown(prefix: string, suffix = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = `${before}${prefix}${selected || '文本'}${suffix}${after}`;
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      const newCursor = start + prefix.length + (selected ? selected.length : 2);
      ta.setSelectionRange(newCursor, newCursor);
    }, 0);
  }

  // 图片上传
  async function handleImageUpload(file: File) {
    const res = await api.uploadMedia(file);
    insertMarkdown(`![图片](${res.url})`);
    return res.url;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(f => handleImageUpload(f));
  }

  // 加载媒体库
  useEffect(() => {
    api.getMedia().then(setMediaList).catch(() => {});
  }, []);

  // 字数统计
  const charCount = content.length;
  const wordCount = content.replace(/[\s\n]/g, '').length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 400));

  const toolbar = [
    { label: 'B', title: '加粗 Ctrl+B', action: () => insertMarkdown('**', '**') },
    { label: 'I', title: '斜体 Ctrl+I', action: () => insertMarkdown('*', '*') },
    { label: 'S', title: '删除线', action: () => insertMarkdown('~~', '~~') },
    { label: 'H1', title: '一级标题', action: () => insertMarkdown('\n# ') },
    { label: 'H2', title: '二级标题', action: () => insertMarkdown('\n## ') },
    { label: 'H3', title: '三级标题', action: () => insertMarkdown('\n### ') },
    null as null,
    { label: '•', title: '无序列表', action: () => insertMarkdown('\n- ') },
    { label: '1.', title: '有序列表', action: () => insertMarkdown('\n1. ') },
    { label: '☑', title: '任务列表', action: () => insertMarkdown('\n- [ ] ') },
    null as null,
    { label: '>', title: '引用', action: () => insertMarkdown('\n> ') },
    { label: '—', title: '分割线', action: () => insertMarkdown('\n\n---\n\n') },
    { label: '|', title: '表格', action: () => insertMarkdown('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n') },
    null as null,
    { label: '</>', title: '行内代码', action: () => insertMarkdown('`', '`') },
    { label: '{ }', title: '代码块', action: () => insertMarkdown('\n```js\n', '\n```\n') },
    { label: '🔗', title: '链接', action: () => insertMarkdown('[', '](url)') },
    null as null,
    { label: '📷', title: '上传图片', action: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = () => { Array.from(input.files || []).forEach(f => handleImageUpload(f)); };
      input.click();
    }},
    { label: '🖼', title: '从图库选择', action: () => { setShowImagePicker(true); api.getMedia().then(setMediaList); } },
  ];

  return (
    <div className="space-y-5">
      {/* 顶栏 */}
      <div className="flex items-center justify-between sticky top-0 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-zinc-950/80 backdrop-blur-sm z-10 border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/articles')} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            返回
          </button>
          <h1 className="text-xl font-bold text-zinc-100">{isNew ? '新建文章' : '编辑文章'}</h1>
          {dirty && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">未保存</span>}
          {saved && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">已保存</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">Ctrl+S 保存</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${draft ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-xs text-zinc-500">{draft ? '草稿' : '已发布'}</span>
          </div>
          <button onClick={() => handleSave(false)} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            {saving ? '保存中...' : '发布'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="rounded-xl border border-zinc-700/60 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-all">
            保存草稿
          </button>
        </div>
      </div>

      {/* 元信息卡片 */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 space-y-3">
        {/* 第一行：标题(短) + 摘要(长) */}
        <div className="grid grid-cols-[35%_1fr] gap-3">
          <div>
            <label className="mb-1 block text-[10px] text-zinc-500">标题</label>
            <textarea value={title} onChange={e => setTitle(e.target.value)} rows={2}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm font-semibold text-zinc-100 outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-zinc-500"
              placeholder="文章标题" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-zinc-500">摘要</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-zinc-500"
              placeholder="文章摘要" />
          </div>
        </div>

        {/* 第二行：日期 + 标签 + 颜色 + 封面图 */}
        <div className="flex items-end gap-3">
          <div className="w-32">
            <label className="mb-1 block text-[10px] text-zinc-500">日期</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50" />
          </div>
          <div className="w-24">
            <label className="mb-1 block text-[10px] text-zinc-500">标签</label>
            <input value={tag} onChange={e => setTag(e.target.value)}
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50" placeholder="前端" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-zinc-500">颜色</label>
            <div className="flex items-center gap-1">
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-zinc-700/60 bg-transparent" />
              {['#0040ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-4 h-4 rounded border transition-all shrink-0 ${color === c ? 'border-white scale-125' : 'border-transparent hover:scale-125'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-zinc-500">封面图</label>
            <div className="flex gap-1.5">
              <input value={img} onChange={e => setImg(e.target.value)}
                className="w-40 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-2 py-1.5 text-xs text-zinc-300 font-mono outline-none focus:border-blue-500/50 truncate"
                placeholder="/img/bg/1.webp" />
              <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange = async () => { const f = i.files?.[0]; if(f){ const r = await api.uploadMedia(f); setImg(r.url); } }; i.click(); }}
                className="shrink-0 rounded-lg bg-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-700 transition-colors">上传</button>
              <button onClick={() => setShowImagePicker(true)}
                className="shrink-0 rounded-lg bg-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-700 transition-colors">图库</button>
            </div>
          </div>
          {isNew && (
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              <span className="text-[10px] text-zinc-500 font-mono">/blog/</span>
              <input value={customSlug} onChange={e => setCustomSlug(e.target.value)}
                className="w-24 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-2 py-1.5 text-xs text-zinc-300 font-mono outline-none focus:border-blue-500/50"
                placeholder="自动" />
            </div>
          )}
        </div>

        {/* 第三行：封面图预览 */}
        {img && (
          <div className="w-full h-24 rounded-xl overflow-hidden border border-zinc-800/60 bg-zinc-800/30">
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* 编辑器 */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
        {/* 工具栏 */}
        <div className="flex items-center gap-0.5 border-b border-zinc-800/60 px-3 py-2 flex-wrap">
          {toolbar.map((t, i) => {
            if (t === null) return <div key={i} className="w-px h-5 bg-zinc-700/50 mx-1" />;
            return (
              <button key={i} onClick={t.action} title={t.title}
                className="flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1.5 text-xs font-bold text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200 transition-all active:scale-90">
                {t.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-[11px] text-zinc-600">
            <span>{charCount} 字符</span>
            <span>·</span>
            <span>约 {readingTime} 分钟阅读</span>
          </div>
          <div className="w-px h-5 bg-zinc-700/50 mx-1" />
          <button onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${showPreview ? 'bg-blue-600/15 text-blue-400' : 'text-zinc-400 hover:bg-zinc-700/60'}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {showPreview ? '编辑' : '预览'}
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex min-h-[520px] relative">
          {/* 编辑区 */}
          <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            className="flex-1 resize-none bg-transparent p-5 font-mono text-[13px] leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
            placeholder="支持 Markdown 语法&#10;&#10;可拖拽多张图片到此处批量上传&#10;点击工具栏 🖼 可从图库选择已有图片"
            style={{ display: showPreview ? 'none' : 'block' }}
          />

          {/* 预览区 */}
          {showPreview && (
            <div className="flex-1 p-5 overflow-auto">
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: content ? renderMd(content) : '<p style="color:#52525b">暂无内容</p>' }}
              />
            </div>
          )}

          {/* 拖拽提示层 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity" id="drop-hint">
            <div className="rounded-2xl border-2 border-dashed border-blue-500/50 bg-blue-500/5 px-8 py-6 text-center">
              <p className="text-sm text-blue-400 font-medium">拖拽图片到此处上传</p>
            </div>
          </div>
        </div>
      </div>

      {/* 图片选择弹窗 */}
      {showImagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowImagePicker(false)}>
          <div className="w-full max-w-3xl max-h-[80vh] rounded-2xl border border-zinc-700/50 bg-zinc-900 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200">选择图片</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{mediaList.length} 张图片</span>
                <button onClick={() => setShowImagePicker(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-4 gap-3">
                {mediaList.map(url => (
                  <button key={url} onClick={() => { setImg(url); setShowImagePicker(false); }}
                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded-lg">选择</span>
                    </div>
                  </button>
                ))}
                {mediaList.length === 0 && (
                  <div className="col-span-4 py-12 text-center text-sm text-zinc-500">暂无图片，请先上传</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
