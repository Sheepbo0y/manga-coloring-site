import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { addColorizationJob } from '../services/queue';
import { colorizeImage, isConfigured as isSeedreamConfigured } from '../services/seedream';
import { z } from 'zod';

const router = Router();

// 验证 Schema
const createArtworkSchema = z.object({
  title: z.string().min(1, '请输入作品标题').max(100, '标题最多 100 个字符'),
  description: z.string().max(500, '描述最多 500 个字符').optional(),
  tags: z.union([
    z.array(z.string()).max(10, '最多 10 个标签'),
    z.string(),
  ]).optional(),
}).transform((data): { title: string; description?: string; tags: string[] } => {
  let tags: string[] = [];
  if (typeof data.tags === 'string') {
    try {
      tags = JSON.parse(data.tags);
    } catch {
      tags = [];
    }
  } else if (Array.isArray(data.tags)) {
    tags = data.tags;
  }
  return {
    title: data.title,
    description: data.description,
    tags,
  };
});

type CreateArtworkInput = z.infer<typeof createArtworkSchema>;

/**
 * 获取作品列表（分页 + 筛选）
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const status = req.query.status as string;
    const tag = req.query.tag as string;
    const tags = req.query.tags as string; // 多个标签，逗号分隔
    const sortBy = req.query.sortBy as string || 'createdAt';
    const order = req.query.order as string || 'desc';
    const isFeatured = req.query.isFeatured === 'true';
    const search = req.query.search as string; // 搜索关键词
    const userId = req.query.userId as string; // 按用户筛选
    const dateFrom = req.query.dateFrom as string; // 起始日期
    const dateTo = req.query.dateTo as string; // 结束日期

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

    // 多标签筛选
    if (tags) {
      const tagList = tags.split(',').filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { hasEvery: tagList };
      }
    }

    // 搜索关键词（标题或描述）
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 按用户筛选
    if (userId) {
      where.userId = userId;
    }

    // 日期范围筛选
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, string>).gte = dateFrom;
      }
      if (dateTo) {
        (where.createdAt as Record<string, string>).lte = dateTo;
      }
    }

    // 排序字段白名单
    const allowedSortFields = ['createdAt', 'views', 'likes', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [artworks, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
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

    // 检查用户剩余次数
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { freeCredits: true, username: true },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (user.freeCredits <= 0) {
      return res.status(403).json({
        error: '免费次数已用完',
        message: '明天配置 Seedream API Key 后可充值',
      });
    }

    const body = createArtworkSchema.parse(req.body);

    // 处理图片 URL：Cloudinary 返回完整 URL，本地存储返回相对路径
    let imageUrl: string;
    if (req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary 返回的完整 URL
      imageUrl = req.file.path;
    } else {
      // 本地存储的相对路径
      const dateDir = req.file.destination?.split('/').pop() || new Date().toISOString().split('T')[0];
      imageUrl = `/uploads/${dateDir}/${req.file.filename}`;
    }

    // 使用事务：扣除次数、创建作品记录、创建上色任务
    const result = await prisma.$transaction(async (tx) => {
      // 扣除 1 次次数
      const newBalance = user.freeCredits - 1;
      await tx.user.update({
        where: { id: req.user!.id },
        data: { freeCredits: newBalance },
      });

      // 记录次数变动
      await tx.creditLog.create({
        data: {
          userId: req.user!.id,
          amount: -1,
          balance: newBalance,
          reason: '调用上色 API',
        },
      });

      // 创建作品记录
      const artwork = await tx.artwork.create({
        data: {
          title: body.title,
          description: body.description,
          coverImage: imageUrl,
          originalImage: imageUrl,
          tags: (body.tags as string[]) || [],
          status: 'PENDING',
          userId: req.user!.id,
        },
      });

      // 创建上色任务
      const colorization = await tx.colorization.create({
        data: {
          colorizedImage: '',
          status: 'PENDING',
          artworkId: artwork.id,
          userId: req.user!.id,
        },
      });

      return { artwork, colorization, newBalance };
    });

    const { artwork, colorization, newBalance } = result;

    // 添加到任务队列（如果队列可用）
    const job = await addColorizationJob(colorization.id, imageUrl);
    
    // 如果队列不可用，直接同步处理
    if (!job) {
      console.log('队列不可用，直接同步处理上色任务');
      // 异步处理，不阻塞响应
      processColorization(colorization.id, imageUrl).catch(err => {
        console.error('同步处理上色失败:', err);
      });
    }

    res.status(201).json({
      message: '作品上传成功，已开始处理',
      data: {
        artwork,
        colorization: {
          id: colorization.id,
          status: colorization.status,
        },
        remainingCredits: newBalance,
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

// 同步处理上色任务（当队列不可用时）
async function processColorization(colorizationId: string, imageUrl: string) {
  const startTime = Date.now();
  
  try {
    // 检查 Seedream 是否配置
    if (!isSeedreamConfigured()) {
      throw new Error('Seedream API 未配置');
    }

    await prisma.colorization.update({
      where: { id: colorizationId },
      data: { status: 'RUNNING', progress: 10 },
    });

    await prisma.colorization.update({
      where: { id: colorizationId },
      data: { progress: 30 },
    });

    // 调用 Seedream API 生成彩色图片
    const resultUrl = await colorizeImage(imageUrl);

    await prisma.colorization.update({
      where: { id: colorizationId },
      data: { progress: 90 },
    });

    const processingTime = Date.now() - startTime;

    await prisma.colorization.update({
      where: { id: colorizationId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        colorizedImage: resultUrl,
        processingTime,
      },
    });

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

    console.log(`✅ 上色完成: ${colorizationId}, 耗时: ${processingTime}ms`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    await prisma.colorization.update({
      where: { id: colorizationId },
      data: {
        status: 'FAILED',
        errorMessage,
      },
    });

    console.error(`❌ 上色失败: ${colorizationId}, 错误: ${errorMessage}`);
  }
}

export default router;
