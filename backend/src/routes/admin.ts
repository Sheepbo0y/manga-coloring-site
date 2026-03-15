import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getQueueStats, clearQueue } from '../services/queue';
import { comfyUIService } from '../services/comfyui';

const router = Router();

/**
 * 获取任务队列状态
 */
router.get('/queue/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const stats = await getQueueStats();
    res.json({ data: stats });
  } catch (error) {
    console.error('获取队列状态失败:', error);
    res.status(500).json({ error: '获取队列状态失败' });
  }
});

/**
 * 清空任务队列
 */
router.post('/queue/clear', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const result = await clearQueue();
    res.json(result);
  } catch (error) {
    console.error('清空队列失败:', error);
    res.status(500).json({ error: '清空队列失败' });
  }
});

/**
 * 获取 ComfyUI 状态
 */
router.get('/comfyui/health', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const isHealthy = await comfyUIService.checkHealth();
    const models = await comfyUIService.getModels();

    res.json({
      data: {
        healthy: isHealthy,
        models,
      },
    });
  } catch (error) {
    console.error('获取 ComfyUI 状态失败:', error);
    res.status(500).json({ error: '获取 ComfyUI 状态失败' });
  }
});

/**
 * 获取所有任务（管理员）
 */
router.get('/tasks', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.task.count({ where });

    res.json({
      data: tasks,
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

/**
 * 获取所有用户（管理员）
 */
router.get('/users', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            artworks: true,
            collections: true,
          },
        },
      },
    });

    const total = await prisma.user.count();

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

/**
 * 删除用户（管理员）
 */
router.delete('/users/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: '用户已删除' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

/**
 * 删除作品（管理员）
 */
router.delete('/artworks/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    await prisma.artwork.delete({
      where: { id: req.params.id },
    });

    res.json({ message: '作品已删除' });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ error: '删除作品失败' });
  }
});

/**
 * 设置精选作品（管理员）
 */
router.patch('/artworks/:id/featured', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { isFeatured } = req.body;

    const artwork = await prisma.artwork.update({
      where: { id: req.params.id },
      data: { isFeatured: isFeatured ?? true },
    });

    res.json({ data: artwork });
  } catch (error) {
    console.error('设置精选作品失败:', error);
    res.status(500).json({ error: '设置精选作品失败' });
  }
});

export default router;
