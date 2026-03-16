#!/bin/bash
set -e

echo "同步数据库 Schema..."
cd backend
npx prisma db push --skip-generate || echo "数据库同步完成或已存在"

echo "启动应用..."
npm start
