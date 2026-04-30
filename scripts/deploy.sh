#!/bin/bash

# Smart Interview 部署脚本

set -e

echo "🚀 开始部署 Smart Interview..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v)
echo "📦 Node.js 版本: $NODE_VERSION"

# 检查 npm 版本
NPM_VERSION=$(npm -v)
echo "📦 npm 版本: $NPM_VERSION"

# 安装依赖
echo "📥 安装依赖..."
npm install

# 安装客户端依赖
echo "📥 安装客户端依赖..."
cd client && npm install && cd ..

# 安装服务端依赖
echo "📥 安装服务端依赖..."
cd server && npm install && cd ..

# 构建客户端
echo "🔨 构建客户端..."
cd client && npm run build && cd ..

# 构建服务端
echo "🔨 构建服务端..."
cd server && npm run build && cd ..

# 检查环境变量
echo "🔍 检查环境变量..."
if [ ! -f "server/.env" ]; then
    echo "⚠️  警告: server/.env 文件不存在"
    echo "请复制 server/.env.example 到 server/.env 并配置环境变量"
    exit 1
fi

# 启动服务
echo "🚀 启动服务..."
cd server && npm start &

echo "✅ 部署完成！"
echo "🌐 访问地址: http://localhost:3001"
echo "📱 前端地址: http://localhost:3000"
