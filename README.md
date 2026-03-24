# AI 面试模拟平台 (Smart Interview)

一个基于 AI Agent 的自动化面试模拟平台，支持 A2A（Agent-to-Agent）面试对话、实时反馈、面试评估报告等功能。

## 功能特性

### 核心功能

- **AI Agent 面试**：两个 AI Agent（面试官 + 求职者）自动进行面试对话
- **实时对话**：通过 Server-Sent Events (SSE) 实现实时消息推送
- **面试控制**：支持开始、暂停、继续面试
- **实时反馈**：面试过程中提供实时 coaching 反馈
- **评估报告**：面试结束后自动生成详细的评估报告
- **雷达图可视化**：多维度能力评估图表展示

### 界面特色

- **漫画风格 UI**：日漫风格的动漫人物形象
- **对话气泡**：漫画式对话气泡，带有速度线等装饰
- **角色动画**：打字时角色有动画效果

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端 (Browser)                        │
│  React 18 + TypeScript + Vite + Three.js (漫画人物)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / SSE
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      服务器 (Node.js)                         │
│  Express + TypeScript + sql.js (SQLite)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Interview    │  │ Agent       │  │ Coaching     │       │
│  │ Service      │  │ Service     │  │ Service     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │              MiniMax M2.7 API                    │       │
│  │         (AI 对话生成 / 评估报告生成)              │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 前端技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| React Router | 路由管理 |
| Three.js | 3D 漫画人物渲染 |
| Canvas 2D | 2D 漫画人物绘制 |

### 后端技术栈

| 技术 | 用途 |
|------|------|
| Express | Web 框架 |
| TypeScript | 类型安全 |
| sql.js | SQLite 内存数据库 |
| Server-Sent Events | 实时消息推送 |
| EventEmitter | 服务内部事件 |
| MiniMax API | AI 对话生成 |

## 项目结构

```
smart--interview/
├── client/                          # 前端项目
│   ├── src/
│   │   ├── components/              # React 组件
│   │   │   ├── AgentModal.tsx       # Agent 创建/编辑弹窗
│   │   │   ├── CoachInput.tsx       # Coach 模式输入框
│   │   │   ├── EvaluationReport.tsx  # 评估报告组件
│   │   │   ├── FeedbackPanel.tsx     # 实时反馈面板
│   │   │   ├── MangaCharacter.tsx    # 漫画风格人物（Canvas）
│   │   │   ├── MessageInput.tsx      # 消息输入框
│   │   │   ├── MessageList.tsx       # 普通消息列表
│   │   │   ├── MessageListManga.tsx  # 漫画风格消息列表
│   │   │   ├── RadarChart.tsx        # 雷达图组件
│   │   │   └── ScoreBar.tsx          # 评分条组件
│   │   ├── pages/
│   │   │   ├── Home.tsx              # 首页（创建面试）
│   │   │   ├── Interview.tsx          # 面试房间页面
│   │   │   └── ProfileCreate.tsx      # 简历创建页面
│   │   ├── services/
│   │   │   └── api.ts                # API 调用服务
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript 类型定义
│   │   ├── App.tsx                   # 根组件
│   │   └── main.tsx                  # 入口文件
│   ├── package.json
│   └── vite.config.ts
│
├── server/                          # 后端项目
│   ├── src/
│   │   ├── routes/                  # 路由
│   │   │   ├── agent.ts             # Agent 相关路由
│   │   │   ├── auth.ts              # 认证路由
│   │   │   ├── interview.ts          # 面试相关路由
│   │   │   └── profile.ts            # 简历相关路由
│   │   ├── services/                 # 业务逻辑
│   │   │   ├── agent.service.ts      # Agent 服务
│   │   │   ├── coaching.service.ts   # Coaching 服务
│   │   │   └── interview.service.ts  # 面试核心服务
│   │   ├── db/
│   │   │   └── index.ts              # 数据库初始化
│   │   └── index.ts                   # 服务器入口
│   ├── package.json
│   └── .env                          # 环境变量
│
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. 克隆项目

```bash
git clone https://github.com/jeeban-G/smart--interview.git
cd smart--interview
```

### 2. 配置环境变量

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`，填入你的 MiniMax API Key：

```env
MINIMAX_API_KEY=your_minimax_api_key_here
```

> 获取 API Key: https://platform.minimaxi.com/

### 2. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 3. 启动服务

```bash
# 终端 1: 启动后端
cd server
npm run dev

# 终端 2: 启动前端
cd client
npm run dev
```

### 4. 访问应用

打开浏览器访问 **http://localhost:3000**

## 使用指南

### 创建面试

1. 在首页选择 **AI 面试** 模式
2. 选择目标职位（显示各大公司职位列表）
3. 选择 **面试官 Agent** 和 **求职者 Agent**（可选）
4. 点击开始面试

### 面试控制

| 按钮 | 功能 |
|------|------|
| 开始面试 | 启动 AI Agent 之间的对话 |
| 暂停面试 | 暂停对话，可以随时继续 |
| 继续面试 | 恢复暂停的对话 |

### 查看评估报告

面试结束后，自动显示评估报告，包括：

- **总体评价**：对候选人整体表现的评价
- **亮点时刻**：回答得最好的 2-3 个时刻
- **优点**：面试中展现的优点
- **不足**：面试中暴露的不足
- **改进建议**：针对不足的具体改进建议
- **雷达图**：多维度能力可视化展示

### Coach 模式

在面试过程中，你可以：

- 实时查看面试对话
- 提供 coaching 建议（系统会自动判断是否采纳）
- 查看采纳/拒绝的 coaching 反馈

## API 文档

### 认证 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |

### 面试 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/interview/positions` | 获取职位列表 |
| GET | `/api/interview/rooms` | 获取房间状态 |
| POST | `/api/interview/create` | 创建面试 |
| GET | `/api/interview/history` | 获取面试历史 |
| GET | `/api/interview/:id` | 获取面试详情 |
| GET | `/api/interview/:id/events` | SSE 事件流 |
| POST | `/api/interview/:id/message` | 发送消息 |
| GET | `/api/interview/:id/messages` | 获取消息列表 |
| POST | `/api/interview/:id/start` | 开始面试 |
| POST | `/api/interview/:id/pause` | 暂停面试 |
| POST | `/api/interview/:id/resume` | 继续面试 |
| POST | `/api/interview/:id/complete` | 结束面试 |
| GET | `/api/interview/:id/eval` | 获取评估报告 |

### Agent API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/agents` | 获取所有 Agent |
| GET | `/api/agents/:id` | 获取单个 Agent |
| POST | `/api/agents` | 创建 Agent |
| PUT | `/api/agents/:id` | 更新 Agent |
| DELETE | `/api/agents/:id` | 删除 Agent |

## 数据库表结构

### interviews 表
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户 ID |
| room_code | TEXT | 房间代码 |
| type | TEXT | 面试类型 (single/group) |
| position | TEXT | 职位 |
| question | TEXT | 当前问题 |
| status | TEXT | 状态 (pending/in_progress/completed) |
| duration | INTEGER | 面试时长(秒) |
| candidate_agent_id | INTEGER | 求职者 Agent ID |
| interviewer_agent_id | INTEGER | 面试官 Agent ID |

### messages 表
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键 |
| interview_id | INTEGER | 面试 ID |
| sender_type | TEXT | 发送者类型 |
| sender_name | TEXT | 发送者名称 |
| content | TEXT | 消息内容 |
| timestamp | DATETIME | 时间戳 |

### agents 表
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户 ID |
| name | TEXT | Agent 名称 |
| type | TEXT | 类型 (candidate/interviewer) |
| education | TEXT | 教育背景 |
| experience | TEXT | 工作经验 |
| skills | TEXT | 技能 |
| projects | TEXT | 项目经验 |
| personality | TEXT | 个性描述 |
| style | TEXT | 面试风格 |
| specialties | TEXT | 专业领域 |
| company | TEXT | 所属公司 |

### evaluations 表
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键 |
| interview_id | INTEGER | 面试 ID |
| summary | TEXT | 总体评价 |
| highlights | TEXT | 亮点时刻 (JSON) |
| pros | TEXT | 优点 (JSON) |
| cons | TEXT | 不足 (JSON) |
| suggestions | TEXT | 建议 (JSON) |
| overall_score | INTEGER | 总分 |
| technical_depth | INTEGER | 技术深度 |
| communication | INTEGER | 沟通能力 |
| project_experience | INTEGER | 项目经验 |
| adaptability | INTEGER | 适应能力 |

## SSE 事件

客户端连接到 `/api/interview/:id/events` 可以接收以下事件：

| 事件类型 | 描述 | 数据结构 |
|----------|------|----------|
| `message` | 新消息 | `{ type: 'message', message: Message, agent: string }` |
| `typing` | 打字中 | `{ type: 'typing', agent: string }` |
| `done` | 面试结束 | `{ type: 'done', interviewId: number, evaluation?: Evaluation }` |
| `paused` | 面试暂停 | `{ type: 'paused', interviewId: number }` |
| `resumed` | 面试继续 | `{ type: 'resumed', interviewId: number }` |
| `feedback` | 实时反馈 | `{ type: 'feedback', round: number, content: string }` |
| `coaching_accepted` | Coaching 被采纳 | `{ type: 'coaching_accepted', original, applied }` |
| `coaching_rejected` | Coaching 被拒绝 | `{ type: 'coaching_rejected', original, reason }` |

## 开发说明

### 添加新的 API 端点

1. 在 `server/src/routes/` 中找到对应的路由文件
2. 添加新的路由处理函数
3. 在对应的 service 文件中添加业务逻辑

### 添加新的组件

1. 在 `client/src/components/` 中创建新的组件文件
2. 在对应的页面中导入使用

### 数据库迁移

当前使用 sql.js (SQLite in-memory)，数据库文件保存在 `server/interview.db`。

如需重置数据库，删除 `server/interview.db` 并重启服务器。

## 环境变量

| 变量 | 必需 | 描述 |
|------|------|------|
| `PORT` | 否 | 服务器端口，默认 3001 |
| `MINIMAX_API_KEY` | 是 | MiniMax API 密钥 |

## License

MIT License
