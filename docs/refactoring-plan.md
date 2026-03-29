# Smart Interview 解耦重构方案

## 当前问题分析

### 1. 耦合点识别

| 问题 | 位置 | 影响 |
|------|------|------|
| 数据库直接访问 | 所有 service 直接调用 `getDb()` | 无法切换数据库，难以测试 |
| 服务间硬编码依赖 | `interview.service.ts` 直接导入其他 service | 循环依赖风险，难以 mock |
| AI 服务硬编码 | 直接调用 `callMiniMaxAPI()` | 无法切换 AI 提供商 |
| 事件系统耦合 | 直接使用 EventEmitter | 事件名散落，难以追踪 |
| 缺乏接口抽象 | 没有接口定义 | 无法实现和替换 |

### 2. 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                    表现层 (Presentation)                      │
│  Routes / Controllers                                       │
├─────────────────────────────────────────────────────────────┤
│                    应用层 (Application)                       │
│  InterviewUseCase, AgentUseCase, EvaluationUseCase          │
│  - 编排领域对象完成业务逻辑                                   │
│  - 通过接口依赖基础设施                                       │
├─────────────────────────────────────────────────────────────┤
│                    领域层 (Domain)                            │
│  Entity: Interview, Agent, Message, Evaluation              │
│  Repository Interface: IInterviewRepository, etc.           │
│  Service Interface: IAIProvider, IEventBus, etc.            │
├─────────────────────────────────────────────────────────────┤
│                    基础设施层 (Infrastructure)                │
│  Repository: SQLiteInterviewRepository, etc.                │
│  AI: MiniMaxProvider, OpenAIProvider                        │
│  Event: EventBus                                            │
└─────────────────────────────────────────────────────────────┘
```

## 新目录结构

```
server/src/
├── domain/                          # 领域层
│   ├── entities/                    # 实体定义
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
│   └── services/                    # 领域服务接口
│       ├── ai-provider.ts
│       ├── event-bus.ts
│       └── logger.ts
├── application/                     # 应用层
│   ├── use-cases/                   # 用例
│   │   ├── interview/
│   │   │   ├── create-interview.ts
│   │   │   ├── start-interview.ts
│   │   │   ├── pause-interview.ts
│   │   │   ├── continue-interview.ts
│   │   │   ├── complete-interview.ts
│   │   │   └── get-interview.ts
│   │   ├── agent/
│   │   │   ├── create-agent.ts
│   │   │   ├── update-agent.ts
│   │   │   └── get-agent.ts
│   │   └── evaluation/
│   │       ├── generate-evaluation.ts
│   │       └── get-evaluation.ts
│   ├── services/                    # 应用服务
│   │   ├── interview-orchestrator.ts  # 面试流程编排
│   │   └── ai-conversation.ts         # AI 对话管理
│   └── dto/                         # 数据传输对象
│       ├── interview.dto.ts
│       ├── agent.dto.ts
│       └── evaluation.dto.ts
├── infrastructure/                  # 基础设施层
│   ├── database/                    # 数据库
│   │   ├── connection.ts
│   │   └── sqlite/
│   │       └── index.ts
│   ├── repositories/                # 仓储实现
│   │   ├── sqlite-interview.repository.ts
│   │   ├── sqlite-agent.repository.ts
│   │   ├── sqlite-message.repository.ts
│   │   ├── sqlite-evaluation.repository.ts
│   │   └── sqlite-user.repository.ts
│   ├── ai/                          # AI 提供商实现
│   │   ├── minimax-provider.ts
│   │   └── openai-provider.ts       # 预留
│   └── event/                       # 事件实现
│       └── event-bus.ts
├── presentation/                    # 表现层
│   ├── routes/
│   │   ├── interview.routes.ts
│   │   ├── agent.routes.ts
│   │   ├── auth.routes.ts
│   │   └── profile.routes.ts
│   ├── controllers/
│   │   ├── interview.controller.ts
│   │   ├── agent.controller.ts
│   │   └── auth.controller.ts
│   └── middleware/
│       ├── auth.middleware.ts
│       └── error.middleware.ts
├── container/                       # 依赖注入容器
│   ├── container.ts
│   └── tokens.ts
├── types/                           # 类型定义
│   └── index.ts
└── index.ts                         # 入口
```

## 核心设计原则

### 1. 依赖倒置原则 (DIP)
- 高层模块不依赖低层模块，两者都依赖抽象
- 抽象不依赖细节，细节依赖抽象

### 2. 单一职责原则 (SRP)
- 每个类只有一个改变的理由
- 服务只负责业务逻辑，不处理技术细节

### 3. 接口隔离原则 (ISP)
- 客户端不应该依赖它不需要的接口
- 细粒度接口优于粗粒度接口

## 关键接口定义

### 仓储接口
```typescript
// domain/repositories/interview.repository.ts
export interface IInterviewRepository {
  create(data: CreateInterviewInput): Promise<Interview>;
  findById(id: number): Promise<Interview | null>;
  findByRoomCode(roomCode: string): Promise<Interview | null>;
  findByUserId(userId: number): Promise<Interview[]>;
  update(id: number, data: Partial<Interview>): Promise<Interview>;
  delete(id: number): Promise<void>;
  countActiveByUser(userId: number): Promise<number>;
}
```

### AI 提供商接口
```typescript
// domain/services/ai-provider.ts
export interface IAIProvider {
  generateResponse(params: GenerateResponseInput): Promise<AIResponse>;
  generateInterviewQuestion(params: GenerateQuestionInput): Promise<AIResponse>;
  generateCandidateAnswer(params: GenerateAnswerInput): Promise<AIResponse>;
  generateEvaluation(params: GenerateEvaluationInput): Promise<AIResponse>;
  generateFeedback(params: GenerateFeedbackInput): Promise<AIResponse>;
}
```

### 事件总线接口
```typescript
// domain/services/event-bus.ts
export interface IEventBus {
  publish<T>(event: DomainEvent<T>): void;
  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void;
}

export interface DomainEvent<T> {
  type: string;
  payload: T;
  timestamp: Date;
}
```

## 依赖注入设计

使用 tsyringe 或手动实现 DI 容器：

```typescript
// container/container.ts
container.register<IInterviewRepository>(
  TOKENS.InterviewRepository,
  { useClass: SQLiteInterviewRepository }
);

container.register<IAIProvider>(
  TOKENS.AIProvider,
  { useClass: MiniMaxProvider }
);

container.register<IEventBus>(
  TOKENS.EventBus,
  { useSingleton: EventBus }
);
```

## 迁移步骤

### 阶段 1: 建立领域层
1. 创建实体类型
2. 定义仓储接口
3. 定义服务接口

### 阶段 2: 建立基础设施层
1. 实现 SQLite 仓储
2. 实现 AI 提供商
3. 实现事件总线

### 阶段 3: 建立应用层
1. 实现用例类
2. 实现应用服务
3. 建立 DTO

### 阶段 4: 重构表现层
1. 创建 Controller
2. 使用用例替代直接服务调用
3. 配置路由

### 阶段 5: 验证和清理
1. 确保所有测试通过
2. 删除旧代码
3. 更新文档

## 测试策略

- **单元测试**: 针对用例和领域服务
- **集成测试**: 测试仓储实现和 AI 提供商
- **E2E 测试**: 测试完整流程

## 优势

1. **可测试性**: 可以轻松 mock 依赖
2. **可替换性**: 可以切换数据库或 AI 提供商
3. **可维护性**: 每个模块职责清晰
4. **可扩展性**: 添加新功能不影响现有代码
