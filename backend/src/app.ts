import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import morgan from 'morgan';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 路由
import authRoutes from './routes/auth';
import artworkRoutes from './routes/artworks';
import collectionRoutes from './routes/collections';
import colorizationRoutes from './routes/colorizations';
import adminRoutes from './routes/admin';

const app = express();

// 日志中间件（开发环境）
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false, // 禁用 CSP 以允许外部图片
  crossOriginEmbedderPolicy: false, // 允许嵌入外部资源
}));

// CORS 配置 - 支持 Railway 和 GitHub Pages
const frontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = [
  frontendUrl,
  frontendUrl?.replace('/manga-coloring-site', ''),
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sheepboy.github.io',
  'https://sheepboy.github.io/manga-coloring-site',
].filter(Boolean);

// CORS 预检缓存优化
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许没有 origin 的请求（如移动应用或 curl）
      if (!origin) return callback(null, true);

      // 检查是否在允许列表中
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 允许 GitHub Pages 的所有子域名
      if (origin.endsWith('.github.io')) {
        return callback(null, true);
      }

      // 允许 Railway 部署的所有域名
      if (origin.includes('railway.app') || origin.includes('railway-internal.com')) {
        return callback(null, true);
      }

      // 允许 localhost 用于开发
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }

      console.warn(`CORS 阻止了来自 ${origin} 的请求`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 小时预检缓存
  })
);

// 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 速率限制（已调整为更宽松的配置）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 1000, // 每个 IP 最多 1000 个请求（开发/测试环境）
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 上传速率限制（已调整为更宽松的配置）
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 100, // 每个 IP 每小时最多 100 次上传
  message: { error: '上传次数过多，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/artworks', uploadLimiter);

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/colorizations', colorizationRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查 - 包含数据库状态
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const health: {
    status: 'ok' | 'degraded';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    database: {
      status: 'connected' | 'disconnected' | 'unknown';
      responseTime: number;
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: 'unknown',
      responseTime: 0,
    },
  };

  // 检查数据库连接
  try {
    const dbStart = Date.now();
    const { prisma } = await import('./lib/prisma');
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
    ]);
    health.database.status = 'connected';
    health.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    health.database.status = 'disconnected';
    health.status = 'degraded';
    console.error('健康检查 - 数据库连接失败:', error);
  }

  res.json(health);
});

// 就绪检查（用于 Kubernetes/Railway 就绪探针）
app.get('/api/ready', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma');
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
    ]);
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: 'Database not ready' });
  }
});

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 全局错误处理器 - 捕获未处理的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 不立即退出，让服务器继续运行
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise rejection:', reason);
  // 不立即退出，让服务器继续运行
});

export default app;
