# Nice Blog 后端学习指南
---

## 目录

0. [启动开发环境（三条命令）](#0-启动开发环境三条命令)
1. [先搞清楚：什么是后端？](#1-先搞清楚什么是后端)
2. [这个项目的后端在哪？](#2-这个项目的后端在哪)
3. [核心概念：5 分钟看懂](#3-核心概念5-分钟看懂)
4. [后端代码逐行拆解](#4-后端代码逐行拆解)
5. [前端怎么跟后端对话？](#5-前端怎么跟后端对话)
6. [完整数据流：一次请求的旅程](#6-完整数据流一次请求的旅程)
7. [项目文件结构速查](#7-项目文件结构速查)
8. [动手实践：自己加一个 API](#8-动手实践自己加一个-api)
9. [怎么深入学习？](#9-怎么深入学习)

---

## 0. 启动开发环境（三条命令）

这个项目需要同时运行 **3 个服务**，每个服务开一个终端窗口。

### 架构总览

```
终端 1：Astro 博客前端   →  http://localhost:4321
终端 2：Admin 后台前端    →  http://localhost:5173
终端 3：后端 API 服务器   →  http://localhost:3001
```

### 启动步骤

**终端 1 — 博客前端（Astro）**

```bash
cd D:\Code\hh\nice-blog
npm run dev
```

启动后访问 `http://localhost:4321` 查看博客。

**终端 2 — 后台管理前端（Vite + React）**

```bash
cd D:\Code\hh\nice-blog\admin
npm run dev:client
```

启动后访问 `http://localhost:5173/login` 进入管理后台。

**终端 3 — 后端 API 服务器（Hono）**

```bash
cd D:\Code\hh\nice-blog\admin
npx tsx server.ts
```

后端监听 `http://localhost:3001`。启动成功时**没有任何提示**，这是正常的——看到光标闪烁就说明在运行了。

### 常见问题

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| `ECONNREFUSED` | 后端没启动，前端请求 `/api/*` 被拒 | 启动终端 3 的后端服务 |
| `EADDRINUSE: port 3001` | 3001 端口已被占用（后端已在运行） | 无需操作，后端已经跑着了 |
| Admin 页面加载失败 | 用了 `npx run dev:client` | 改用 `npm run dev:client` |
| 后端无任何输出 | 正常现象 | 光标闪烁 = 服务正常运行 |

### 验证后端是否正常

打开浏览器访问：

```
http://localhost:3001/api/articles
```

如果返回 JSON 数据（文章列表），说明后端正常。

---

## 1. 先搞清楚：什么是后端？

### 你已知的：静态前端

你现在会写的页面是这样的：

```
用户打开网页 → 浏览器下载 HTML/CSS/JS → 直接显示 → 完事
```

所有内容都写死在文件里，用户只能看，不能改。

### 后端是什么？

后端就是一台**一直运行的程序**，等待别人来"问问题"，然后"回答"。

```
用户操作页面 → 浏览器发请求给后端 → 后端处理 → 返回数据 → 页面更新
```

打个比方：
- **前端** = 餐厅的菜单（你能看到有什么菜）
- **后端** = 厨房（你点了菜，厨房做好端给你）
- **API** = 服务员（你告诉服务员要什么，服务员去厨房拿）

### 为什么需要后端？

| 没有后端（纯静态） | 有后端 |
|---|---|
| 内容写死在文件里 | 内容存在服务器上，随时可改 |
| 每次改内容要重新部署 | 后台点一下就改好了 |
| 没有登录功能 | 可以登录、验证身份 |
| 所有人看到一样的内容 | 可以根据用户显示不同内容 |

---

## 2. 这个项目的后端在哪？

```
nice-blog/
├── src/              ← 前端（Astro 静态站点）
├── public/           ← 静态资源（图片等）
└── admin/            ← ⭐ 后端在这里！
    ├── server.ts     ← 后端主文件（所有 API 都写在这里）
    ├── src/          ← 后台管理页面（React）
    └── package.json  ← 后端依赖
```

**关键文件只有一个：`admin/server.ts`**

这个文件就是一个 HTTP 服务器，监听 3001 端口，等着前端来请求数据。

---

## 3. 核心概念：5 分钟看懂

### 3.1 HTTP 请求 — 前后端对话的语言

前端和后端通过 **HTTP 协议**对话，就像两个人发消息：

```
前端（浏览器）                    后端（server.ts）
    |                                |
    |  "给我所有文章"  ──────────→   |  （GET /api/articles）
    |                                |  读取文件，整理数据
    |  ←────────── [文章列表JSON]    |  返回 JSON 数据
    |                                |
    |  "保存这篇文章"  ──────────→   |  （POST /api/articles）
    |                                |  写入文件
    |  ←────────── { ok: true }      |  返回成功
```

### 3.2 四种基本操作（CRUD）

| 操作 | HTTP 方法 | 用途 | 例子 |
|------|-----------|------|------|
| 读取 | **GET** | 获取数据 | 获取文章列表 |
| 创建 | **POST** | 新增数据 | 新建一篇文章 |
| 更新 | **PUT** | 修改数据 | 编辑文章内容 |
| 删除 | **DELETE** | 删掉数据 | 删除一篇文章 |

### 3.3 API 端点 — 后端的"门牌号"

每个功能都有一个 URL 地址，叫做 **API 端点**：

```
GET    /api/articles        → 获取所有文章
GET    /api/articles/123    → 获取某篇文章
POST   /api/articles        → 创建文章
PUT    /api/articles/123    → 更新某篇文章
DELETE /api/articles/123    → 删除某篇文章
```

就像餐厅的菜单编号：A1 是宫保鸡丁，A2 是红烧肉。

### 3.4 JSON — 前后端传递数据的格式

前后端之间传递的数据都是 **JSON 格式**（就是 JavaScript 对象的字符串形式）：

```json
{
  "title": "我的第一篇文章",
  "desc": "这是描述",
  "date": "2025-01-15",
  "tag": "随笔"
}
```

### 3.5 端口 — 服务器的"门牌号"

服务器启动时会占用一个端口号。这个项目用的是 **3001**：

```
http://localhost:3001     ← 后端服务器地址
http://localhost:3001/api/articles  ← API 地址
```

`localhost` 就是"本机"，3001 是端口号。

---

## 4. 后端代码逐行拆解

打开 `admin/server.ts`，我来逐段解释：

### 4.1 引入依赖（第 1-8 行）

```typescript
import { Hono } from 'hono';           // Web 框架（帮你处理 HTTP 请求）
import { serve } from '@hono/node-server'; // 让 Node.js 跑起来
import jwt from 'jsonwebtoken';         // 登录验证用的
import fs from 'fs/promises';           // 读写文件
import path from 'path';                // 处理文件路径
```

就像做菜前准备工具：锅（Hono）、火（serve）、调料（jwt）、食材（fs）。

### 4.2 创建服务器（第 30-32 行）

```typescript
const app = new Hono();  // 创建一个"应用"

app.use('*', cors({ origin: '*' }));  // 允许跨域请求
```

`Hono` 就是一个框架，帮你处理"有人发请求来了，该调用哪个函数"这件事。

### 4.3 定义 API 路由（核心！）

```typescript
// 有人 GET /api/articles → 执行这个函数
app.get('/api/articles', async (c) => {
  const articles = await readAllArticles();  // 读取所有文章
  return c.json(articles);                   // 返回 JSON
});

// 有人 POST /api/articles → 执行这个函数
app.post('/api/articles', async (c) => {
  const body = await c.req.json();           // 读取前端发来的数据
  // ...处理逻辑...
  await fs.writeFile(filePath, content);     // 写入文件
  return c.json({ slug }, 201);              // 返回成功
});
```

**理解要点：**
- `app.get('/api/xxx', 函数)` = 注册一个 GET 接口
- `app.post('/api/xxx', 函数)` = 注册一个 POST 接口
- `c.req.json()` = 读取前端发来的 JSON 数据
- `c.json(数据)` = 返回 JSON 给前端

### 4.4 登录验证（JWT）

```typescript
// 登录：验证密码，返回 token
app.post('/api/auth/login', async (c) => {
  const { password } = await c.req.json();
  if (password !== 'niceblog2025') {
    return c.json({ error: '密码错误' }, 401);  // 401 = 未授权
  }
  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' });
  return c.json({ token });  // 返回一个"通行证"
});

// 验证：每次请求带上 token，后端检查是否有效
app.get('/api/auth/verify', async (c) => {
  const token = authHeader.slice(7);  // 去掉 "Bearer " 前缀
  const payload = jwt.verify(token, secret);
  return c.json({ valid: true });
});
```

**JWT 是什么？** 就是一张"通行证"：
1. 登录成功 → 后端发一张通行证（token）
2. 以后每次请求 → 前端带上通行证
3. 后端检查通行证 → 有效就处理，无效就拒绝

### 4.5 启动服务器（最后几行）

```typescript
serve({ fetch: app.fetch, port: 3001 });  // 在 3001 端口启动
```

---

## 5. 前端怎么跟后端对话？

打开 `admin/src/api/client.ts`，这就是前端的"通信模块"。

### 5.1 发请求的基本函数

```typescript
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('admin_token');  // 拿出通行证
  
  const res = await fetch(`/api${url}`, {              // 发请求
    ...options,
    headers: { 'Authorization': `Bearer ${token}` },   // 带上通行证
  });
  
  if (res.status === 401) {
    window.location.href = '/login';  // 通行证无效，踢去登录
  }
  
  return res.json();  // 返回 JSON 数据
}
```

### 5.2 调用 API 的方式

```typescript
export const api = {
  // 获取所有文章 — 发 GET 请求
  getArticles: () => request<Article[]>('/articles'),
  
  // 创建文章 — 发 POST 请求，带数据
  createArticle: (data) => request('/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),  // 把对象转成 JSON 字符串
  }),
  
  // 删除文章 — 发 DELETE 请求
  deleteArticle: (slug) => request(`/articles/${slug}`, { method: 'DELETE' }),
};
```

### 5.3 在页面中使用

```tsx
// 在 React 组件中
useEffect(() => {
  api.getArticles().then(articles => {
    setArticles(articles);  // 拿到数据，更新页面
  });
}, []);
```

---

## 6. 完整数据流：一次请求的旅程

### 创建文章

```
┌─────────────────────────────────────────────────────────────┐
│  1. 用户在后台页面填写表单，点击"保存"                           │
│     ↓                                                       │
│  2. React 组件调用 api.createArticle(data)                   │
│     ↓                                                       │
│  3. client.ts 把数据转成 JSON，带上 token，发 POST 请求        │
│     fetch('/api/articles', { method: 'POST', body: JSON })  │
│     ↓                                                       │
│  4. 浏览器把请求发到 http://localhost:3001/api/articles       │
│     ↓                                                       │
│  5. server.ts 收到请求                                       │
│     - 检查 token 是否有效（验证登录）                          │
│     - 解析 JSON 数据                                         │
│     - 生成 Markdown 文件（自动给 # 开头的值加 YAML 引号）      │
│     - 写入磁盘 src/content/blog/xxx.md（不加 UTF-8 BOM）      │
│     ↓                                                       │
│  6. server.ts 返回 { slug: "xxx" } 给浏览器                  │
│     ↓                                                       │
│  7. client.ts 收到响应，返回给 React 组件                     │
│     ↓                                                       │
│  8. React 组件更新页面，显示"保存成功"                          │
└─────────────────────────────────────────────────────────────┘
```

### 博客列表页加载

```
┌─────────────────────────────────────────────────────────────┐
│  1. 用户访问 http://localhost:4321/blog                      │
│     ↓                                                       │
│  2. Astro 渲染 blog.astro（静态 HTML）                       │
│     ↓                                                       │
│  3. 客户端 JS 执行 fetch('/api/articles')                    │
│     ↓                                                       │
│  4. Vite 代理转发到 http://localhost:3001/api/articles        │
│     ↓                                                       │
│  5. server.ts 返回所有文章列表（含 draft 字段）               │
│     ↓                                                       │
│  6. JS 过滤 draft=false，按日期排序，渲染卡片 + 标签 + 分页   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 项目文件结构速查

```
admin/
├── server.ts                 ← ⭐ 后端主文件（API 全在这里）
├── src/
│   ├── api/
│   │   └── client.ts        ← ⭐ 前端调用 API 的封装
│   ├── pages/
│   │   ├── Login.tsx         ← 登录页
│   │   ├── Dashboard.tsx     ← 仪表盘
│   │   ├── ArticleList.tsx   ← 文章列表
│   │   ├── ArticleEditor.tsx ← 文章编辑器
│   │   ├── MediaManager.tsx  ← 媒体管理
│   │   ├── PhotoManager.tsx  ← 照片管理
│   │   ├── LinkManager.tsx   ← 链接管理
│   │   ├── AigcManager.tsx   ← AIGC 管理
│   │   └── SiteConfig.tsx    ← 站点配置
│   ├── components/
│   │   └── Layout.tsx        ← 侧边栏布局
│   └── App.tsx               ← 路由配置
└── package.json

src/content/                   ← 前端数据文件（JSON）
├── links.json                 ← 链接数据
├── aigc.json                  ← AIGC 作品数据
├── about.json                 ← 关于页数据
├── site.json                  ← 站点配置数据
└── photos.ts                  ← 照片数据
```

---

## 8. 动手实践：自己加一个 API

这是最好的学习方式。我们来加一个"获取当前时间"的 API。

### 第一步：在 server.ts 加一个路由

在 `app.get('/api/stats', ...)` 附近加：

```typescript
app.get('/api/time', async (c) => {
  return c.json({ 
    time: new Date().toISOString(),
    message: '现在是 ' + new Date().toLocaleString('zh-CN')
  });
});
```

### 第二步：在 client.ts 加一个方法

```typescript
getTime: () => request<{ time: string; message: string }>('/time'),
```

### 第三步：在任意页面使用

```tsx
useEffect(() => {
  api.getTime().then(data => {
    console.log(data.message);  // "现在是 2025/6/16 12:00:00"
  });
}, []);
```

### 第四步：重启服务器，打开浏览器测试

```bash
cd admin
npx tsx server.ts
```

打开浏览器控制台，就能看到返回的时间了。

---

## 9. 怎么深入学习？

### 搜索关键词指南

遇到不懂的概念，用这些关键词搜索：

| 概念 | 搜索关键词 |
|------|-----------|
| HTTP 请求 | `HTTP 请求方法 GET POST PUT DELETE` |
| REST API | `RESTful API 设计教程` |
| JSON | `JSON 格式教程` |
| JWT | `JWT 登录验证原理` |
| 端口 | `端口号是什么 localhost` |
| 跨域 CORS | `CORS 跨域是什么 怎么解决` |
| Node.js | `Node.js 入门教程` |
| Hono 框架 | `Hono framework tutorial` |
| async/await | `JavaScript async await 教程` |
| TypeScript | `TypeScript 入门教程` |

### 推荐学习路径

```
第 1 周：理解 HTTP
├── 搜索：HTTP 请求方法
├── 搜索：RESTful API 是什么
├── 动手：用 Postman 或浏览器直接访问 API
│         http://localhost:3001/api/articles
└── 理解：GET/POST/PUT/DELETE 分别干什么

第 2 周：理解 Node.js
├── 搜索：Node.js 入门
├── 搜索：Node.js 读写文件
├── 动手：写一个最简单的 HTTP 服务器
└── 理解：服务器就是一直运行的程序

第 3 周：理解前后端通信
├── 搜索：fetch API 教程
├── 搜索：JavaScript 发送 HTTP 请求
├── 动手：用 fetch 调用自己的 API
└── 理解：前端发请求 → 后端处理 → 返回数据

第 4 周：理解框架
├── 搜索：Express.js 或 Hono.js 教程
├── 搜索：RESTful API 路由设计
├── 动手：给这个项目加一个新 API
└── 理解：框架帮你处理了底层的 HTTP 细节
```

### 推荐资源

- **MDN Web Docs**（最权威）：https://developer.mozilla.org/zh-CN/
  - 搜索 "HTTP 概述"、"fetch API"、"Node.js 入门"
- **阮一峰的博客**（中文，讲得清楚）：
  - 搜索 "阮一峰 RESTful API 教程"
  - 搜索 "阮一峰 Node.js 入门"
- **Hono 官方文档**（这个项目用的框架）：https://hono.dev/
- **B 站视频**：
  - 搜索 "Node.js 入门教程"
  - 搜索 "前后端分离 教程"

### 最直接的学习方式

**改这个项目的代码：**

1. 在 `server.ts` 加一个新路由 → 重启服务器 → 浏览器访问 → 看到结果
2. 在 `client.ts` 加一个新方法 → 在页面调用 → 看到数据
3. 在 JSON 文件加一条数据 → 刷新页面 → 看到变化

每次改一行代码，刷新看效果，比看书快 10 倍。

---

## 附：常用命令速查

```bash
# 启动后端服务器
cd admin
npx tsx server.ts

# 构建后台前端
cd admin
npx vite build

# 测试 API（浏览器直接访问）
http://localhost:3001/api/articles
http://localhost:3001/api/photos
http://localhost:3001/api/links

# 测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"niceblog2025"}'
```

---

*最后更新：2025-06-16*
