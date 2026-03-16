#!/bin/bash

# 漫画上色网站迭代脚本
# 每2小时执行一次，检查进度并规划下一次迭代

PROJECT_DIR="$HOME/projects/manga-coloring-site"
ITERATION_LOG="$PROJECT_DIR/iteration.log"

cd "$PROJECT_DIR" || exit 1

echo "========================================" >> "$ITERATION_LOG"
echo "迭代检查: $(date '+%Y-%m-%d %H:%M:%S')" >> "$ITERATION_LOG"
echo "========================================" >> "$ITERATION_LOG"

# 检查是否有正在进行的迭代
if pgrep -f "claude.*manga-coloring-site" > /dev/null; then
    echo "⚠️  发现正在进行的 Claude Code 会话，跳过本次调度" >> "$ITERATION_LOG"
    exit 0
fi

# 检查 git 状态
GIT_STATUS=$(git status --porcelain 2>/dev/null)
if [ -n "$GIT_STATUS" ]; then
    echo "📦 发现未提交的更改" >> "$ITERATION_LOG"
    echo "$GIT_STATUS" >> "$ITERATION_LOG"
    
    # 自动提交
    git add .
    git commit -m "迭代更新: $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    echo "✅ 已自动提交并推送到 GitHub" >> "$ITERATION_LOG"
fi

# 读取当前迭代计划
CURRENT_ITERATION=$(grep -A 10 "第[0-9]*次迭代" ITERATION_PLAN.md | head -20)
echo "当前迭代:" >> "$ITERATION_LOG"
echo "$CURRENT_ITERATION" >> "$ITERATION_LOG"

echo "✅ 迭代检查完成" >> "$ITERATION_LOG"
echo "" >> "$ITERATION_LOG"

# 注意：实际的迭代任务由编程助手手动触发
# 此脚本仅用于记录和自动提交
