/**
 * @file 链接管理页面
 * @description 友链分组的增删改，操作 links.json 数据。
 */

import { useEffect, useState } from 'react';
import { api, LinksData, LinkGroup, LinkItem } from '../api/client';

export default function LinkManager() {
  const [data, setData] = useState<LinksData>({ title: '', subtitle: '', groups: [] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.getLinks().then(setData).catch(() => {}); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveLinks(data);
      setMsg('已保存');
      setTimeout(() => setMsg(''), 2000);
    } finally {
      setSaving(false);
    }
  }

  function addGroup() {
    setData({ ...data, groups: [...data.groups, { label: '新分组', links: [] }] });
  }

  function removeGroup(idx: number) {
    setData({ ...data, groups: data.groups.filter((_, i) => i !== idx) });
  }

  function updateGroupLabel(idx: number, label: string) {
    const groups = [...data.groups];
    groups[idx] = { ...groups[idx], label };
    setData({ ...data, groups });
  }

  function addLink(groupIdx: number) {
    const groups = [...data.groups];
    groups[groupIdx] = {
      ...groups[groupIdx],
      links: [...groups[groupIdx].links, { name: '', desc: '', url: '' }],
    };
    setData({ ...data, groups });
  }

  function removeLink(groupIdx: number, linkIdx: number) {
    const groups = [...data.groups];
    groups[groupIdx] = {
      ...groups[groupIdx],
      links: groups[groupIdx].links.filter((_, i) => i !== linkIdx),
    };
    setData({ ...data, groups });
  }

  function updateLink(groupIdx: number, linkIdx: number, field: keyof LinkItem, value: string) {
    const groups = [...data.groups];
    const links = [...groups[groupIdx].links];
    links[linkIdx] = { ...links[linkIdx], [field]: value };
    groups[groupIdx] = { ...groups[groupIdx], links };
    setData({ ...data, groups });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-zinc-950/80 backdrop-blur-sm z-10 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">链接管理</h1>
          <p className="mt-1 text-sm text-zinc-500">管理 Link 页面的友链分组和链接</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-emerald-400">{msg}</span>}
          <button onClick={handleSave} disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 页面标题 */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <label className="block text-xs text-zinc-500 mb-1">页面标题</label>
        <input value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
          placeholder="常用工具"
          className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
      </div>

      {/* 页面副标题 */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <label className="block text-xs text-zinc-500 mb-1">页面副标题</label>
        <input value={data.subtitle} onChange={e => setData({ ...data, subtitle: e.target.value })}
          className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
      </div>

      {/* 分组列表 */}
      {data.groups.map((group, gi) => (
        <div key={gi} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <input value={group.label} onChange={e => updateGroupLabel(gi, e.target.value)}
              className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 font-medium focus:border-blue-500 focus:outline-none transition-colors" />
            <button onClick={() => removeGroup(gi)}
              className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/20 transition-colors">删除分组</button>
          </div>

          <div className="space-y-2">
            {group.links.map((link, li) => (
              <div key={li} className="flex items-center gap-2">
                <input value={link.name} onChange={e => updateLink(gi, li, 'name', e.target.value)} placeholder="名称"
                  className="w-28 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                <input value={link.desc} onChange={e => updateLink(gi, li, 'desc', e.target.value)} placeholder="描述"
                  className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none transition-colors" />
                <input value={link.url} onChange={e => updateLink(gi, li, 'url', e.target.value)} placeholder="URL"
                  className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-300 font-mono focus:border-blue-500 focus:outline-none transition-colors" />
                <button onClick={() => removeLink(gi, li)}
                  className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-600/10 transition-colors">✕</button>
              </div>
            ))}
          </div>

          <button onClick={() => addLink(gi)}
            className="rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors">
            + 添加链接
          </button>
        </div>
      ))}

      <button onClick={addGroup}
        className="rounded-2xl border border-dashed border-zinc-700/50 bg-zinc-900/30 p-4 text-center text-sm text-zinc-500 hover:border-blue-500/30 hover:text-zinc-300 transition-all w-full">
        + 添加分组
      </button>
    </div>
  );
}
