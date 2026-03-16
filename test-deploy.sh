#!/bin/bash
# 本地测试 Railway 部署的脚本

set -e

echo "🔍 测试部署配置..."

cd backend

# 1. 检查必要文件
echo "1️⃣  检查必要文件..."
[ -f "package.json" ] && echo "✅ package.json 存在" || (echo "❌ package.json 缺失" && exit 1)
[ -f "prisma/schema.prisma" ] && echo "✅ prisma/schema.prisma 存在" || (echo "❌ prisma/schema.prisma 缺失" && exit 1)
[ -d "prisma/migrations" ] && echo "✅ prisma/migrations 目录存在" || (echo "❌ prisma/migrations 目录缺失" && exit 1)
[ -f "src/index.ts" ] && echo "✅ src/index.ts 存在" || (echo "❌ src/index.ts 缺失" && exit 1)

# 2. 安装依赖
echo "2️⃣  安装依赖..."
npm install --legacy-peer-deps

# 3. 生成 Prisma 客户端
echo "3️⃣  生成 Prisma 客户端..."
npx prisma generate

# 4. 构建项目
echo "4️⃣  构建项目..."
npm run build

# 5. 检查构建输出
echo "5️⃣  检查构建输出..."
[ -f "dist/index.js" ] && echo "✅ dist/index.js 存在" || (echo "❌ dist/index.js 缺失" && exit 1)
[ -d "node_modules/.prisma" ] && echo "✅ node_modules/.prisma 目录存在" || (echo "❌ node_modules/.prisma 目录缺失" && exit 1)

echo ""
echo "✅ 所有测试通过！部署配置正确。"
echo ""
echo "📋 下一步："
echo "   1. 提交更改：git add . && git commit -m 'fix: 修复 Railway 部署配置'"
echo "   2. 推送到 GitHub: git push"
echo "   3. Railway 会自动重新部署"
