/**
 * @file API 客户端
 * @module api/client
 * @description 封装所有后端 API 请求，统一处理 JWT 认证和 401 跳转。
 */

const BASE_URL = '/api';

/** 从 localStorage 获取 JWT token */
function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

/**
 * 通用请求函数
 * @param url - API 路径（不含 /api 前缀）
 * @param options - fetch 配置项
 * @returns 解析后的 JSON 响应
 * @throws 401 时自动跳转登录页
 */
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  if (res.status === 401) {
    if (!url.includes('/auth/login')) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    throw new Error('未授权');
  }
  return res.json();
}

// ========== 类型定义 ==========

/** 文章摘要 */
export interface Article {
  slug: string;
  title: string;
  desc: string;
  date: string;
  tag: string;
  color: string;
  img: string;
  draft?: boolean;
}

/** 文章详情（含正文） */
export interface ArticleDetail extends Article {
  content: string;
}

/** 创建文章参数 */
export interface CreateArticle {
  slug?: string;
  title: string;
  desc: string;
  date?: string;
  tag?: string;
  color?: string;
  img?: string;
  content?: string;
}

/** 更新文章参数 */
export interface UpdateArticle {
  title: string;
  desc: string;
  date: string;
  tag: string;
  color?: string;
  img?: string;
  content?: string;
  draft?: boolean;
}

/** 照片项 */
export interface PhotoItem {
  slug: string;
  src: string;
  title: string;
  year: string;
  month: string;
  day: string;
  location: string;
  desc: string;
}

/** 链接项 */
export interface LinkItem {
  name: string;
  desc: string;
  url: string;
}

/** 链接分组 */
export interface LinkGroup {
  label: string;
  links: LinkItem[];
}

/** 链接页面数据 */
export interface LinksData {
  title: string;
  subtitle: string;
  groups: LinkGroup[];
}

/** AIGC 作品项 */
export interface AigcWork {
  src: string;
  title: string;
  model: string;
  tag: string;
}

/** AIGC 页面数据 */
export interface AigcData {
  subtitle: string;
  works: AigcWork[];
}

/** 关于页统计项 */
export interface AboutStat {
  num: string;
  label: string;
}

/** 关于页技能项 */
export interface AboutSkill {
  name: string;
  level: number;
}

/** 关于页时间线条目 */
export interface AboutTimeline {
  year: string;
  title: string;
  desc: string;
}

/** 社交链接项 */
export interface AboutSocial {
  icon: string;
  label: string;
  url: string;
}

/** 关于页数据 */
export interface AboutData {
  subtitle: string;
  profile: { name: string; role: string; bio: string };
  stats: AboutStat[];
  skills: AboutSkill[];
  timeline: AboutTimeline[];
  socials: AboutSocial[];
}

/** 站点配置数据 */
export interface SiteData {
  name: string;
  subtitle: string;
  bio: string;
  bgImage: string;
  bgList: string[];
  socialLinks: AboutSocial[];
  shopLinks: { label: string; url: string }[];
  footer: { heading: string; description: string; startDate: string; version: string };
}

// ========== API 方法 ==========

export const api = {
  // --- 认证 ---
  login: (password: string) =>
    request<{ token: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }),

  verify: () => request<{ valid: boolean }>('/auth/verify'),

  // --- 统计 ---
  getStats: () => request<{
    total: number;
    drafts: number;
    published: number;
    tags: Record<string, number>;
    recent: Article[];
  }>('/stats'),

  getBuildStatus: () => request<{ building: boolean; queued: boolean; pending: boolean }>('/build-status'),

  triggerBuild: () => request<{ ok: boolean }>('/build', { method: 'POST' }),

  // --- 文章 ---
  getArticles: () => request<Article[]>('/articles'),

  getArticle: (slug: string) => request<ArticleDetail>(`/articles/${slug}`),

  createArticle: (data: CreateArticle) =>
    request<{ slug: string }>('/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateArticle: (slug: string, data: UpdateArticle) =>
    request<{ slug: string }>(`/articles/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteArticle: (slug: string) =>
    request<{ ok: boolean }>(`/articles/${slug}`, { method: 'DELETE' }),

  batchDelete: (slugs: string[]) =>
    request<{ deleted: number }>('/articles/batch/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs }),
    }),

  batchTag: (slugs: string[], tag: string) =>
    request<{ updated: number }>('/articles/batch/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs, tag }),
    }),

  batchDraft: (slugs: string[], draft: boolean) =>
    request<{ updated: number }>('/articles/batch/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs, draft }),
    }),

  // --- 照片 ---
  getPhotos: () => request<PhotoItem[]>('/photos'),

  savePhotos: (photos: PhotoItem[]) =>
    request<{ ok: boolean; count: number }>('/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos),
    }),

  addPhoto: (photo: PhotoItem) =>
    request<{ ok: boolean; slug: string }>('/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    }),

  deletePhoto: (slug: string) =>
    request<{ ok: boolean }>(`/photos/${slug}`, { method: 'DELETE' }),

  // --- 媒体 ---
  getMedia: () => request<string[]>('/media'),

  uploadMedia: (file: File, dir = 'uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dir', dir);
    return request<{ url: string }>('/media/upload', { method: 'POST', body: formData });
  },

  getCategories: () => request<{ categories: string[]; counts: Record<string, number> }>('/media/categories'),

  saveImageTags: (url: string, tags: string[]) =>
    request<{ ok: boolean }>('/media/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, tags }),
    }),

  getAllTags: () => request<Record<string, string[]>>('/media/all-tags'),

  // --- 链接 ---
  getLinks: () => request<LinksData>('/links'),

  saveLinks: (data: LinksData) =>
    request<{ ok: boolean }>('/links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // --- AIGC ---
  getAigc: () => request<AigcData>('/aigc'),

  saveAigc: (data: AigcData) =>
    request<{ ok: boolean }>('/aigc', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // --- 关于页 ---
  getAbout: () => request<AboutData>('/about'),

  saveAbout: (data: AboutData) =>
    request<{ ok: boolean }>('/about', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // --- 站点配置 ---
  getSite: () => request<SiteData>('/site'),

  saveSite: (data: SiteData) =>
    request<{ ok: boolean }>('/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
