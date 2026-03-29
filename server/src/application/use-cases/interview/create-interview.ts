// application/use-cases/interview/create-interview.ts
import {
  IInterviewRepository,
  IAgentRepository,
  CreateInterviewInput,
  Interview,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export interface CreateInterviewRequest {
  userId: number;
  type: 'group' | 'single';
  position: string;
  candidateAgentId?: number;
  interviewerAgentId?: number;
}

export class CreateInterviewUseCase {
  private interviewRepository: IInterviewRepository;
  private agentRepository: IAgentRepository;

  constructor(container: IServiceContainer) {
    this.interviewRepository = container.interviewRepository;
    this.agentRepository = container.agentRepository;
  }

  async execute(request: CreateInterviewRequest): Promise<Interview> {
    // 验证 agent 是否存在
    if (request.candidateAgentId) {
      const agent = await this.agentRepository.findById(request.candidateAgentId);
      if (!agent) {
        throw new Error('候选人 Agent 不存在');
      }
    }

    if (request.interviewerAgentId) {
      const agent = await this.agentRepository.findById(request.interviewerAgentId);
      if (!agent) {
        throw new Error('面试官 Agent 不存在');
      }
    }

    // 检查活跃房间数限制
    const activeCount = await this.interviewRepository.countActiveByUser(request.userId);
    const MAX_ACTIVE_ROOMS = 10;
    if (activeCount >= MAX_ACTIVE_ROOMS) {
      throw new Error(`当前活跃房间已达上限(${MAX_ACTIVE_ROOMS})，请先结束已有面试`);
    }

    // 生成面试题目
    const question = this.generateQuestion(request.position);

    const input: CreateInterviewInput = {
      userId: request.userId,
      type: request.type,
      position: request.position,
      question,
      candidateAgentId: request.candidateAgentId,
      interviewerAgentId: request.interviewerAgentId,
    };

    return this.interviewRepository.create(input);
  }

  private generateQuestion(position: string): string {
    const questions: Record<string, string[]> = {
      'frontend': [
        '请谈谈你在前端项目中使用 TypeScript 的经验，以及如何避免类型问题？',
        '描述一下你如何优化 React 应用的性能？',
        '你如何看待前端架构中的模块化设计？',
      ],
      'backend': [
        '请描述一下你如何设计一个高并发的 RESTful API？',
        '你如何处理数据库事务和并发控制？',
        '谈谈你使用微服务架构的经验。',
      ],
      'default': [
        '请做一个简短的自我介绍，重点介绍与你申请职位相关的经验。',
        '描述你过去遇到的最大技术挑战以及如何解决的？',
        '你为什么想要加入我们公司？',
      ],
    };

    const positionQuestions = questions[position] || questions['default'];
    return positionQuestions[Math.floor(Math.random() * positionQuestions.length)];
  }
}