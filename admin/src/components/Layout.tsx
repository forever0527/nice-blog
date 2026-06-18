/**
 * @file 后台布局组件
 * @description 侧边栏导航 + 内容区的整体布局。
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', icon: '📊', label: '仪表盘' },
  { to: '/articles', icon: '📝', label: '文章管理' },
  { to: '/photos', icon: '📷', label: '照片管理' },
  { to: '/aigc', icon: '🎨', label: 'AIGC 管理' },
  { to: '/links', icon: '🔗', label: '链接管理' },
  { to: '/media', icon: '🖼', label: '媒体管理' },
  { to: '/site', icon: '⚙', label: '站点配置' },
];

export default function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">N</div>
          <span className="text-sm font-semibold text-zinc-200">Nice Blog</span>
          <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-zinc-800 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300 transition-colors"
          >
            <span className="text-base">🌐</span>
            查看博客
          </a>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <span className="text-base">🚪</span>
            退出登录
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 h-screen overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
