/**
 * @file 站点配置页面
 * @description 管理首页和关于页面的所有内容，包括个人信息、社交链接、页脚等。
 */

import { useEffect, useState } from 'react';
import { api, SiteData, AboutData, AboutStat, AboutSkill, AboutTimeline, AboutSocial } from '../api/client';

type Tab = 'site' | 'about';

export default function SiteConfig() {
  const [tab, setTab] = useState<Tab>('site');
  const [site, setSite] = useState<SiteData | null>(null);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getSite().then(setSite).catch(() => {});
    api.getAbout().then(setAbout).catch(() => {});
  }, []);

  async function saveSite() {
    if (!site) return;
    setSaving(true);
    try {
      await api.saveSite(site);
      setMsg('站点配置已保存');
      setTimeout(() => setMsg(''), 2000);
    } finally { setSaving(false); }
  }

  async function saveAbout() {
    if (!about) return;
    setSaving(true);
    try {
      await api.saveAbout(about);
      setMsg('关于页面已保存');
      setTimeout(() => setMsg(''), 2000);
    } finally { setSaving(false); }
  }

  const inputCls = "w-full rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors";
  const labelCls = "block text-xs text-zinc-500 mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-zinc-950/80 backdrop-blur-sm z-10 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">站点配置</h1>
          <p className="mt-1 text-sm text-zinc-500">管理首页和关于页面的内容</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-emerald-400">{msg}</span>}
          <button onClick={tab === 'site' ? saveSite : saveAbout} disabled={saving || !site || !about}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2">
        <button onClick={() => setTab('site')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === 'site' ? 'bg-blue-600 text-white' : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'}`}>
          首页配置
        </button>
        <button onClick={() => setTab('about')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === 'about' ? 'bg-blue-600 text-white' : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'}`}>
          关于页面
        </button>
      </div>

      {/* ========== 首页配置 ========== */}
      {tab === 'site' && site && (
        <div className="space-y-6">
          {/* 个人信息 */}
          <Section title="个人信息">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>昵称</label>
                <input value={site.name} onChange={e => setSite({ ...site, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>副标题</label>
                <input value={site.subtitle} onChange={e => setSite({ ...site, subtitle: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>个人简介</label>
              <textarea value={site.bio} onChange={e => setSite({ ...site, bio: e.target.value })} rows={3} className={inputCls + " resize-none"} />
            </div>
          </Section>

          {/* 背景图 */}
          <Section title="背景图片">
            <div>
              <label className={labelCls}>当前背景</label>
              <input value={site.bgImage} onChange={e => setSite({ ...site, bgImage: e.target.value })} className={inputCls} />
            </div>
            {site.bgImage && (
              <div className="w-full h-40 rounded-xl overflow-hidden bg-zinc-800">
                <img src={site.bgImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <label className={labelCls}>备选背景图列表（每行一个路径）</label>
              <textarea value={site.bgList.join('\n')} onChange={e => setSite({ ...site, bgList: e.target.value.split('\n').filter(Boolean) })} rows={4} className={inputCls + " resize-none font-mono text-xs"} />
            </div>
          </Section>

          {/* 社交链接 */}
          <Section title="首页社交链接">
            {site.socialLinks.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={s.icon} onChange={e => {
                  const socialLinks = [...site.socialLinks]; socialLinks[i] = { ...socialLinks[i], icon: e.target.value }; setSite({ ...site, socialLinks });
                }} placeholder="图标名" className="w-24 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:outline-none" />
                <input value={s.label} onChange={e => {
                  const socialLinks = [...site.socialLinks]; socialLinks[i] = { ...socialLinks[i], label: e.target.value }; setSite({ ...site, socialLinks });
                }} placeholder="名称" className="w-20 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <input value={s.url} onChange={e => {
                  const socialLinks = [...site.socialLinks]; socialLinks[i] = { ...socialLinks[i], url: e.target.value }; setSite({ ...site, socialLinks });
                }} placeholder="URL" className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:outline-none" />
                <button onClick={() => setSite({ ...site, socialLinks: site.socialLinks.filter((_, j) => j !== i) })}
                  className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">✕</button>
              </div>
            ))}
            <button onClick={() => setSite({ ...site, socialLinks: [...site.socialLinks, { icon: '', label: '', url: '' }] })}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ 添加</button>
          </Section>

          {/* 商店链接 */}
          <Section title="商店链接">
            {site.shopLinks.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={s.label} onChange={e => {
                  const shopLinks = [...site.shopLinks]; shopLinks[i] = { ...shopLinks[i], label: e.target.value }; setSite({ ...site, shopLinks });
                }} placeholder="名称" className="w-28 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <input value={s.url} onChange={e => {
                  const shopLinks = [...site.shopLinks]; shopLinks[i] = { ...shopLinks[i], url: e.target.value }; setSite({ ...site, shopLinks });
                }} placeholder="URL" className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:outline-none" />
                <button onClick={() => setSite({ ...site, shopLinks: site.shopLinks.filter((_, j) => j !== i) })}
                  className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">✕</button>
              </div>
            ))}
            <button onClick={() => setSite({ ...site, shopLinks: [...site.shopLinks, { label: '', url: '' }] })}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ 添加</button>
          </Section>

          {/* Footer */}
          <Section title="页脚设置">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>标题</label>
                <input value={site.footer.heading} onChange={e => setSite({ ...site, footer: { ...site.footer, heading: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>版本号</label>
                <input value={site.footer.version} onChange={e => setSite({ ...site, footer: { ...site.footer, version: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>站点描述</label>
              <input value={site.footer.description} onChange={e => setSite({ ...site, footer: { ...site.footer, description: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>建站日期 (ISO)</label>
              <input value={site.footer.startDate} onChange={e => setSite({ ...site, footer: { ...site.footer, startDate: e.target.value } })} className={inputCls} />
            </div>
          </Section>
        </div>
      )}

      {/* ========== 关于页面 ========== */}
      {tab === 'about' && about && (
        <div className="space-y-6">
          {/* 副标题 */}
          <Section title="页面副标题">
            <input value={about.subtitle} onChange={e => setAbout({ ...about, subtitle: e.target.value })} className={inputCls} />
          </Section>

          {/* 个人资料 */}
          <Section title="个人资料">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>名字</label>
                <input value={about.profile.name} onChange={e => setAbout({ ...about, profile: { ...about.profile, name: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>职位</label>
                <input value={about.profile.role} onChange={e => setAbout({ ...about, profile: { ...about.profile, role: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>简介</label>
              <textarea value={about.profile.bio} onChange={e => setAbout({ ...about, profile: { ...about.profile, bio: e.target.value } })} rows={3} className={inputCls + " resize-none"} />
            </div>
          </Section>

          {/* 数据统计 */}
          <Section title="数据统计">
            <div className="grid grid-cols-2 gap-3">
              {about.stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={s.num} onChange={e => {
                    const stats = [...about.stats]; stats[i] = { ...stats[i], num: e.target.value }; setAbout({ ...about, stats });
                  }} placeholder="数值" className="w-16 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                  <input value={s.label} onChange={e => {
                    const stats = [...about.stats]; stats[i] = { ...stats[i], label: e.target.value }; setAbout({ ...about, stats });
                  }} placeholder="标签" className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                  <button onClick={() => setAbout({ ...about, stats: about.stats.filter((_, j) => j !== i) })}
                    className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setAbout({ ...about, stats: [...about.stats, { num: '', label: '' }] })}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ 添加</button>
          </Section>

          {/* 技能 */}
          <Section title="技能">
            {about.skills.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={s.name} onChange={e => {
                  const skills = [...about.skills]; skills[i] = { ...skills[i], name: e.target.value }; setAbout({ ...about, skills });
                }} placeholder="技能名" className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <input type="number" min={0} max={100} value={s.level} onChange={e => {
                  const skills = [...about.skills]; skills[i] = { ...skills[i], level: Number(e.target.value) }; setAbout({ ...about, skills });
                }} className="w-20 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <span className="text-xs text-zinc-600">%</span>
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${s.level}%` }} />
                </div>
                <button onClick={() => setAbout({ ...about, skills: about.skills.filter((_, j) => j !== i) })}
                  className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">✕</button>
              </div>
            ))}
            <button onClick={() => setAbout({ ...about, skills: [...about.skills, { name: '', level: 50 }] })}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ 添加技能</button>
          </Section>

          {/* 时间线 */}
          <Section title="时间线">
            {about.timeline.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <input value={t.year} onChange={e => {
                  const timeline = [...about.timeline]; timeline[i] = { ...timeline[i], year: e.target.value }; setAbout({ ...about, timeline });
                }} placeholder="年份" className="w-16 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <input value={t.title} onChange={e => {
                  const timeline = [...about.timeline]; timeline[i] = { ...timeline[i], title: e.target.value }; setAbout({ ...about, timeline });
                }} placeholder="标题" className="w-28 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <input value={t.desc} onChange={e => {
                  const timeline = [...about.timeline]; timeline[i] = { ...timeline[i], desc: e.target.value }; setAbout({ ...about, timeline });
                }} placeholder="描述" className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <button onClick={() => setAbout({ ...about, timeline: about.timeline.filter((_, j) => j !== i) })}
                  className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">✕</button>
              </div>
            ))}
            <button onClick={() => setAbout({ ...about, timeline: [...about.timeline, { year: '', title: '', desc: '' }] })}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ 添加时间线</button>
          </Section>

          {/* 社交链接 */}
          <Section title="社交链接">
            {about.socials.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={s.icon} onChange={e => {
                  const socials = [...about.socials]; socials[i] = { ...socials[i], icon: e.target.value }; setAbout({ ...about, socials });
                }} placeholder="图标" className="w-20 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:outline-none" />
                <input value={s.label} onChange={e => {
                  const socials = [...about.socials]; socials[i] = { ...socials[i], label: e.target.value }; setAbout({ ...about, socials });
                }} placeholder="名称" className="w-24 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none" />
                <input value={s.url} onChange={e => {
                  const socials = [...about.socials]; socials[i] = { ...socials[i], url: e.target.value }; setAbout({ ...about, socials });
                }} placeholder="URL" className="flex-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:outline-none" />
                <button onClick={() => setAbout({ ...about, socials: about.socials.filter((_, j) => j !== i) })}
                  className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">✕</button>
              </div>
            ))}
            <button onClick={() => setAbout({ ...about, socials: [...about.socials, { icon: '', label: '', url: '' }] })}
              className="rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">+ 添加</button>
          </Section>
        </div>
      )}

      {((tab === 'site' && !site) || (tab === 'about' && !about)) && (
        <div className="text-center py-12 text-zinc-600 text-sm">加载中...</div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      {children}
    </div>
  );
}
