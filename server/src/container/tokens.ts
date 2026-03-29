// container/tokens.ts
// 依赖注入令牌

export const TOKENS = {
  // 数据库
  DatabaseConnection: Symbol.for('DatabaseConnection'),

  // 仓储
  InterviewRepository: Symbol.for('InterviewRepository'),
  AgentRepository: Symbol.for('AgentRepository'),
  MessageRepository: Symbol.for('MessageRepository'),
  EvaluationRepository: Symbol.for('EvaluationRepository'),
  UserRepository: Symbol.for('UserRepository'),

  // 服务
  AIProvider: Symbol.for('AIProvider'),
  EventBus: Symbol.for('EventBus'),
  Logger: Symbol.for('Logger'),
} as const;
