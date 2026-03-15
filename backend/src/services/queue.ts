import Queue from 'bull';
import { prisma } from '../lib/prisma';
import { comfyUIService } from './comfyui';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// 创建任务队列
export const colorizationQueue = new Queue('colorization', {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
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

// 任务处理器
colorizationQueue.process(async (job) => {
  const { colorizationId, imageUrl } = job.data as {
    colorizationId: string;
    imageUrl: string;
  };

  const startTime = Date.now();

  try {
    // 更新任务状态为运行中
    await prisma.colorization.update({
      where: { id: colorizationId },
      data: { status: 'RUNNING', progress: 10 },
    });

    // 提交到 ComfyUI
    await prisma.colorization.update({
      where: { id: colorizationId },
      data: { progress: 20 },
    });

    const comfyuiJobId = await comfyUIService.submitColorization(
      colorizationId,
      imageUrl
    );

    // 轮询检查进度
    let progress = 20;
    let completed = false;
    const maxPollTime = 5 * 60 * 1000; // 5 分钟超时
    const pollInterval = 2000; // 2 秒轮询一次

    while (!completed && Date.now() - startTime < maxPollTime) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const { progress: comfyProgress, status } =
        await comfyUIService.getProgress(comfyuiJobId);

      progress = 20 + Math.floor((comfyProgress / 100) * 70);

      await prisma.colorization.update({
        where: { id: colorizationId },
        data: { progress },
      });

      if (status === 'COMPLETED') {
        completed = true;
      } else if (status === 'FAILED') {
        throw new Error('ComfyUI 处理失败');
      }

      job.progress(progress);
    }

    if (!completed) {
      throw new Error('处理超时');
    }

    // 获取结果
    const resultUrl = await comfyUIService.getResult(comfyuiJobId);

    if (!resultUrl) {
      throw new Error('未获取到处理结果');
    }

    const processingTime = Date.now() - startTime;

    // 更新为完成状态
    await prisma.colorization.update({
      where: { id: colorizationId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        colorizedImage: resultUrl,
        processingTime,
      },
    });

    // 更新作品状态
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

// 队列事件监听
colorizationQueue.on('completed', (job) => {
  console.log(`任务 ${job.id} 已完成`);
});

colorizationQueue.on('failed', (job, err) => {
  console.error(`任务 ${job?.id} 失败:`, err.message);
});

colorizationQueue.on('error', (err) => {
  console.error('队列错误:', err);
});

// 获取队列统计
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    colorizationQueue.getWaitingCount(),
    colorizationQueue.getActiveCount(),
    colorizationQueue.getCompletedCount(),
    colorizationQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

// 清空队列（管理员功能）
export async function clearQueue() {
  await colorizationQueue.empty();
  return { success: true };
}
