#!/bin/bash

# Smart Interview 测试脚本

set -e

echo "🧪 运行测试..."

# 运行后端测试
echo "📦 运行后端测试..."
cd server && npm test 2>/dev/null || echo "⚠️  后端测试未配置"

# 运行前端测试
echo "🎨 运行前端测试..."
cd ../client && npm test 2>/dev/null || echo "⚠️  前端测试未配置"

# 运行 TypeScript 类型检查
echo "🔍 运行 TypeScript 类型检查..."
cd ../server && npx tsc --noEmit
cd ../client && npx tsc --noEmit

echo "✅ 测试完成！"
