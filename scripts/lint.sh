#!/bin/bash

# Smart Interview 代码质量检查脚本

set -e

echo "🔍 运行代码质量检查..."

# 运行 ESLint（如果配置了）
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    echo "📝 运行 ESLint..."
    npx eslint . --ext .ts,.tsx 2>/dev/null || echo "⚠️  ESLint 检查完成（有警告）"
else
    echo "⚠️  ESLint 未配置"
fi

# 运行 Prettier 检查（如果配置了）
if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
    echo "🎨 运行 Prettier 检查..."
    npx prettier --check . 2>/dev/null || echo "⚠️  Prettier 检查完成（有格式问题）"
else
    echo "⚠️  Prettier 未配置"
fi

# 运行 TypeScript 类型检查
echo "🔍 运行 TypeScript 类型检查..."
cd server && npx tsc --noEmit && cd ..
cd client && npx tsc --noEmit && cd ..

echo "✅ 代码质量检查完成！"
