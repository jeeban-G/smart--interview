// container/container.ts
import type {
  IInterviewRepository,
  IAgentRepository,
  IMessageRepository,
  IEvaluationRepository,
  IUserRepository,
  IAIProvider,
  IEventBus,
  ILogger,
} from '../domain/index.js';
import { IDatabaseConnection } from '../infrastructure/database/connection.js';

// 服务容器接口
export interface IServiceContainer {
  // 数据库
  dbConnection: IDatabaseConnection;

  // 仓储
  interviewRepository: IInterviewRepository;
  agentRepository: IAgentRepository;
  messageRepository: IMessageRepository;
  evaluationRepository: IEvaluationRepository;
  userRepository: IUserRepository;

  // 服务
  aiProvider: IAIProvider;
  eventBus: IEventBus;
  logger: ILogger;
}

// 全局容器实例
let container: IServiceContainer | null = null;

export function setContainer(serviceContainer: IServiceContainer): void {
  container = serviceContainer;
}

export function getContainer(): IServiceContainer {
  if (!container) {
    throw new Error('Service container not initialized');
  }
  return container;
}
