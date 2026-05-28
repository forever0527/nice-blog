# Nice Blog

## 技术栈
- Astro 5 (SSG) + React 19 + Tailwind CSS v4 + TypeScript
- Three.js 用于首页流体背景（LiquidEther.tsx），不改动

## 项目结构
```
src/
├── pages/          # 路由页面 (.astro)
├── components/
│   └── react/      # React 特效组件
├── layouts/        # 布局模板
├── content/blog/   # Markdown 博文
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

## 工作流
- 复杂任务先说方案 → 确认 → 实现
- 单步操作直接执行
