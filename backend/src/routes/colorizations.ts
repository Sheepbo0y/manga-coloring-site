import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * 获取上色任务状态
 */
router.get('/:id/status', async (req, res) => {
  try {
    const colorization = await prisma.colorization.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        progress: true,
        errorMessage: true,
        colorizedImage: true,
        processingTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!colorization) {
      return res.status(404).json({ error: '任务不存在' });
    }

    res.json({ data: colorization });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    res.status(500).json({ error: '获取任务状态失败' });
  }
});

/**
 * 获取用户的上色任务列表
 */
router.get('/user/:userId/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const colorizations = await prisma.colorization.findMany({
      where: { userId: req.params.userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        artwork: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
    });

    const total = await prisma.colorization.count({
      where: { userId: req.params.userId },
    });

    res.json({
      data: colorizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

export default router;
