# AI 面试模拟平台

基于 React + Node.js 的 AI 面试模拟平台，支持单面和群面模拟。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express
- **数据库**: SQLite (sql.js)
- **LLM**: MiniMax M2.7 API

## 项目结构

```
ai-interview-platform/
├── client/                    # 前端项目
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API 服务
│   │   ├── types/            # TypeScript 类型
│   │   └── App.tsx
│   └── package.json
│
├── server/                    # 后端项目
│   ├── src/
│   │   ├── routes/          # 路由
│   │   ├── services/         # 业务服务
│   │   ├── middleware/       # 中间件
│   │   ├── db/              # 数据库
│   │   └── index.ts
│   └── package.json
│
└── README.md
```

## 快速开始

### 1. 配置环境变量

```bash
# server/.env
PORT=3001
JWT_SECRET=your-secret-key
MINIMAX_API_KEY=your-minimax-api-key
```

### 2. 启动后端

```bash
cd server
npm install
npm run dev
```

### 3. 启动前端

```bash
cd client
npm install
npm run dev
```

### 4. 访问

打开浏览器访问 http://localhost:3000

## 功能

- 用户注册/登录
- 创建单面或群面模拟
- 与 AI 面试官实时对话
- 面试结束后生成评估报告
- 查看面试历史记录

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 面试
- `GET /api/interview/positions` - 获取职位列表
- `POST /api/interview/create` - 创建面试
- `GET /api/interview/:id` - 获取面试详情
- `GET /api/interview/history` - 获取面试历史
- `POST /api/interview/:id/message` - 发送消息
- `GET /api/interview/:id/messages` - 获取消息列表
- `POST /api/interview/:id/complete` - 结束面试
- `GET /api/interview/:id/eval` - 获取评估报告
