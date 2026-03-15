import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 路由
import authRoutes from './routes/auth';
import artworkRoutes from './routes/artworks';
import collectionRoutes from './routes/collections';
import colorizationRoutes from './routes/colorizations';
import adminRoutes from './routes/admin';

const app = express();

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
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

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

export default app;
