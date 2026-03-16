#!/bin/bash
set -e

echo "等待数据库就绪..."
max_attempts=30
attempt=0

# 从 DATABASE_URL 解析连接信息
if [ -n "$DATABASE_URL" ]; then
  # postgres://user:pass@host:port/db
  DB_HOST=$(echo $DATABASE_URL | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1|')
  DB_PORT=$(echo $DATABASE_URL | sed -E 's|.*@([^:]+):([0-9]+)/.*|\2|')
  DB_USER=$(echo $DATABASE_URL | sed -E 's|postgres://([^:]+):.*|\1|')
  DB_PASS=$(echo $DATABASE_URL | sed -E 's|postgres://[^:]+:(.*)@.*|\1|')
  DB_NAME=$(echo $DATABASE_URL | sed -E 's|.*/([^?]+).*|\1|')
fi

while [ $attempt -lt $max_attempts ]; do
  if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo "数据库已就绪"
    break
  fi
  attempt=$((attempt + 1))
  echo "等待数据库启动... ($attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "数据库连接超时"
  exit 1
fi

echo "同步数据库 Schema..."
cd backend
npx prisma db push --skip-generate

echo "启动应用..."
npm start
