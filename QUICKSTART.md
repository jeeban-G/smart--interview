# Smart Interview 快速开始指南

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/jeeban-G/smart--interview.git
cd smart--interview

# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，填入你的 MiniMax API Key

# 3. 运行启动脚本
bash scripts/start.sh
```

### 方式二：手动启动

```bash
# 1. 安装依赖
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，填入你的 MiniMax API Key

# 3. 启动后端服务
cd server
npm run dev

# 4. 新开终端，启动前端服务
cd client
npm run dev
```

### 方式三：使用 Docker

```bash
# 1. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，填入你的 MiniMax API Key

# 2. 启动服务
docker-compose up -d

# 3. 访问应用
# 前端：http://localhost:3000
# 后端：http://localhost:3001
```

## 访问应用

打开浏览器访问 **http://localhost:3000**

## 获取 API Key

1. 访问 https://platform.minimaxi.com/
2. 注册并登录
3. 在控制台获取 API Key
4. 将 API Key 填入 `server/.env` 文件的 `MINIMAX_API_KEY` 字段

## 常见问题

### Q: 启动失败怎么办？

A: 检查以下几点：
1. Node.js 版本是否 >= 18.0.0
2. 是否正确配置了环境变量
3. 端口 3000 和 3001 是否被占用

### Q: 如何重置数据库？

A: 删除 `server/interview.db` 文件并重启服务器

### Q: 如何切换 AI 提供商？

A: 编辑 `server/.env` 文件，修改 `AI_PROVIDER` 字段：
- `openclaw`：使用本地部署的 OpenClaw（默认）
- `minimax`：使用 MiniMax 云端 API

### Q: 如何查看日志？

A: 后端日志会输出到控制台，可以通过设置 `LOG_LEVEL` 环境变量调整日志级别：
- `debug`：调试信息
- `info`：一般信息（默认）
- `warn`：警告信息
- `error`：错误信息

## 下一步

1. 创建求职画像
2. 选择职位和 Agent
3. 开始面试
4. 查看评估报告

祝你面试顺利！🎉
