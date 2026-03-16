import Queue from 'bull';
import type { Job } from 'bull';
import { prisma } from '../lib/prisma';
import { colorizeImage, isConfigured } from './seedream';

const REDIS_URL = process.env.REDIS_URL;

const isRedisConfigured = !!(REDIS_URL && REDIS_URL.startsWith('redis'));
const isSeedreamConfigured = isConfigured();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let colorizationQueue: any = null;

if (isRedisConfigured && isSeedreamConfigured) {
  const redisConfig = REDIS_URL 
    ? { url: REDIS_URL }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      };

  colorizationQueue = new Queue('colorization', {
    redis: redisConfig,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });

  colorizationQueue.process(async (job: Job) => {
    const { colorizationId, imageUrl } = job.data as {
      colorizationId: string;
      imageUrl: string;
    };

    const startTime = Date.now();

    try {
      await prisma.colorization.update({
        where: { id: colorizationId },
        data: { status: 'RUNNING', progress: 10 },
      });

      // 使用 Seedream API 进行上色
      await prisma.colorization.update({
        where: { id: colorizationId },
        data: { progress: 30 },
      });

      job.progress(30);

      // 调用 Seedream API 生成彩色图片
      const resultUrl = await colorizeImage(imageUrl);

      await prisma.colorization.update({
        where: { id: colorizationId },
        data: { progress: 90 },
      });

      job.progress(90);

      const processingTime = Date.now() - startTime;

      await prisma.colorization.update({
        where: { id: colorizationId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          colorizedImage: resultUrl,
          processingTime,
        },
      });

      const colorization = await prisma.colorization.findUnique({
        where: { id: colorizationId },
        include: { artwork: true },
      });

      if (colorization) {
        await prisma.artwork.update({
          where: { id: colorization.artworkId },
          data: { status: 'COMPLETED' },
        });
      }

      return { success: true, resultUrl, processingTime };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '未知错误';

      await prisma.colorization.update({
        where: { id: colorizationId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });

      throw error;
    }
  });

  colorizationQueue.on('completed', (job: Job) => {
    console.log(`任务 ${job.id} 已完成`);
  });

  colorizationQueue.on('failed', (job: Job | null, err: Error) => {
    console.error(`任务 ${job?.id} 失败:`, err.message);
  });

  colorizationQueue.on('error', (err: Error) => {
    console.error('队列错误:', err);
  });
} else {
  if (!isRedisConfigured) {
    console.log('⚠️  Redis 未配置，队列功能将不可用');
  }
  if (!isSeedreamConfigured) {
    console.log('⚠️  MODELVERSE_API_KEY 未配置，Seedream API 将不可用');
  }
}

export { colorizationQueue };

export async function addColorizationJob(colorizationId: string, imageUrl: string) {
  if (!colorizationQueue) {
    console.log('⚠️  队列未配置，跳过添加任务');
    return null;
  }
  
  return colorizationQueue.add(
    { colorizationId, imageUrl },
    { priority: 1 }
  );
}

export async function getQueueStats() {
  if (!colorizationQueue) {
    return { waiting: 0, active: 0, completed: 0, failed: 0 };
  }
  
  const [waiting, active, completed, failed] = await Promise.all([
    colorizationQueue.getWaitingCount(),
    colorizationQueue.getActiveCount(),
    colorizationQueue.getCompletedCount(),
    colorizationQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

export async function clearQueue() {
  if (!colorizationQueue) {
    return { success: false, message: '队列未配置' };
  }
  
  await colorizationQueue.empty();
  return { success: true };
}
