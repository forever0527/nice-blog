# nice-blog

一个使用 Astro 构建的个性化博客与作品展示站点，带有强大的管理后台。

## 🚀 快速开始

1. 克隆仓库
   ```bash
git clone https://github.com/forever0527/nice-blog.git
cd nice-blog
```

2. 安装依赖
   ```bash
npm install
```

3. 配置环境变量
   ```bash
cp .env.example .env
# 编辑 .env 文件，设置安全密码和密钥
```

4. 启动开发服务器
   ```bash
npm run dev
```

5. 启动管理后台（单独进程）
   ```bash
cd admin && npm install && npm run dev
```

## 环境变量 (.env)

```env
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-very-long-random-secret-key-2026-change-me
PORT=3001
NODE_ENV=development
```

**安全提示**：生产环境必须修改默认密码和 secret！

## 项目特性
- 液态玻璃摩登 UI + 粒子动画 + 雪花效果
- Hono + 文件系统驱动的管理后台
- 文章、照片、AIGC 内容管理
- Vercel 部署支持

## 优化记录
- 安全：环境变量 + CORS 限制 + 密码哈希
- 性能：JS 抽离 + 图片优化
- 架构：README 重写

更多详情见 `BACKEND_GUIDE.md`