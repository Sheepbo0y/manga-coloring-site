# Railway 部署说明

## 环境变量配置

在 Railway 中设置以下环境变量：

### 必需的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接 URL | Railway 会自动提供 |
| `JWT_SECRET` | JWT 签名密钥 | `your-super-secret-key` |
| `FRONTEND_URL` | 前端地址 | `https://sheepboy.github.io/manga-coloring-site` |
| `NODE_ENV` | 运行环境 | `production` |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | `3001` |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |
| `REDIS_HOST` | Redis 主机地址 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `COMFYUI_API_URL` | ComfyUI 服务地址 | `http://localhost:8188` |

## 部署步骤

1. **连接 GitHub 仓库**
   - 在 Railway 中连接你的 GitHub 仓库
   - 选择 `manga-coloring-site` 仓库

2. **配置构建命令**
   ```bash
   cd backend && npm install --legacy-peer-deps && npx prisma generate && npm run build
   ```

3. **配置启动命令**
   ```bash
   cd backend && npx prisma migrate deploy --skip-generate && (npx tsx prisma/seed.ts || true) && npm start
   ```

4. **设置环境变量**
   - 在 Railway 控制面板中添加上述环境变量

5. **部署**
   - Railway 会自动部署，首次部署约需 2-3 分钟

## 健康检查

部署完成后，访问以下端点验证服务状态：

- **健康检查**: `https://your-app.railway.app/api/health`
- **就绪检查**: `https://your-app.railway.app/api/ready`

健康检查返回示例：
```json
{
  "status": "ok",
  "timestamp": "2026-03-16T10:00:00.000Z",
  "uptime": 120.5,
  "environment": "production",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "responseTime": 15
  }
}
```

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/profile` - 更新用户资料
- `PUT /api/auth/password` - 修改密码

### 作品
- `GET /api/artworks` - 获取作品列表
- `GET /api/artworks/popular` - 获取热门作品
- `GET /api/artworks/featured` - 获取精选作品
- `GET /api/artworks/:id` - 获取作品详情
- `POST /api/artworks` - 上传作品
- `POST /api/artworks/:id/like` - 点赞作品
- `GET /api/artworks/user/me` - 获取我的作品

### 收藏
- `GET /api/collections` - 获取收藏列表
- `GET /api/collections/check/:artworkId` - 检查收藏状态
- `POST /api/collections/:artworkId` - 添加收藏
- `DELETE /api/collections/:artworkId` - 取消收藏

### 上色任务
- `GET /api/colorizations/:id/status` - 获取任务状态
- `GET /api/colorizations/user/:userId/list` - 获取任务列表

### 管理
- `GET /api/admin/queue/stats` - 获取队列状态
- `POST /api/admin/queue/clear` - 清空队列
- `GET /api/admin/comfyui/health` - 检查 ComfyUI 状态
- `GET /api/admin/users` - 获取用户列表
- `DELETE /api/admin/users/:id` - 删除用户
- `DELETE /api/admin/artworks/:id` - 删除作品
- `PATCH /api/admin/artworks/:id/featured` - 设置精选作品

## 默认账户

部署后，可以使用以下默认账户登录：

**管理员账户**
- 邮箱：`admin@example.com`
- 密码：`admin123`

**示例用户**
- 邮箱：`user1@example.com`
- 密码：`admin123`

## 故障排查

### 数据库连接失败

1. 检查 `DATABASE_URL` 是否正确设置
2. 确认 Railway PostgreSQL 服务已启动
3. 查看 Railway 日志中的数据库连接信息

### CORS 错误

1. 确认 `FRONTEND_URL` 设置正确
2. 检查前端请求是否携带了正确的凭证
3. 查看服务器日志中的 CORS 警告信息

### 迁移失败

1. 手动运行迁移命令：
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. 检查迁移文件是否存在：
   ```bash
   ls backend/prisma/migrations
   ```

### 内存不足

如果 Railway 报告内存不足：
1. 在 Railway 中增加实例内存
2. 优化 Prisma 查询，使用分页
3. 调整速率限制配置

## 日志查看

在 Railway 控制面板中可以查看实时日志：
1. 进入你的项目
2. 点击 "Deployments"
3. 查看 "Logs" 标签页

关键日志标记：
- `✅` - 成功
- `🚀` - 服务器启动
- `❌` - 错误
- `⚠️` - 警告
