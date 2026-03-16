import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { colorizationQueue } from '../services/queue';
import { z } from 'zod';

const router = Router();

// 验证 Schema
const createArtworkSchema = z.object({
  title: z.string().min(1, '请输入作品标题').max(100, '标题最多 100 个字符'),
  description: z.string().max(500, '描述最多 500 个字符').optional(),
  tags: z.union([
    z.array(z.string()).max(10, '最多 10 个标签'),
    z.string(), // 允许前端发送的 JSON 字符串
  ]).optional(),
}).transform((data) => {
  // 如果是字符串，尝试解析为数组
  if (typeof data.tags === 'string') {
    try {
      data.tags = JSON.parse(data.tags);
    } catch {
      data.tags = [];
    }
  }
  return data;
});

/**
 * 获取作品列表（分页 + 筛选）
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const status = req.query.status as string;
    const tag = req.query.tag as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const order = req.query.order as string || 'desc';
    const isFeatured = req.query.isFeatured === 'true';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (isFeatured) {
      where.isFeatured = true;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [artworks, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
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
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              colorizedImage: true,
              status: true,
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
    console.error('获取作品列表失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: '获取作品列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
});

/**
 * 获取热门作品
 */
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const artworks = await prisma.artwork.findMany({
      where: { status: 'COMPLETED' },
      orderBy: [
        { views: 'desc' },
        { likes: 'desc' },
      ],
      take: limit,
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
      },
    });

    res.json({ data: artworks });
  } catch (error) {
    console.error('获取热门作品失败:', error);
    res.status(500).json({ error: '获取热门作品失败' });
  }
});

/**
 * 获取精选作品
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;

    const artworks = await prisma.artwork.findMany({
      where: {
        isFeatured: true,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
      },
    });

    res.json({ data: artworks });
  } catch (error) {
    console.error('获取精选作品失败:', error);
    res.status(500).json({ error: '获取精选作品失败' });
  }
});

/**
 * 获取作品详情
 */
router.get('/:id', async (req, res) => {
  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
          },
        },
        colorizations: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        collections: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!artwork) {
      return res.status(404).json({ error: '作品不存在' });
    }

    // 增加浏览量
    await prisma.artwork.update({
      where: { id: artwork.id },
      data: { views: { increment: 1 } },
    });

    res.json({ data: artwork });
  } catch (error) {
    console.error('获取作品详情失败:', error);
    res.status(500).json({ error: '获取作品详情失败' });
  }
});

/**
 * 上传作品（需要登录）
 */
router.post('/', authMiddleware, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    const body = createArtworkSchema.parse(req.body);

    const dateDir = req.file.destination.split('/').pop();
    const imageUrl = `/uploads/${dateDir}/${req.file.filename}`;

    // 创建作品记录
    const artwork = await prisma.artwork.create({
      data: {
        title: body.title,
        description: body.description,
        coverImage: imageUrl,
        originalImage: imageUrl,
        tags: body.tags || [],
        status: 'PENDING',
        userId: req.user!.id,
      },
    });

    // 创建上色任务
    const colorization = await prisma.colorization.create({
      data: {
        colorizedImage: '',
        status: 'PENDING',
        artworkId: artwork.id,
        userId: req.user!.id,
      },
    });

    // 添加到任务队列
    await colorizationQueue.add(
      {
        colorizationId: colorization.id,
        imageUrl,
      },
      {
        priority: 1,
      }
    );

    res.status(201).json({
      message: '作品上传成功，已开始处理',
      data: {
        artwork,
        colorization: {
          id: colorization.id,
          status: colorization.status,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('上传作品失败:', error);
    res.status(500).json({ error: '上传作品失败' });
  }
});

/**
 * 点赞作品
 */
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: req.params.id },
    });

    if (!artwork) {
      return res.status(404).json({ error: '作品不存在' });
    }

    await prisma.artwork.update({
      where: { id: artwork.id },
      data: { likes: { increment: 1 } },
    });

    res.json({ message: '点赞成功', likes: artwork.likes + 1 });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: '点赞失败' });
  }
});

/**
 * 获取用户上传的作品
 */
router.get('/user/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;

    const artworks = await prisma.artwork.findMany({
      where: { userId: req.user!.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        colorizations: {
          take: 1,
          select: { colorizedImage: true, status: true, progress: true },
        },
      },
    });

    const total = await prisma.artwork.count({
      where: { userId: req.user!.id },
    });

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
    console.error('获取我的作品失败:', error);
    res.status(500).json({ error: '获取我的作品失败' });
  }
});

export default router;
