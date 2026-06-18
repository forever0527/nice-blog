/**
 * @file 登录页面
 * @description 管理员密码验证，获取 JWT token。
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.login(password);
      localStorage.setItem('admin_token', token);
      navigate('/');
    } catch {
      setError('密码错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/30">
            N
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">后台管理</h1>
          <p className="mt-1 text-sm text-zinc-500">Nice Blog Admin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">管理员密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              placeholder="输入密码"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
