# Nice Blog

## 技术栈
- Astro 5 (SSG) + React 19 + Tailwind CSS v4 + TypeScript
- Three.js 用于首页流体背景（LiquidEther.tsx），不改动
- Hono (后端 API) + JWT 认证 + marked (Markdown 渲染)

## 项目结构
```
src/
├── pages/          # 路由页面 (.astro)
├── components/     # Astro 组件
│   └── react/      # React 特效组件
├── layouts/        # 布局模板
├── content/blog/   # Markdown 博文
├── content/photos.ts  # 照片数据源
├── content/links.json # 链接数据
├── content/aigc.json  # AIGC 作品数据
├── content/about.json # 关于页数据
├── content/site.json  # 站点配置
└── styles/         # 全局样式
admin/
├── server.ts       # Hono 后端 API 服务器 (端口 3001)
├── src/
│   ├── pages/      # 管理页面 (React)
│   └── api/        # API 客户端封装
└── vite.config.ts  # Admin Vite 配置 (端口 5173, 代理 /api → 3001)
```

## 约定
- 新样式用 Tailwind 类名，不往 global.css 加新代码
- React 组件写 .tsx，不写 .jsx
- Astro 组件用 scoped style，需动态渲染的组件用 `<style is:global>`
- 页面布局用 BaseLayout 包裹
- 后端写入文件不再加 UTF-8 BOM（会破坏 Astro frontmatter 解析）
- 后端 `buildFrontmatter` 自动给含 `#`/`:`/引号的值加 YAML 引号

## 禁止
- 不要随便装新依赖，先讨论
- 不要改 astro.config.mjs 和 tsconfig.json 除非明确需要
- LiquidEther.tsx 不改动
- **绝对不要 `git checkout HEAD` 或 `git restore` 任何文件**

## 三个开发服务
```
终端 1：Astro 博客前端   →  npm run dev        →  http://localhost:4321
终端 2：Admin 后台前端    →  npm run dev:client →  http://localhost:5173
终端 3：后端 API 服务器   →  npx tsx server.ts  →  http://localhost:3001
```
- Astro 配置了 `output: 'static'`（SSG），新文章需 rebuild 才能在 `[slug].astro` 路由访问
- 博客列表页 `blog.astro` 改为从 API 实时获取数据（`fetch('/api/articles')`），新建文章即时可见
- 后端 `triggerAstroBuild()` 在创建/修改/删除文章后自动触发 `npx astro build`

## 页面架构

### Index 页面（index.astro）
- 无页眉（Header 组件已移除）
- `Snow` 组件星空背景
- `hero-card` 玻璃卡片 + 鼠标跟随倾斜（仅桌面端）
- `expand-btn` 展开 about 页面（收起顺序：内容淡出 → 300ms 后卡片合并）
- 展开后显示 `long.webp` Logo（右上角，固定定位）
- 暗色模式阴影为白色，浅色模式为黑色

### Blog 页面（blog.astro）
- 列表页从 API 实时获取文章（`fetch('/api/articles')`），新建文章即时可见
- `<style is:global>` 使动态创建的卡片/分页器/标签样式全局生效
- 标签同步：顶部标签栏和弹窗标签联动（`syncTagUI` 函数）
- 移动端：6 张/页，桌面端：12 张/页
- 标签弹窗：移动端底部弹出，桌面端顶部弹出，stagger 入场动画
- 卡片 stagger 入场用 CSS `--d` 自定义属性控制延迟

### 文章详情页（blog/[slug].astro）
- 使用 `getStaticPaths()` + `getCollection('blog')`（SSG 路由）
- TOC 提取 h1/h2/h3 标题，h3 缩进显示
- 侧边栏 `post-toc` 在 h2 < 1 时只隐藏目录列表，最近发布始终显示
- h1: 1.8rem, h2: 1.5rem, h3: 1.2rem，三级标题有明确视觉层次
- 图片/链接/表格/分割线样式已添加

### Photo 页面（photo.astro）
- 桌面端：水平滚动轮播（`slant-hero`）+ 网格（`photo-grid`）
- 移动端：瀑布流卡片堆叠（`cascade-card`），点击展开大图
- 网格卡片 stagger 入场用 `--d` 自定义属性

### AIGC 页面（aigc.astro）
- `<style is:global>` 使动态分页器样式全局生效
- 移动端：6 张/页（双列网格），桌面端：3 列
- 分页器样式与 blog 页面完全一致

### Link 页面（link.astro）
- 轮播 + 卡片阴影结构（见下方 Link 架构说明）
- 分页器样式与 blog 页面一致

### About 页面（about.astro）
- 三个 section 使用 `reveal` 动画 stagger 入场
- IntersectionObserver 触发 `.visible` 类

### Character 页面（character.astro）
- `Snow` 星空背景
- `long.webp` Logo（左上角，固定定位，与眉页 logo 同尺寸）
- 无页眉

## 后端 API（admin/server.ts）
- `buildFrontmatter` 自动给 `#` 开头的值加 YAML 引号（修复 `color: #xxx` 被解析为注释）
- `writeTextFile` 不加 UTF-8 BOM（修复 Astro frontmatter 解析失败）
- 创建/修改/删除文章后自动调用 `triggerAstroBuild()`
- 文章摘要接口返回 `draft: boolean`，列表接口同理

## 动画规范
- 入场动画统一缓动：`cubic-bezier(0.16,1,0.3,1)`（快出慢停）
- 卡片 stagger 延迟：每行 0.06s（通过 CSS `--d` 自定义属性）
- 弹窗动画：遮罩 blur 0→8px + 卡片 scale(0.96)→scale(1) + 标签 stagger 入场
- 关闭动画：CSS transition 反向过渡，无需 JS 动画

## 工作流
- 复杂任务先说方案 → 确认 → 实现
- 单步操作直接执行
