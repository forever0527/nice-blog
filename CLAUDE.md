# Nice Blog

## 技术栈
- Astro 5 (SSG) + React 19 + Tailwind CSS v4 + TypeScript
- Three.js 用于首页流体背景（LiquidEther.tsx），不改动

## 项目结构
```
src/
├── pages/          # 路由页面 (.astro)
├── components/     # Astro 组件
│   └── react/      # React 特效组件
├── layouts/        # 布局模板
├── content/blog/   # Markdown 博文
├── content/photos.ts  # 照片数据源
└── styles/         # 全局样式
```

## 约定
- 新样式用 Tailwind 类名，不往 global.css 加新代码
- React 组件写 .tsx，不写 .jsx
- Astro 组件用 scoped style，不用 global block
- 页面布局用 BaseLayout 包裹

## 当前目标
（每次任务开始前更新这行，让 AI 知道你要干什么）

## 禁止
- 不要随便装新依赖，先讨论
- 不要改 astro.config.mjs 和 tsconfig.json 除非明确需要
- LiquidEther.tsx 不改动
- **绝对不要 `git checkout HEAD` 或 `git restore` 任何文件** — 当前工作区有大量未提交的功能改动（~2800行/12个文件），执行 git restore 会直接丢失所有未提交修改

## 当前工作区状态（重要）
- 工作区有大量未提交改动，涉及：Header、Footer、Snow、index、blog、photo、about、aigc、link、global.css
- `HeaderDecor.astro` 已删除
- `src/content/photos.ts` 是新的照片数据源（含 slug/location/desc 字段）
- `photo.astro` 使用 Snow 组件、Timeline、Photo Grid、PNG 花括弧边框
- `HeroTitle.astro` 是可复用标题组件，用于 photo/aigc/link/about 页面
- 修改任何文件前，先确认当前状态，不要假设文件是 git HEAD 版本

## 工作流
- 复杂任务先说方案 → 确认 → 实现
- 单步操作直接执行
