import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 验证 Schema
const registerSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  username: z.string().min(3, '用户名至少 3 个字符').max(20, '用户名最多 20 个字符'),
  password: z.string().min(6, '密码至少 6 个字符'),
});

const loginSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

const updateProfileSchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符').max(20, '用户名最多 20 个字符').optional(),
  bio: z.string().max(200, '简介最多 200 个字符').optional(),
  avatar: z.string().url('无效的头像 URL').optional(),
});

/**
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { username: body.username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === body.email
          ? '该邮箱已被注册'
          : '该用户名已被使用',
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        password: hashedPassword,
      },
    });

    // 生成 JWT
    const token = generateToken(user);

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('注册失败:', error);
    return res.status(500).json({ error: '注册失败，请稍后再试' });
  }
});

/**
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(body.password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成 JWT
    const token = generateToken(user);

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('登录失败:', error);
    return res.status(500).json({ error: '登录失败，请稍后再试' });
  }
});

/**
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      avatar: true,
      bio: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          artworks: true,
          collections: true,
        },
      },
    },
  });

  res.json({ user });
});

/**
 * 更新用户资料
 */
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const body = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: body,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
      },
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('更新资料失败:', error);
    return res.status(500).json({ error: '更新资料失败，请稍后再试' });
  }
});

/**
 * 修改密码
 */
router.put('/password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1, '请输入当前密码'),
      newPassword: z.string().min(6, '新密码至少 6 个字符'),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ error: '当前密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('修改密码失败:', error);
    return res.status(500).json({ error: '修改密码失败，请稍后再试' });
  }
});

// 生成 JWT 的辅助函数
function generateToken(user: { id: string; email: string; username: string; role: string }) {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    secret,
    { expiresIn: expiresIn as any }
  );
}

export default router;
