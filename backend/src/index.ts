import dotenv from 'dotenv';
import app from './app';
import { prisma, disconnect } from './lib/prisma';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // 验证必要的环境变量
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  警告：DATABASE_URL 未设置，使用默认值');
    }

    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 验证连接
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ 数据库查询测试通过');
    } catch (error) {
      console.error('⚠️  数据库查询测试失败:', error);
    }

    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📝 环境：${NODE_ENV}`);
      console.log(`🏥 健康检查：http://localhost:${PORT}/api/health`);
    });

    // 设置超时
    server.timeout = 300000; // 5 分钟超时（用于长时间运行的任务）
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 收到 ${signal} 信号，正在关闭服务器...`);
  try {
    await disconnect();
    console.log('✅ 服务器已优雅关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭过程中发生错误:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('beforeExit', async () => {
  await disconnect();
});

startServer();
