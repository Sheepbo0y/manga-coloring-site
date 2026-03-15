import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * 获取用户的收藏列表
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

    const collections = await prisma.collection.findMany({
      where: { userId: req.user!.id },
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
      where: { userId: req.user!.id },
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
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
});

/**
 * 检查是否已收藏
 */
router.get('/check/:artworkId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: {
        userId_artworkId: {
          userId: req.user!.id,
          artworkId: req.params.artworkId,
        },
      },
    });

    res.json({ isCollected: !!collection });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({ error: '检查收藏状态失败' });
  }
});

/**
 * 添加收藏
 */
router.post('/:artworkId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: req.params.artworkId },
    });

    if (!artwork) {
      return res.status(404).json({ error: '作品不存在' });
    }

    // 检查是否已收藏
    const existing = await prisma.collection.findUnique({
      where: {
        userId_artworkId: {
          userId: req.user!.id,
          artworkId: artwork.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: '已收藏该作品' });
    }

    await prisma.collection.create({
      data: {
        userId: req.user!.id,
        artworkId: artwork.id,
      },
    });

    res.status(201).json({ message: '收藏成功' });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({ error: '添加收藏失败' });
  }
});

/**
 * 取消收藏
 */
router.delete('/:artworkId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.collection.delete({
      where: {
        userId_artworkId: {
          userId: req.user!.id,
          artworkId: req.params.artworkId,
        },
      },
    });

    res.json({ message: '取消收藏成功' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: '收藏不存在' });
    }
    console.error('取消收藏失败:', error);
    res.status(500).json({ error: '取消收藏失败' });
  }
});

export default router;
