# Smart Interview 重构迁移指南

## 概述

本项目已完成从紧耦合到解耦架构的重构。新架构遵循**领域驱动设计 (DDD)** 和**依赖倒置原则 (DIP)**，实现了清晰的分层结构。

## 新旧架构对比

### 旧架构问题

```
┌─────────────────────────────────────────────────┐
│  Routes 直接调用 Service                         │
│  Service 直接调用 getDb()                        │
│  Service 之间直接 import                         │
│  AI 调用硬编码                                    │
└─────────────────────────────────────────────────┘
```

- 数据库操作散落在各个 service 中
- 无法切换数据库实现
- 无法切换 AI 提供商
- 单元测试困难（难以 mock 依赖）
- 服务间循环依赖风险

### 新架构优势

```
┌─────────────────────────────────────────────────┐
│  Presentation (Routes/Controllers)              │
├─────────────────────────────────────────────────┤
│  Application (Use Cases / Application Services) │
├─────────────────────────────────────────────────┤
│  Domain (Entities / Repository Interfaces)      │
├─────────────────────────────────────────────────┤
│  Infrastructure (Repository Implementations)    │
└─────────────────────────────────────────────────┘
```

- 每一层只依赖下层接口，不依赖具体实现
- 可以轻松切换数据库（SQLite -> PostgreSQL）
- 可以轻松切换 AI 提供商（MiniMax -> OpenAI）
- 便于单元测试（依赖注入 mock）
- 每个模块可以独立优化

## 文件结构变化

### 新增文件

```
server/src/
├── domain/                          # 领域层
│   ├── entities/                    # 实体定义（纯数据结构）
│   │   ├── interview.ts
│   │   ├── agent.ts
│   │   ├── message.ts
│   │   ├── evaluation.ts
│   │   └── user.ts
│   ├── repositories/                # 仓储接口
│   │   ├── interview.repository.ts
│   │   ├── agent.repository.ts
│   │   ├── message.repository.ts
│   │   ├── evaluation.repository.ts
│   │   └── user.repository.ts
│   └── services/                    # 服务接口
│       ├── ai-provider.ts
│       ├── event-bus.ts
│       └── logger.ts
├── application/                     # 应用层
│   ├── use-cases/                   # 用例（业务逻辑）
│   │   ├── interview/
│   │   │   ├── create-interview.ts
│   │   │   ├── get-interview.ts
│   │   │   └── complete-interview.ts
│   │   └── agent/
│   │       ├── create-agent.ts
│   │       ├── get-agent.ts
│   │       ├── update-agent.ts
│   │       └── delete-agent.ts
│   └── services/
│       └── interview-orchestrator.ts
├── infrastructure/                  # 基础设施层
│   ├── database/
│   │   ├── connection.ts
│   │   └── sqlite/
│   │       └── index.ts
│   ├── repositories/                # 仓储实现
│   │   ├── sqlite-interview.repository.ts
│   │   ├── sqlite-agent.repository.ts
│   │   ├── sqlite-message.repository.ts
│   │   ├── sqlite-evaluation.repository.ts
│   │   └── sqlite-user.repository.ts
│   ├── ai/
│   │   └── minimax-provider.ts      # AI 实现
│   ├── event/
│   │   └── event-bus.ts
│   └── logger/
│       └── console-logger.ts
├── presentation/                    # 表现层
│   ├── controllers/
│   │   ├── interview.controller.ts
│   │   └── agent.controller.ts
│   └── routes/
│       ├── interview.routes.ts
│       └── agent.routes.ts
├── container/                       # 依赖注入容器
│   ├── container.ts
│   └── tokens.ts
└── index-new.ts                     # 新的入口文件
```

## 如何使用新架构

### 1. 切换入口文件

将 `index.ts` 备份，然后将 `index-new.ts` 重命名为 `index.ts`：

```bash
cd server/src
mv index.ts index-old.ts
mv index-new.ts index.ts
```

### 2. 安装依赖（如果需要）

新架构没有新增外部依赖，保持原有依赖即可。

### 3. 启动应用

```bash
cd server
npm run dev
```

## 扩展指南

### 如何切换数据库（例如切换到 PostgreSQL）

1. **创建新的仓储实现**：
```typescript
// infrastructure/repositories/postgres-interview.repository.ts
import { IInterviewRepository } from '../../domain/repositories/interview.repository.js';

export class PostgresInterviewRepository implements IInterviewRepository {
  constructor(private db: PostgresConnection) {}

  async create(data: CreateInterviewInput): Promise<Interview> {
    // 使用 PostgreSQL 实现
  }
  // ... 其他方法
}
```

2. **更新容器配置**：
```typescript
// 在 index.ts 中
const interviewRepository = new PostgresInterviewRepository(pgConnection);
```

### 如何切换 AI 提供商（例如切换到 OpenAI）

1. **创建新的 AI 提供商**：
```typescript
// infrastructure/ai/openai-provider.ts
import { IAIProvider } from '../../domain/services/ai-provider.js';

export class OpenAIProvider implements IAIProvider {
  async generateResponse(input: GenerateResponseInput): Promise<AIResponse> {
    // 调用 OpenAI API
  }
  // ... 其他方法
}
```

2. **更新容器配置**：
```typescript
// 在 index.ts 中
const aiProvider = new OpenAIProvider();
```

### 如何添加新的用例

1. **在 domain 层定义实体和接口**（如果需要新实体）
2. **创建应用层用例**：
```typescript
// application/use-cases/interview/some-new-feature.ts
export class SomeNewFeatureUseCase {
  constructor(private container: IServiceContainer) {}

  async execute(request: SomeRequest): Promise<SomeResult> {
    // 业务逻辑
  }
}
```
3. **创建控制器方法**
4. **添加路由**

## 测试策略

### 单元测试示例

```typescript
// 测试用例
import { CreateInterviewUseCase } from './create-interview';

// Mock 依赖
const mockInterviewRepository = {
  create: jest.fn(),
  countActiveByUser: jest.fn().mockResolvedValue(0),
};

const mockAgentRepository = {
  findById: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
};

const container = {
  interviewRepository: mockInterviewRepository,
  agentRepository: mockAgentRepository,
};

const useCase = new CreateInterviewUseCase(container);

// 测试
const result = await useCase.execute({
  userId: 1,
  type: 'single',
  position: 'frontend',
});

expect(mockInterviewRepository.create).toHaveBeenCalled();
```

## 注意事项

1. **不要直接访问数据库**：始终通过仓储接口
2. **不要直接调用 AI API**：使用 IAIProvider 接口
3. **服务间通信使用 EventBus**：避免直接调用
4. **每个用例只处理一个业务场景**

## 回滚方案

如果需要回滚到旧版本：

```bash
cd server/src
mv index.ts index-new.ts
mv index-old.ts index.ts
```

然后重启服务器即可。

## 优势总结

| 特性 | 旧架构 | 新架构 |
|------|--------|--------|
| 数据库切换 | 困难 | 容易 |
| AI 提供商切换 | 困难 | 容易 |
| 单元测试 | 困难 | 容易 |
| 代码复用 | 低 | 高 |
| 维护成本 | 高 | 低 |
| 模块边界 | 模糊 | 清晰 |
