import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// 验证 Schema
const createCommentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(500, '评论最多 500 个字符'),
  parentId: z.string().uuid().optional(),
});

type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * 获取作品评论列表
 */
router.get('/artwork/:artworkId', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const comments = await prisma.comment.findMany({
      where: {
        artworkId: req.params.artworkId,
        parentId: null, // 只获取一级评论
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    const total = await prisma.comment.count({
      where: {
        artworkId: req.params.artworkId,
        parentId: null,
      },
    });

    res.json({
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ error: '获取评论列表失败' });
  }
});

/**
 * 获取用户评论列表
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const comments = await prisma.comment.findMany({
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

    const total = await prisma.comment.count({
      where: { userId: req.params.userId },
    });

    res.json({
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取用户评论失败:', error);
    res.status(500).json({ error: '获取用户评论失败' });
  }
});

/**
 * 添加评论（需要登录）
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { content, parentId } = createCommentSchema.parse(req.body);
    const artworkId = req.body.artworkId;

    if (!artworkId) {
      return res.status(400).json({ error: '作品 ID 不能为空' });
    }

    // 检查作品是否存在
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      return res.status(404).json({ error: '作品不存在' });
    }

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return res.status(404).json({ error: '父评论不存在' });
      }
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content,
        parentId,
        artworkId,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // 创建通知（如果是回复，通知父评论作者）
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { user: true },
      });

      if (parentComment && parentComment.userId !== req.user!.id) {
        await prisma.notification.create({
          data: {
            type: 'NEW_COMMENT',
            content: `${req.user!.username} 回复了你的评论`,
            userId: parentComment.userId,
            fromUserId: req.user!.id,
            artworkId,
          },
        });
      }
    } else {
      // 通知作品作者
      if (artwork.userId !== req.user!.id) {
        await prisma.notification.create({
          data: {
            type: 'NEW_COMMENT',
            content: `${req.user!.username} 评论了你的作品`,
            userId: artwork.userId,
            fromUserId: req.user!.id,
            artworkId,
          },
        });
      }
    }

    res.status(201).json({ data: comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('添加评论失败:', error);
    res.status(500).json({ error: '添加评论失败' });
  }
});

/**
 * 删除评论（需要登录）
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
    });

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 只有评论作者或管理员可以删除
    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: '没有删除权限' });
    }

    await prisma.comment.delete({
      where: { id: req.params.id },
    });

    res.json({ message: '删除评论成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ error: '删除评论失败' });
  }
});

export default router;
