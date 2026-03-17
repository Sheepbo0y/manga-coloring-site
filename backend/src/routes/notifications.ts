import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * 获取当前用户的通知列表（需要登录）
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';

    const where: Record<string, unknown> = {
      userId: req.user!.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          artwork: {
            select: {
              id: true,
              title: true,
              coverImage: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({ error: '获取通知列表失败' });
  }
});

/**
 * 获取未读通知数量（需要登录）
 */
router.get('/unread/count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    res.status(500).json({ error: '获取未读通知数量失败' });
  }
});

/**
 * 标记通知为已读（需要登录）
 */
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    // 只能标记自己的通知
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: '无权操作此通知' });
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ message: '已标记为已读' });
  } catch (error) {
    console.error('标记通知失败:', error);
    res.status(500).json({ error: '标记通知失败' });
  }
});

/**
 * 批量标记所有通知为已读（需要登录）
 */
router.patch('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ message: '已标记所有通知为已读' });
  } catch (error) {
    console.error('批量标记通知失败:', error);
    res.status(500).json({ error: '批量标记通知失败' });
  }
});

/**
 * 删除通知（需要登录）
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    // 只能删除自己的通知
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: '无权操作此通知' });
    }

    await prisma.notification.delete({
      where: { id: req.params.id },
    });

    res.json({ message: '删除通知成功' });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({ error: '删除通知失败' });
  }
});

export default router;
