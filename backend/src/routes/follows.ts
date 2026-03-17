import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * 获取用户关注列表（需要登录）
 */
router.get('/following/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const follows = await prisma.follow.findMany({
      where: { followerId: req.params.userId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                artworks: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.follow.count({
      where: { followerId: req.params.userId },
    });

    res.json({
      data: follows.map((f) => f.following),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({ error: '获取关注列表失败' });
  }
});

/**
 * 获取用户粉丝列表
 */
router.get('/followers/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const follows = await prisma.follow.findMany({
      where: { followingId: req.params.userId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                artworks: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.follow.count({
      where: { followingId: req.params.userId },
    });

    res.json({
      data: follows.map((f) => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({ error: '获取粉丝列表失败' });
  }
});

/**
 * 检查是否关注
 */
router.get('/check/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user!.id,
          followingId: req.params.userId,
        },
      },
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('检查关注状态失败:', error);
    res.status(500).json({ error: '检查关注状态失败' });
  }
});

/**
 * 关注用户（需要登录）
 */
router.post('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const targetUserId = req.params.userId;

    // 不能关注自己
    if (targetUserId === req.user!.id) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 检查是否已关注
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user!.id,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: '已关注该用户' });
    }

    // 创建关注关系
    await prisma.follow.create({
      data: {
        followerId: req.user!.id,
        followingId: targetUserId,
      },
    });

    // 创建通知
    await prisma.notification.create({
      data: {
        type: 'NEW_FOLLOW',
        content: `${req.user!.username} 关注了你`,
        userId: targetUserId,
        fromUserId: req.user!.id,
      },
    });

    res.status(201).json({ message: '关注成功' });
  } catch (error) {
    console.error('关注用户失败:', error);
    res.status(500).json({ error: '关注用户失败' });
  }
});

/**
 * 取消关注（需要登录）
 */
router.delete('/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: req.user!.id,
          followingId: req.params.userId,
        },
      },
    });

    res.json({ message: '取消关注成功' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: '关注关系不存在' });
    }
    console.error('取消关注失败:', error);
    res.status(500).json({ error: '取消关注失败' });
  }
});

export default router;
