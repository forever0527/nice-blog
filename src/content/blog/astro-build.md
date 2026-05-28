---
title: 如何用 Astro 构建极致性能博客
desc: 从零开始，利用 Astro 的 Islands 架构打造一个轻量、高速、现代化的个人博客。
date: 2026-05-15
tag: 前端开发
color: "#ff5d01"
img: /img/bg/1.webp
---
Astro 是一个为了速度而生的静态站点生成器。它默认不向客户端发送任何 JavaScript，只在需要交互时按需加载。这种 Islands 架构让页面保持极致轻盈。

## 为什么选 Astro

传统的 SSG 如 Next.js 或 Gatsby 会向客户端发送大量 JS 水合代码。Astro 采用了不同的思路——服务端渲染一切，交互组件作为独立岛屿存在。

## 实战步骤

1. 初始化项目
2. 配置内容集合
3. 编写布局组件
4. 部署上线
