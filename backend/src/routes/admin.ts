import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { getQueueStats, clearQueue } from '../services/queue';
import { comfyUIService } from '../services/comfyui';

const router = Router();

// 所有管理员路由都需要管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * 获取系统统计数据
 */
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [
      totalUsers,
      totalArtworks,
      totalColorizations,
      totalCollections,
      todayColorizations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.artwork.count(),
      prisma.colorization.count(),
      prisma.collection.count(),
      prisma.colorization.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      data: {
        totalUsers,
        totalArtworks,
        totalColorizations,
        totalCollections,
        todayColorizations,
      },
    });
  } catch (error) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({ error: '获取系统统计失败' });
  }
});

/**
 * 获取所有用户（管理员）- 包含 freeCredits
 */
router.get('/users', async (req: AuthRequest, res) => {
  try {
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
        isAdmin: true,
        freeCredits: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            artworks: true,
            collections: true,
            colorizations: true,
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
 * 调整用户免费次数（管理员）
 */
router.post('/users/:id/credits', async (req: AuthRequest, res) => {
  try {
    const { amount, reason } = req.body;

    if (typeof amount !== 'number' || amount === 0) {
      return res.status(400).json({ error: '请输入有效的调整数量' });
    }

    const userId = req.params.id;

    // 使用事务更新用户次数并记录日志
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { freeCredits: true, username: true },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      const newBalance = user.freeCredits + amount;
      if (newBalance < 0) {
        throw new Error('调整后的次数不能为负数');
      }

      // 更新用户次数
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { freeCredits: newBalance },
        select: {
          id: true,
          username: true,
          freeCredits: true,
        },
      });

      // 记录变动日志
      await tx.creditLog.create({
        data: {
          userId,
          amount,
          balance: newBalance,
          reason: reason || '管理员手动调整',
        },
      });

      return updatedUser;
    });

    res.json({
      message: `成功为用户 ${result.username} 调整${amount > 0 ? '增加' : '减少'}${Math.abs(amount)}次次数`,
      data: result,
    });
  } catch (error: any) {
    console.error('调整用户次数失败:', error);
    res.status(400).json({ error: error.message || '调整用户次数失败' });
  }
});

/**
 * 获取用户次数变动历史（管理员）
 */
router.get('/users/:id/credit-logs', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const creditLogs = await prisma.creditLog.findMany({
      where: { userId: req.params.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    const total = await prisma.creditLog.count({
      where: { userId: req.params.id },
    });

    res.json({
      data: creditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取次数变动历史失败:', error);
    res.status(500).json({ error: '获取次数变动历史失败' });
  }
});

/**
 * 获取任务队列状态
 */
router.get('/queue/stats', async (req: AuthRequest, res) => {
  try {
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
router.post('/queue/clear', async (req: AuthRequest, res) => {
  try {
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
router.get('/comfyui/health', async (req: AuthRequest, res) => {
  try {
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
router.get('/tasks', async (req: AuthRequest, res) => {
  try {
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
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
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
router.delete('/artworks/:id', async (req: AuthRequest, res) => {
  try {
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
router.patch('/artworks/:id/featured', async (req: AuthRequest, res) => {
  try {
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
