import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * 获取用户公开信息（主页）
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            artworks: true,
            followers: true,
            follows: true,
            collections: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 如果是当前登录用户，检查关注状态
    let isFollowing = false;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'default-secret';
        const decoded: any = jwt.verify(token, secret);
        if (decoded && decoded.id) {
          const follow = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: decoded.id,
                followingId: req.params.id,
              },
            },
          });
          isFollowing = !!follow;
        }
      } catch {
        // Token 无效或过期，忽略
      }
    }

    res.json({
      user,
      isFollowing,
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * 获取用户作品列表
 */
router.get('/:id/artworks', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const status = req.query.status as string;

    const where: Record<string, unknown> = {
      userId: req.params.id,
    };

    if (status) {
      where.status = status;
    }

    const [artworks, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          colorizations: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              colorizedImage: true,
              status: true,
              progress: true,
            },
          },
          _count: {
            select: { collections: true },
          },
        },
      }),
      prisma.artwork.count({ where }),
    ]);

    res.json({
      data: artworks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取用户作品失败:', error);
    res.status(500).json({ error: '获取用户作品失败' });
  }
});

/**
 * 获取用户收藏列表（公开）
 */
router.get('/:id/collections', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

    const collections = await prisma.collection.findMany({
      where: { userId: req.params.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        artwork: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            colorizations: {
              take: 1,
              select: { colorizedImage: true },
            },
            _count: {
              select: { collections: true },
            },
          },
        },
      },
    });

    const total = await prisma.collection.count({
      where: { userId: req.params.id },
    });

    res.json({
      data: collections.map((c) => c.artwork),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取用户收藏失败:', error);
    res.status(500).json({ error: '获取用户收藏失败' });
  }
});

export default router;
