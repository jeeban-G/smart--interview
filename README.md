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

### 系统架构图

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
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  表现层 (Presentation)                               │   │
│  │  - Controllers (HTTP 请求处理)                       │   │
│  │  - Routes (API 路由定义)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  应用层 (Application)                                │   │
│  │  - Use Cases (业务用例)                              │   │
│  │  - InterviewOrchestrator (面试流程编排)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  领域层 (Domain)                                     │   │
│  │  - Entities (实体定义)                               │   │
│  │  - Repository Interfaces (仓储接口)                  │   │
│  │  - Service Interfaces (服务接口)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  基础设施层 (Infrastructure)                         │   │
│  │  - SQLite Repositories (仓储实现)                    │   │
│  │  - MiniMax Provider (AI 实现)                        │   │
│  │  - EventBus (事件总线)                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 架构特点

- **分层架构**：表现层 → 应用层 → 领域层 → 基础设施层
- **依赖倒置**：高层模块依赖抽象接口，不依赖具体实现
- **依赖注入**：通过容器管理依赖，便于测试和替换
- **事件驱动**：服务间通过 EventBus 通信，解耦模块

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
│   │   ├── domain/                  # 领域层
│   │   │   ├── entities/            # 实体定义
│   │   │   │   ├── interview.ts     # 面试实体
│   │   │   │   ├── agent.ts         # Agent 实体
│   │   │   │   ├── message.ts       # 消息实体
│   │   │   │   ├── evaluation.ts    # 评估实体
│   │   │   │   └── user.ts          # 用户实体
│   │   │   ├── repositories/        # 仓储接口
│   │   │   │   ├── interview.repository.ts
│   │   │   │   ├── agent.repository.ts
│   │   │   │   ├── message.repository.ts
│   │   │   │   ├── evaluation.repository.ts
│   │   │   │   └── user.repository.ts
│   │   │   └── services/            # 服务接口
│   │   │       ├── ai-provider.ts   # AI 提供商接口
│   │   │       └── event-bus.ts     # 事件总线接口
│   │   │
│   │   ├── application/             # 应用层
│   │   │   ├── use-cases/           # 业务用例
│   │   │   │   ├── interview/
│   │   │   │   │   ├── create-interview.ts
│   │   │   │   │   ├── get-interview.ts
│   │   │   │   │   ├── complete-interview.ts
│   │   │   │   │   ├── send-message.ts
│   │   │   │   │   ├── get-messages.ts
│   │   │   │   │   ├── delete-interview.ts
│   │   │   │   │   └── get-evaluation.ts
│   │   │   │   └── agent/
│   │   │   │       ├── create-agent.ts
│   │   │   │       ├── get-agent.ts
│   │   │   │       ├── update-agent.ts
│   │   │   │       └── delete-agent.ts
│   │   │   └── services/            # 应用服务
│   │   │       └── interview-orchestrator.ts  # 面试流程编排
│   │   │
│   │   ├── infrastructure/          # 基础设施层
│   │   │   ├── database/            # 数据库
│   │   │   │   ├── connection.ts    # 数据库连接接口
│   │   │   │   └── sqlite/          # SQLite 实现
│   │   │   │       └── index.ts
│   │   │   ├── repositories/        # 仓储实现
│   │   │   │   ├── sqlite-interview.repository.ts
│   │   │   │   ├── sqlite-agent.repository.ts
│   │   │   │   ├── sqlite-message.repository.ts
│   │   │   │   ├── sqlite-evaluation.repository.ts
│   │   │   │   └── sqlite-user.repository.ts
│   │   │   ├── ai/                  # AI 实现
│   │   │   │   └── minimax-provider.ts
│   │   │   └── event/               # 事件总线实现
│   │   │       └── event-bus.ts
│   │   │
│   │   ├── presentation/            # 表现层
│   │   │   ├── controllers/         # 控制器
│   │   │   │   ├── interview.controller.ts
│   │   │   │   └── agent.controller.ts
│   │   │   └── routes/              # 路由
│   │   │       ├── interview.routes.ts
│   │   │       └── agent.routes.ts
│   │   │
│   │   ├── container/               # 依赖注入容器
│   │   │   └── container.ts
│   │   │
│   │   ├── services/                # 旧服务（兼容层）
│   │   │   ├── user.service.ts
│   │   │   ├── profile.service.ts
│   │   │   └── auth.middleware.ts
│   │   │
│   │   ├── db/                      # 数据库桥接
│   │   │   └── index.ts
│   │   │
│   │   ├── routes/                  # 旧路由（兼容层）
│   │   │   ├── auth.ts
│   │   │   └── profile.ts
│   │   │
│   │   └── index.ts                 # 服务器入口
│   │
│   ├── package.json
│   └── .env                         # 环境变量
│
├── docs/                            # 文档
│   └── superpowers/
│       └── plans/                   # 实施计划
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

### 架构原则

本项目采用**分层架构**设计，遵循以下原则：

1. **依赖倒置原则**：高层模块（表现层、应用层）依赖抽象接口（领域层），不依赖具体实现
2. **单一职责**：每个文件只负责一个明确的功能
3. **接口隔离**：通过接口定义契约，实现细节由基础设施层提供
4. **依赖注入**：使用容器统一管理依赖关系，便于测试和替换

### 添加新的 API 端点

#### 1. 定义领域接口

在 `server/src/domain/repositories/` 中添加仓储接口方法：

```typescript
// domain/repositories/interview.repository.ts
export interface IInterviewRepository {
  // 现有方法...
  newMethod(id: number): Promise<SomeResult>;
}
```

#### 2. 实现仓储方法

在 `server/src/infrastructure/repositories/` 中实现接口：

```typescript
// infrastructure/repositories/sqlite-interview.repository.ts
async newMethod(id: number): Promise<SomeResult> {
  // SQLite 实现
}
```

#### 3. 创建用例

在 `server/src/application/use-cases/` 中添加业务逻辑：

```typescript
// application/use-cases/interview/new-use-case.ts
export class NewUseCase {
  constructor(private interviewRepository: IInterviewRepository) {}

  async execute(id: number): Promise<SomeResult> {
    return this.interviewRepository.newMethod(id);
  }
}
```

#### 4. 添加控制器方法

在 `server/src/presentation/controllers/` 中添加 HTTP 处理：

```typescript
// presentation/controllers/interview.controller.ts
async newMethod(req: Request, res: Response) {
  const result = await this.newUseCase.execute(req.params.id);
  res.json(result);
}
```

#### 5. 注册路由

在 `server/src/presentation/routes/` 中添加路由：

```typescript
// presentation/routes/interview.routes.ts
router.post('/:id/new', interviewController.newMethod.bind(interviewController));
```

### 切换 AI 提供商

项目支持通过接口切换不同的 AI 提供商：

1. **创建新的 Provider**（以 OpenAI 为例）：

```typescript
// infrastructure/ai/openai-provider.ts
export class OpenAIProvider implements IAIProvider {
  async generateResponse(messages: Message[]): Promise<string> {
    // 调用 OpenAI API
  }
}
```

2. **修改容器配置**：

```typescript
// container/container.ts
import { OpenAIProvider } from '../infrastructure/ai/openai-provider.js';

// 替换 MiniMaxProvider
const aiProvider: IAIProvider = new OpenAIProvider(apiKey);
```

### 切换数据库

项目使用仓储模式，可以轻松切换数据库：

1. **创建新的 Repository 实现**：

```typescript
// infrastructure/repositories/postgres-interview.repository.ts
export class PostgresInterviewRepository implements IInterviewRepository {
  // PostgreSQL 实现
}
```

2. **修改容器配置**：

```typescript
// container/container.ts
const interviewRepository: IInterviewRepository = new PostgresInterviewRepository(pool);
```

### 添加新的组件

1. 在 `client/src/components/` 中创建新的组件文件
2. 在对应的页面中导入使用

### 数据库迁移

当前使用 sql.js (SQLite in-memory)，数据库文件保存在 `server/interview.db`。

如需重置数据库，删除 `server/interview.db` 并重启服务器。

#### 添加新的表

编辑 `server/src/infrastructure/database/sqlite/index.ts` 中的 `initialize()` 方法：

```typescript
// 在 initDatabase() 函数中添加
this.db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
`);
```

## 架构优势

### 解耦带来的好处

| 场景 | 传统架构 | 新架构 |
|------|----------|--------|
| 更换 AI 提供商 | 需要修改多处代码 | 只需实现 IAIProvider 接口 |
| 更换数据库 | 需要重写所有 SQL | 只需实现 Repository 接口 |
| 单元测试 | 难以模拟依赖 | 通过接口轻松 Mock |
| 添加新功能 | 可能破坏现有代码 | 独立开发，不影响其他模块 |

### 可扩展性

- **水平扩展**：可以独立扩展 AI 服务、数据库或缓存层
- **垂直扩展**：每个模块可以单独优化性能
- **功能扩展**：新功能通过添加用例实现，不影响现有代码

## 环境变量

| 变量 | 必需 | 描述 |
|------|------|------|
| `PORT` | 否 | 服务器端口，默认 3001 |
| `MINIMAX_API_KEY` | 是 | MiniMax API 密钥 |

## License

MIT License
