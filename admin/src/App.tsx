/**
 * @file 应用入口与路由配置
 * @description 定义所有页面路由，PrivateRoute 组件负责登录验证。
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './api/client';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ArticleList from './pages/ArticleList';
import ArticleEditor from './pages/ArticleEditor';
import MediaManager from './pages/MediaManager';
import PhotoManager from './pages/PhotoManager';
import LinkManager from './pages/LinkManager';
import AigcManager from './pages/AigcManager';
import SiteConfig from './pages/SiteConfig';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setOk(false); return; }
    api.verify().then(r => setOk(r.valid)).catch(() => setOk(false));
  }, []);

  if (ok === null) return <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">验证中...</div>;
  if (!ok) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="articles" element={<ArticleList />} />
          <Route path="articles/new" element={<ArticleEditor />} />
          <Route path="articles/:slug/edit" element={<ArticleEditor />} />
          <Route path="media" element={<MediaManager />} />
          <Route path="photos" element={<PhotoManager />} />
          <Route path="links" element={<LinkManager />} />
          <Route path="aigc" element={<AigcManager />} />
          <Route path="site" element={<SiteConfig />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
