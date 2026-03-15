import dotenv from 'dotenv';
import app from './app';
import { prisma } from './lib/prisma';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001');

async function startServer() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📝 API 文档：http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 正在关闭服务器...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
