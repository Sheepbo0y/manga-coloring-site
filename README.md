# 漫画上色展示网站

一个使用 AI 技术为黑白漫画上色的全栈 Web 应用。

## 功能特性

### 前端功能
- **首页**：精选作品轮播、最新上传、热门排行
- **画廊**：瀑布流展示、分类筛选、排序功能
- **上传页面**：拖拽上传、处理进度显示
- **作品详情**：大图展示、原图/上色对比（滑动对比）
- **个人中心**：我的作品、收藏管理、账号设置

### 后端功能
- RESTful API 设计
- JWT 用户认证
- 文件上传处理（multer）
- ComfyUI API 集成
- 任务队列管理（Bull + Redis）
- 管理员后台接口

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (状态管理)
- Axios
- React Hot Toast

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis + Bull (队列)
- JWT 认证
- ComfyUI API

## 项目结构

```
manga-coloring-site/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/   # 公共组件
│   │   ├── pages/        # 页面组件
│   │   ├── lib/          # 工具库
│   │   ├── store/        # 状态管理
│   │   └── types/        # TypeScript 类型
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Node.js 后端
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   ├── services/     # 业务服务
│   │   └── lib/          # 工具库
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   └── package.json
├── docker-compose.yml    # Docker 编排
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7
- (可选) Docker & Docker Compose
- (可选) ComfyUI

### 方式一：使用 Docker（推荐）

1. 克隆项目
```bash
git clone <repo-url>
cd manga-coloring-site
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的变量
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问应用
- 前端：http://localhost
- 后端 API: http://localhost:3001
- ComfyUI: http://localhost:8188

### 方式二：本地开发

#### 1. 安装依赖

```bash
# 根目录安装
npm install

# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

#### 2. 配置数据库

```bash
# 启动 PostgreSQL 和 Redis（可使用 Docker）
docker-compose up -d postgres redis

# 运行数据库迁移
cd backend
npx prisma migrate dev
npx prisma generate

# 初始化示例数据
npm run db:seed
```

#### 3. 配置环境变量

```bash
# 后端 .env
cp .env.example .env

# 前端 .env.example
cp frontend/.env.example frontend/.env
```

#### 4. 启动开发服务器

```bash
# 方式一：同时启动前后端（推荐）
cd ..
npm run dev

# 方式二：分别启动
# 后端
cd backend
npm run dev

# 前端（新终端）
cd frontend
npm run dev
```

#### 5. 访问应用

- 前端：http://localhost:5173
- 后端 API: http://localhost:3001

## API 接口

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/profile | 更新资料 |
| PUT | /api/auth/password | 修改密码 |

### 作品接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/artworks | 获取作品列表 |
| GET | /api/artworks/popular | 获取热门作品 |
| GET | /api/artworks/featured | 获取精选作品 |
| GET | /api/artworks/:id | 获取作品详情 |
| POST | /api/artworks | 上传作品 |
| POST | /api/artworks/:id/like | 点赞作品 |
| GET | /api/artworks/user/me | 我的作品 |

### 收藏接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/collections | 收藏列表 |
| GET | /api/collections/check/:id | 检查收藏状态 |
| POST | /api/collections/:id | 添加收藏 |
| DELETE | /api/collections/:id | 取消收藏 |

### 管理员接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/admin/queue/stats | 队列统计 |
| GET | /api/admin/users | 用户列表 |
| DELETE | /api/admin/users/:id | 删除用户 |
| DELETE | /api/admin/artworks/:id | 删除作品 |
| PATCH | /api/admin/artworks/:id/featured | 设置精选 |

## 默认账号

项目 seeding 后有以下默认账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | admin123 |
| 用户 | user1@example.com | admin123 |
| 用户 | user2@example.com | admin123 |

## 生产部署

### 构建

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build
```

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.yml up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## ComfyUI 配置

本项目使用 ComfyUI 进行 AI 上色。要使用此功能：

1. 确保 ComfyUI 服务正在运行
2. 配置 `COMFYUI_API_URL` 环境变量
3. 在 ComfyUI 中配置上色工作流

注意：如果没有 ComfyUI，上传功能会返回错误，但其他功能仍可正常使用。

## 开发说明

### 添加新的 API 端点

1. 在 `backend/src/routes/` 创建或编辑路由文件
2. 在 `backend/src/app.ts` 中注册路由
3. 在 `frontend/src/lib/api.ts` 中添加对应的 API 调用方法

### 添加新的页面

1. 在 `frontend/src/pages/` 创建页面组件
2. 在 `frontend/src/App.tsx` 中添加路由

### 数据库迁移

```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

## 故障排除

### 数据库连接失败

确保 PostgreSQL 正在运行：
```bash
docker-compose ps
```

### Redis 连接失败

确保 Redis 正在运行：
```bash
docker-compose ps
```

### 端口冲突

修改 `.env` 中的 `PORT` 变量或 docker-compose.yml 中的端口映射。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
