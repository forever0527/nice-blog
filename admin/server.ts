/**
 * @file 后端 API 服务器
 * @module server
 * @description Hono HTTP 服务器，提供文章、照片、媒体、链接、AIGC、站点配置等 RESTful API。
 *              使用 JWT 进行身份验证，通过文件系统读写数据。
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// ========== 常量 ==========

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const JWT_SECRET = 'nice-blog-admin-secret-key-2025';
const JWT_EXPIRES_IN = '24h';
const ADMIN_PASSWORD = 'niceblog2025';

/** 文件路径常量 */
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PUBLIC_IMG_DIR = path.join(PUBLIC_DIR, 'img');
const CONTENT_DIR = path.resolve(__dirname, '../src/content');
const PHOTOS_FILE = path.join(CONTENT_DIR, 'photos.ts');
const TAGS_FILE = path.join(PUBLIC_IMG_DIR, 'tags.json');
const LINKS_FILE = path.join(CONTENT_DIR, 'links.json');
const AIGC_FILE = path.join(CONTENT_DIR, 'aigc.json');
const ABOUT_FILE = path.join(CONTENT_DIR, 'about.json');
const SITE_FILE = path.join(CONTENT_DIR, 'site.json');

/** 媒体分类标签 */
const MEDIA_CATEGORIES = ['风景', '人像', '建筑', '美食', '旅行', '街拍', '夜景', '动物', '植物', '黑白'] as const;

/** 支持的图片扩展名 */
const IMAGE_EXTENSIONS = /\.(webp|jpg|jpeg|png|gif|svg|avif)$/i;

/** MIME 类型映射 */
const MIME_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

// ========== 工具函数 ==========

/** Astro 构建状态 */
let astroBuilding = false;
let astroBuildQueue = false;
let astroBuildTimer: ReturnType<typeof setTimeout> | null = null;

/** 防抖延迟（毫秒），连续修改在此时间内只触发一次构建 */
const BUILD_DEBOUNCE_MS = 5000;

/**
 * 触发 Astro 静态站点重建（防抖）
 * 连续修改会在最后一次修改后 5 秒触发，避免频繁全量构建
 */
function triggerAstroBuild(): void {
  if (astroBuildTimer) clearTimeout(astroBuildTimer);
  astroBuildTimer = setTimeout(() => {
    astroBuildTimer = null;
    if (astroBuilding) {
      astroBuildQueue = true;
      return;
    }
    astroBuilding = true;
    const astroDir = path.resolve(__dirname, '..');
    const child = spawn('npx', ['astro', 'build'], {
      cwd: astroDir,
      shell: true,
      stdio: 'ignore',
    });
    child.on('close', () => {
      astroBuilding = false;
      if (astroBuildQueue) {
        astroBuildQueue = false;
        triggerAstroBuild();
      }
    });
    child.on('error', () => {
      astroBuilding = false;
      if (astroBuildQueue) {
        astroBuildQueue = false;
        triggerAstroBuild();
      }
    });
  }, BUILD_DEBOUNCE_MS);
}

/**
 * 读取 JSON 文件，失败时返回 fallback
 * @param filePath - 文件路径
 * @param fallback - 读取失败时的默认值
 * @returns 解析后的 JSON 对象
 */
async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

/**
 * 写入文本文件
 * @param filePath - 文件路径
 * @param content - 文件内容
 */
async function writeTextFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 解析 Markdown frontmatter
 * @param content - 完整的 Markdown 内容
 * @returns 包含 meta 和 body 的对象
 */
function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string> = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      let val = rest.join(':').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key.trim()] = val;
    }
  });
  return { meta, body: match[2] };
}

/**
 * 构建 Markdown frontmatter 字符串
 * @param meta - 元数据对象
 * @returns 格式化的 frontmatter 字符串
 */
function buildFrontmatter(meta: Record<string, string>): string {
  const lines = Object.entries(meta).map(([k, v]) => {
    if (v && (v.startsWith('#') || v.includes(':') || v.includes('"') || v.includes("'"))) {
      return `${k}: "${v.replace(/"/g, '\\"')}"`;
    }
    return `${k}: ${v || ''}`;
  });
  return `---\n${lines.join('\n')}\n---`;
}

// ========== JWT 工具 ==========

/**
 * 签发 JWT token
 * @param payload - 载荷数据
 * @returns JWT 字符串
 */
function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT token
 * @param token - JWT 字符串
 * @returns 解码后的载荷，无效则返回 null
 */
function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

// ========== 文章相关 ==========

interface ArticleSummary {
  slug: string;
  title: string;
  desc: string;
  date: string;
  tag: string;
  color: string;
  img: string;
  draft?: boolean;
}

/**
 * 读取所有文章摘要
 * @returns 按日期降序排列的文章列表
 */
async function readAllArticles(): Promise<ArticleSummary[]> {
  const files = await fs.readdir(BLOG_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  const articles: ArticleSummary[] = [];

  for (const file of mdFiles) {
    const content = await fs.readFile(path.join(BLOG_DIR, file), 'utf-8');
    const { meta } = parseFrontmatter(content);
    articles.push({
      slug: file.replace('.md', ''),
      title: meta.title || '',
      desc: meta.desc || '',
      date: meta.date || '',
      tag: meta.tag || '',
      color: meta.color || '#0040ff',
      img: meta.img || '',
      draft: meta.draft === 'true',
    });
  }

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ========== 照片相关 ==========

interface PhotoItem {
  slug: string;
  src: string;
  title: string;
  year: string;
  month: string;
  day: string;
  location: string;
  desc: string;
}

/**
 * 将照片数组序列化为 TypeScript 源码
 * @param photos - 照片数组
 * @returns 可写入 .ts 文件的内容
 */
function serializePhotos(photos: PhotoItem[]): string {
  const items = photos.map(p => {
    const fields = [
      `  slug: '${p.slug.replace(/'/g, "\\'")}'`,
      `  src: '${p.src.replace(/'/g, "\\'")}'`,
      `  title: '${p.title.replace(/'/g, "\\'")}'`,
      `  year: '${p.year.replace(/'/g, "\\'")}'`,
      `  month: '${p.month.replace(/'/g, "\\'")}'`,
      `  day: '${p.day.replace(/'/g, "\\'")}'`,
      `  location: '${p.location.replace(/'/g, "\\'")}'`,
      `  desc: '${p.desc.replace(/'/g, "\\'")}'`,
    ];
    return `  {\n${fields.join(',\n')},\n  }`;
  });
  return `export const photos = [\n${items.join(',\n')},\n];\n`;
}

/**
 * 从 TypeScript 源码解析照片数组
 * @param content - .ts 文件内容
 * @returns 照片数组
 */
function parsePhotosFile(content: string): PhotoItem[] {
  const photos: PhotoItem[] = [];
  const itemRegex = /\{\s*slug:\s*'([^']*)',\s*src:\s*'([^']*)',\s*title:\s*'([^']*)',\s*year:\s*'([^']*)',\s*month:\s*'([^']*)',\s*day:\s*'([^']*)',\s*location:\s*'([^']*)',\s*desc:\s*'([^']*)'/g;
  let match;
  while ((match = itemRegex.exec(content)) !== null) {
    photos.push({
      slug: match[1], src: match[2], title: match[3],
      year: match[4], month: match[5], day: match[6],
      location: match[7], desc: match[8],
    });
  }
  return photos;
}

// ========== 应用初始化 ==========

const app = new Hono();
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE'] }));

// ========== 认证 API ==========

/** POST /api/auth/login - 登录验证，返回 JWT token */
app.post('/api/auth/login', async (c) => {
  const { password } = await c.req.json();
  if (password !== ADMIN_PASSWORD) {
    return c.json({ error: '密码错误' }, 401);
  }
  const token = signToken({ role: 'admin' });
  return c.json({ token });
});

/** GET /api/auth/verify - 验证 token 有效性 */
app.get('/api/auth/verify', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ valid: false }, 401);
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) {
    return c.json({ valid: false }, 401);
  }
  return c.json({ valid: true });
});

// ========== 文章 API ==========

/** GET /api/articles - 获取所有文章 */
app.get('/api/articles', async (c) => {
  const articles = await readAllArticles();
  return c.json(articles);
});

/** GET /api/articles/:slug - 获取单篇文章详情 */
app.get('/api/articles/:slug', async (c) => {
  const slug = c.req.param('slug');
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    return c.json({ slug, ...meta, content: body });
  } catch {
    return c.json({ error: '文章不存在' }, 404);
  }
});

/** POST /api/articles - 创建文章 */
app.post('/api/articles', async (c) => {
  const { title, desc, date, tag, color, img, content, slug: customSlug } = await c.req.json();
  const slug = customSlug || title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
  const filePath = path.join(BLOG_DIR, `${slug}.md`);

  try {
    await fs.access(filePath);
    return c.json({ error: '文章已存在' }, 409);
  } catch {}

  const frontmatter = buildFrontmatter({
    title,
    desc,
    date: date || new Date().toISOString().split('T')[0],
    tag: tag || '未分类',
    color: color || '#0040ff',
    img: img || '/img/bg/1.webp',
  });
  await writeTextFile(filePath, `${frontmatter}\n${content || ''}\n`);
  triggerAstroBuild();
  return c.json({ slug }, 201);
});

/** PUT /api/articles/:slug - 更新文章 */
app.put('/api/articles/:slug', async (c) => {
  const slug = c.req.param('slug');
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  const body = await c.req.json();

  try {
    await fs.access(filePath);
  } catch {
    return c.json({ error: '文章不存在' }, 404);
  }

  const { title, desc, date, tag, color, img, content, draft } = body;
  const frontmatter = buildFrontmatter({
    title,
    desc,
    date,
    tag,
    color: color || '#0040ff',
    img: img || '/img/bg/1.webp',
    ...(draft !== undefined ? { draft: String(draft) } : {}),
  });
  await writeTextFile(filePath, `${frontmatter}\n${content || ''}\n`);
  triggerAstroBuild();
  return c.json({ slug });
});

/** DELETE /api/articles/:slug - 删除文章 */
app.delete('/api/articles/:slug', async (c) => {
  const slug = c.req.param('slug');
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  try {
    await fs.unlink(filePath);
    triggerAstroBuild();
    return c.json({ ok: true });
  } catch {
    return c.json({ error: '文章不存在' }, 404);
  }
});

/** POST /api/articles/batch/delete - 批量删除文章 */
app.post('/api/articles/batch/delete', async (c) => {
  const { slugs } = await c.req.json();
  let deleted = 0;
  for (const slug of slugs) {
    try {
      await fs.unlink(path.join(BLOG_DIR, `${slug}.md`));
      deleted++;
    } catch {}
  }
  triggerAstroBuild();
  return c.json({ deleted });
});

/** POST /api/articles/batch/tag - 批量修改文章标签 */
app.post('/api/articles/batch/tag', async (c) => {
  const { slugs, tag } = await c.req.json();
  let updated = 0;
  for (const slug of slugs) {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const newContent = content.replace(/^(tag:\s*).+$/m, `$1${tag}`);
      await writeTextFile(filePath, newContent);
      updated++;
    } catch {}
  }
  triggerAstroBuild();
  return c.json({ updated });
});

/** POST /api/articles/batch/draft - 批量发布/取消发布 */
app.post('/api/articles/batch/draft', async (c) => {
  const { slugs, draft } = await c.req.json();
  let updated = 0;
  for (const slug of slugs) {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const hasDraft = /^draft:\s*/m.test(content);
      const newContent = hasDraft
        ? content.replace(/^(draft:\s*).+$/m, `$1${draft}`)
        : content.replace(/^(---\n)/, `$1draft: ${draft}\n`);
      await writeTextFile(filePath, newContent);
      updated++;
    } catch {}
  }
  triggerAstroBuild();
  return c.json({ updated });
});

/** GET /api/stats - 获取统计信息 */
app.get('/api/stats', async (c) => {
  const articles = await readAllArticles();
  const total = articles.length;
  const drafts = articles.filter(a => a.draft).length;
  const published = total - drafts;
  const tagMap: Record<string, number> = {};
  articles.forEach(a => { tagMap[a.tag] = (tagMap[a.tag] || 0) + 1; });
  return c.json({ total, drafts, published, tags: tagMap, recent: articles.slice(0, 5) });
});

/** GET /api/build-status - 获取 Astro 构建状态 */
app.get('/api/build-status', async (c) => {
  return c.json({
    building: astroBuilding,
    queued: astroBuildQueue,
    pending: !!astroBuildTimer,
  });
});

/** POST /api/build - 手动触发构建（跳过防抖） */
app.post('/api/build', async (c) => {
  if (astroBuildTimer) clearTimeout(astroBuildTimer);
  astroBuildTimer = null;
  if (!astroBuilding) {
    triggerAstroBuild();
  }
  return c.json({ ok: true });
});

// ========== 照片 API ==========

/** GET /api/photos - 获取所有照片 */
app.get('/api/photos', async (c) => {
  try {
    const content = await fs.readFile(PHOTOS_FILE, 'utf-8');
    return c.json(parsePhotosFile(content));
  } catch {
    return c.json([]);
  }
});

/** PUT /api/photos - 批量保存照片 */
app.put('/api/photos', async (c) => {
  const photos = await c.req.json() as PhotoItem[];
  await fs.writeFile(PHOTOS_FILE, serializePhotos(photos), 'utf-8');
  return c.json({ ok: true, count: photos.length });
});

/** POST /api/photos - 添加单张照片 */
app.post('/api/photos', async (c) => {
  const photo = await c.req.json() as PhotoItem;
  const content = await fs.readFile(PHOTOS_FILE, 'utf-8');
  const photos = parsePhotosFile(content);
  photo.slug = photo.slug || String(Date.now());
  photos.push(photo);
  await fs.writeFile(PHOTOS_FILE, serializePhotos(photos), 'utf-8');
  return c.json({ ok: true, slug: photo.slug });
});

/** DELETE /api/photos/:slug - 删除照片 */
app.delete('/api/photos/:slug', async (c) => {
  const slug = c.req.param('slug');
  const content = await fs.readFile(PHOTOS_FILE, 'utf-8');
  const photos = parsePhotosFile(content).filter(p => p.slug !== slug);
  await fs.writeFile(PHOTOS_FILE, serializePhotos(photos), 'utf-8');
  return c.json({ ok: true });
});

// ========== 链接 API ==========

/** GET /api/links - 获取链接数据 */
app.get('/api/links', async (c) => {
  const data = await readJsonFile(LINKS_FILE, { title: '', subtitle: '', groups: [] });
  return c.json(data);
});

/** PUT /api/links - 保存链接数据 */
app.put('/api/links', async (c) => {
  const data = await c.req.json();
  await writeJsonFile(LINKS_FILE, data);
  return c.json({ ok: true });
});

// ========== AIGC API ==========

/** GET /api/aigc - 获取 AIGC 作品数据 */
app.get('/api/aigc', async (c) => {
  const data = await readJsonFile(AIGC_FILE, { subtitle: '', works: [] });
  return c.json(data);
});

/** PUT /api/aigc - 保存 AIGC 作品数据 */
app.put('/api/aigc', async (c) => {
  const data = await c.req.json();
  await writeJsonFile(AIGC_FILE, data);
  return c.json({ ok: true });
});

// ========== 关于页 API ==========

/** GET /api/about - 获取关于页数据 */
app.get('/api/about', async (c) => {
  const data = await readJsonFile(ABOUT_FILE, {
    subtitle: '', profile: {}, stats: [], skills: [], timeline: [], socials: [],
  });
  return c.json(data);
});

/** PUT /api/about - 保存关于页数据 */
app.put('/api/about', async (c) => {
  const data = await c.req.json();
  await writeJsonFile(ABOUT_FILE, data);
  return c.json({ ok: true });
});

// ========== 站点配置 API ==========

/** GET /api/site - 获取站点配置 */
app.get('/api/site', async (c) => {
  const data = await readJsonFile(SITE_FILE, {
    name: '', subtitle: '', bio: '', bgImage: '', bgList: [], socialLinks: [], shopLinks: [], footer: {},
  });
  return c.json(data);
});

/** PUT /api/site - 保存站点配置 */
app.put('/api/site', async (c) => {
  const data = await c.req.json();
  await writeJsonFile(SITE_FILE, data);
  return c.json({ ok: true });
});

// ========== 媒体 API ==========

/** GET /api/media/categories - 获取媒体分类及计数 */
app.get('/api/media/categories', async (c) => {
  const tagsData = await readJsonFile<Record<string, string[]>>(TAGS_FILE, {});
  const counts: Record<string, number> = {};
  MEDIA_CATEGORIES.forEach(t => { counts[t] = 0; });
  Object.values(tagsData).forEach(tags => {
    tags.forEach(t => { if (counts[t] !== undefined) counts[t]++; });
  });
  return c.json({ categories: [...MEDIA_CATEGORIES], counts });
});

/** POST /api/media/tags - 为图片设置标签 */
app.post('/api/media/tags', async (c) => {
  const { url, tags } = await c.req.json();
  if (!url || !Array.isArray(tags)) {
    return c.json({ error: '参数错误' }, 400);
  }
  const tagsData = await readJsonFile<Record<string, string[]>>(TAGS_FILE, {});
  tagsData[url] = tags;
  await writeJsonFile(TAGS_FILE, tagsData);
  return c.json({ ok: true });
});

/** GET /api/media/all-tags - 获取所有图片的标签映射 */
app.get('/api/media/all-tags', async (c) => {
  const tagsData = await readJsonFile<Record<string, string[]>>(TAGS_FILE, {});
  return c.json(tagsData);
});

/** GET /api/media - 获取所有媒体文件列表 */
app.get('/api/media', async (c) => {
  const images: string[] = [];
  async function walkDir(dir: string, relative = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walkDir(path.join(dir, entry.name), relPath);
      } else if (IMAGE_EXTENSIONS.test(entry.name)) {
        images.push(`/img/${relPath}`);
      }
    }
  }
  await walkDir(PUBLIC_IMG_DIR);
  return c.json(images);
});

/** POST /api/media/upload - 上传媒体文件 */
app.post('/api/media/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];
  if (!file || !(file instanceof File)) {
    return c.json({ error: '没有文件' }, 400);
  }

  const subDir = (body['dir'] as string) || 'uploads';
  const uploadDir = path.join(PUBLIC_IMG_DIR, subDir);
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || '.webp';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return c.json({ url: `/img/${subDir}/${filename}` });
});

// ========== 静态文件服务 ==========

/** GET /img/* - 提供 public/img 目录下的静态图片 */
app.get('/img/*', async (c) => {
  const reqPath = c.req.path;
  const filePath = path.join(PUBLIC_DIR, reqPath);
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    c.header('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(data);
  } catch {
    return c.text('Not Found', 404);
  }
});

/** 生产模式下托管前端构建产物 */
if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, 'dist');
  app.use('/*', serveStatic({ root: distDir }));
  app.get('*', async (c) => {
    try {
      const html = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8');
      return c.html(html);
    } catch {
      return c.text('Not Found', 404);
    }
  });
}

// ========== 启动服务器 ==========

serve({ fetch: app.fetch, port: PORT });
