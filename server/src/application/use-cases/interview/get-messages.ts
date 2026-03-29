// application/use-cases/interview/get-messages.ts
import {
  IInterviewRepository,
  IMessageRepository,
  Message,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export class GetMessagesUseCase {
  private interviewRepository: IInterviewRepository;
  private messageRepository: IMessageRepository;

  constructor(container: IServiceContainer) {
    this.interviewRepository = container.interviewRepository;
    this.messageRepository = container.messageRepository;
  }

  async execute(interviewId: number, userId: number): Promise<Message[]> {
    // 验证面试存在且用户有权限
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new Error('面试不存在');
    }

    if (interview.userId !== userId) {
      throw new Error('无权访问此面试');
    }

    return this.messageRepository.findByInterviewId(interviewId);
  }
}