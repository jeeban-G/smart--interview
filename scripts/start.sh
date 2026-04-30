#!/bin/bash

# Smart Interview 快速启动脚本

set -e

echo "🚀 启动 Smart Interview..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📥 安装客户端依赖..."
    cd client && npm install && cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "📥 安装服务端依赖..."
    cd server && npm install && cd ..
fi

# 检查环境变量
if [ ! -f "server/.env" ]; then
    echo "⚠️  警告: server/.env 文件不存在"
    echo "请复制 server/.env.example 到 server/.env 并配置环境变量"
    echo "cp server/.env.example server/.env"
    exit 1
fi

# 启动后端服务
echo "🔧 启动后端服务..."
cd server && npm run dev &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 启动前端服务
echo "🎨 启动前端服务..."
cd ../client && npm run dev &
CLIENT_PID=$!

echo "✅ 服务启动完成！"
echo "🌐 前端地址: http://localhost:3000"
echo "🔌 后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo '🛑 停止服务...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM

wait
