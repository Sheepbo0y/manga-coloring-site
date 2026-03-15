import { Response, Request, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[错误处理] ${req.method} ${req.path}:`, err);

  // Prisma 错误处理
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  // 操作错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // 未知错误
  console.error('未处理的错误:', err);

  return res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

// 处理 Prisma 特定错误
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response) {
  console.error('Prisma 错误:', err.code, err.message);

  switch (err.code) {
    case 'P2002': // 唯一约束违反
      return res.status(409).json({
        error: '数据已存在',
        code: 'UNIQUE_CONSTRAINT',
      });
    case 'P2025': // 记录未找到
      return res.status(404).json({
        error: '记录不存在',
        code: 'NOT_FOUND',
      });
    case 'P2003': // 外键约束失败
      return res.status(400).json({
        error: '关联的数据不存在',
        code: 'FOREIGN_KEY_ERROR',
      });
    case 'P2004': // 约束违反
      return res.status(400).json({
        error: '数据验证失败',
        code: 'CONSTRAINT_ERROR',
      });
    default:
      return res.status(500).json({
        error: '数据库错误',
        code: 'DATABASE_ERROR',
      });
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: `找不到资源：${req.method} ${req.path}`,
  });
};

// 异步处理器包装器（用于包装 async 路由处理器）
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
