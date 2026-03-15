#!/bin/bash

# Railway 部署脚本
# 这个脚本在 Railway 部署时自动执行

set -e

echo "🚀 开始部署..."

# 进入 backend 目录
cd backend

# 安装依赖
echo "📦 安装依赖..."
npm install --legacy-peer-deps

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 构建项目
echo "🏗️  构建项目..."
npm run build

# 运行数据库迁移
echo "🗄️  运行数据库迁移..."
npx prisma migrate deploy --skip-generate

# 运行 seed（如果数据库为空）
echo "🌱 运行数据库 seed..."
npx tsx prisma/seed.ts || echo "Seed 已运行或跳过"

echo "✅ 部署完成!"
