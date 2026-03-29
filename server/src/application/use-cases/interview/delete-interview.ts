// application/use-cases/interview/delete-interview.ts
import {
  IInterviewRepository,
  IMessageRepository,
  IEvaluationRepository,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export class DeleteInterviewUseCase {
  private interviewRepository: IInterviewRepository;
  private messageRepository: IMessageRepository;
  private evaluationRepository: IEvaluationRepository;

  constructor(container: IServiceContainer) {
    this.interviewRepository = container.interviewRepository;
    this.messageRepository = container.messageRepository;
    this.evaluationRepository = container.evaluationRepository;
  }

  async execute(id: number, userId: number): Promise<boolean> {
    // 验证面试存在且用户有权限
    const interview = await this.interviewRepository.findById(id);
    if (!interview) {
      throw new Error('面试不存在');
    }

    if (interview.userId !== userId) {
      throw new Error('无权删除此面试');
    }

    // 删除相关数据
    await this.messageRepository.deleteByInterviewId(id);
    await this.evaluationRepository.deleteByInterviewId(id);
    await this.interviewRepository.delete(id);

    return true;
  }
}