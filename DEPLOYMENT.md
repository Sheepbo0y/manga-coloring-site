# 漫画上色网站部署指南

## 🎉 部署完成

- **前端**: https://sheepbo0y.github.io/manga-coloring-site/
- **后端**: https://manga-coloring-backend-production.up.railway.app/api
- **GitHub 仓库**: https://github.com/Sheepbo0y/manga-coloring-site

---

## 📋 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户访问                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                           │
        ▼                           ▼
┌──────────────┐          ┌──────────────────┐
│  GitHub Pages │          │  Railway         │
│  (前端静态页面)│          │  (后端 API + DB) │
│               │          │                  │
│  React + Vite │◄────────►│  Node.js +       │
│  自动部署     │   API    │  PostgreSQL      │
└──────────────┘          └──────────────────┘
```

---

## 🚀 部署步骤（从零开始）

### 一、准备代码

1. **Fork 或克隆仓库**
   ```bash
   git clone https://github.com/Sheepbo0y/manga-coloring-site.git
   cd manga-coloring-site
   ```

2. **本地测试（可选）**
   ```bash
   # 安装依赖
   npm install
   
   # 启动开发服务器
   npm run dev
   ```

---

### 二、部署后端到 Railway

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **添加数据库**
   - 点击 "+ New" → "Database" → "PostgreSQL"
   - 再次点击 "+ New" → "Database" → "Redis"（可选）

4. **配置环境变量**
   - 点击后端服务 → "Variables"
   - 添加以下变量：
     ```
     DATABASE_URL = ${Postgres.DATABASE_URL}
     REDIS_URL = ${Redis.REDIS_PUBLIC_URL}  # 可选
     JWT_SECRET = 你的随机密钥（随便写一串字符）
     PORT = 3001
     NODE_ENV = production
     FRONTEND_URL = https://你的用户名.github.io/manga-coloring-site
     UPLOAD_DIR = ./uploads
     ```

5. **部署**
   - 点击 "Deploy"
   - 等待 2-3 分钟
   - 获取域名（如 `https://xxx.up.railway.app`）

---

### 三、部署前端到 GitHub Pages

1. **配置 GitHub Actions**
   - 仓库已包含 `.github/workflows/deploy-frontend.yml`
   - 无需额外配置

2. **设置环境变量**
   - 打开仓库 → Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - Name: `API_URL`
   - Value: `https://你的railway域名/api`
   - 点击 "Add secret"

3. **触发部署**
   - 点击 Actions 标签
   - 选择 "Deploy Frontend to GitHub Pages"
   - 点击 "Run workflow"

4. **启用 GitHub Pages**
   - Settings → Pages
   - Source: "GitHub Actions"
   - 保存

5. **访问网站**
   - 等待 2-3 分钟
   - 访问 `https://你的用户名.github.io/manga-coloring-site`

---

## 🔧 关键配置说明

### 1. Vite 配置 (`frontend/vite.config.ts`)

```typescript
export default defineConfig({
  base: '/manga-coloring-site/',  // GitHub Pages 子目录路径
  // ...
});
```

### 2. React Router 配置 (`frontend/src/main.tsx`)

```typescript
<BrowserRouter basename="/manga-coloring-site">
  {/* 路由配置 */}
</BrowserRouter>
```

### 3. Railway 配置 (`railway.json`)

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "cd backend && npx prisma migrate deploy && npm start"
  }
}
```

---

## 🔄 自动部署

### 前端自动部署
- 每次 `git push` 到 main 分支
- GitHub Actions 自动构建并部署到 GitHub Pages

### 后端自动部署
- 每次 `git push` 到 main 分支
- Railway 自动拉取代码并重新部署

---

## 🛠️ 常见问题

### 1. 前端 404 错误
**原因**: 资源路径不正确
**解决**: 确保 `vite.config.ts` 中设置了 `base: '/manga-coloring-site/'`

### 2. 前端白屏
**原因**: React Router basename 未设置
**解决**: 确保 `main.tsx` 中设置了 `basename="/manga-coloring-site"`

### 3. 后端数据库连接失败
**原因**: DATABASE_URL 环境变量未设置
**解决**: 在 Railway 中添加 `DATABASE_URL = ${Postgres.DATABASE_URL}`

### 4. API 请求失败
**原因**: 前端 API 地址不正确
**解决**: 检查 GitHub Secrets 中的 `API_URL` 是否正确

### 5. Redis 连接错误
**原因**: Redis 未配置或 REDIS_URL 错误
**解决**: 可选，不影响基本功能。如需使用，添加 Redis 服务并配置 `REDIS_URL`

---

## 📁 项目结构

```
manga-coloring-site/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/   # UI 组件
│   │   ├── pages/        # 页面组件
│   │   ├── lib/          # 工具库
│   │   └── main.tsx      # 入口文件
│   ├── index.html
│   └── vite.config.ts    # Vite 配置
├── backend/              # Node.js 后端
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   └── services/     # 业务服务
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml  # GitHub Actions 配置
├── railway.json          # Railway 部署配置
└── README.md
```

---

## 🔐 环境变量清单

### 后端必需变量
| 变量名 | 说明 | 示例 |
|--------|------|------|
| DATABASE_URL | PostgreSQL 连接字符串 | ${Postgres.DATABASE_URL} |
| JWT_SECRET | JWT 签名密钥 | my-secret-key-123 |
| PORT | 服务端口 | 3001 |
| NODE_ENV | 环境模式 | production |
| FRONTEND_URL | 前端地址 | https://xxx.github.io |

### 后端可选变量
| 变量名 | 说明 | 示例 |
|--------|------|------|
| REDIS_URL | Redis 连接字符串 | ${Redis.REDIS_PUBLIC_URL} |
| UPLOAD_DIR | 文件上传目录 | ./uploads |
| COMFYUI_API_URL | ComfyUI 服务地址 | http://localhost:8188 |

### 前端必需变量
| 变量名 | 说明 | 示例 |
|--------|------|------|
| API_URL | 后端 API 地址 | https://xxx.up.railway.app/api |

---

## 📝 更新部署

### 更新代码
```bash
git add .
git commit -m "更新说明"
git push
```

### 自动部署
- 前端：GitHub Actions 自动部署（约 2 分钟）
- 后端：Railway 自动部署（约 1 分钟）

---

## 🎨 功能特性

- ✅ 用户注册/登录（JWT 认证）
- ✅ 漫画作品展示（画廊、热门、精选）
- ✅ 作品上传（拖拽上传）
- ✅ 收藏功能
- ✅ 点赞功能
- ✅ 搜索/筛选
- ✅ 响应式设计

---

## 🔗 相关链接

- **GitHub 仓库**: https://github.com/Sheepbo0y/manga-coloring-site
- **Railway 官网**: https://railway.app
- **GitHub Pages 文档**: https://docs.github.com/pages
- **Vite 部署指南**: https://vitejs.dev/guide/static-deploy.html

---

## 📞 技术支持

遇到问题？
1. 查看 GitHub Issues
2. 检查 Railway 部署日志
3. 检查 GitHub Actions 运行日志

---

**部署完成！🎉**

现在你可以访问你的网站了：
- 前端: https://sheepbo0y.github.io/manga-coloring-site/
- 后端 API: https://manga-coloring-backend-production.up.railway.app/api