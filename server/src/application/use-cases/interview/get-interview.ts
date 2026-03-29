// application/use-cases/interview/get-interview.ts
import {
  IInterviewRepository,
  IMessageRepository,
  IEvaluationRepository,
  Interview,
  Message,
  Evaluation,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export interface InterviewWithDetails {
  interview: Interview;
  messages: Message[];
  evaluation: Evaluation | null;
}

export class GetInterviewUseCase {
  private interviewRepository: IInterviewRepository;
  private messageRepository: IMessageRepository;
  private evaluationRepository: IEvaluationRepository;

  constructor(container: IServiceContainer) {
    this.interviewRepository = container.interviewRepository;
    this.messageRepository = container.messageRepository;
    this.evaluationRepository = container.evaluationRepository;
  }

  async execute(id: number): Promise<InterviewWithDetails | null> {
    const interview = await this.interviewRepository.findById(id);
    if (!interview) {
      return null;
    }

    const [messages, evaluation] = await Promise.all([
      this.messageRepository.findByInterviewId(id),
      this.evaluationRepository.findByInterviewId(id),
    ]);

    return {
      interview,
      messages,
      evaluation,
    };
  }

  async executeByRoomCode(roomCode: string): Promise<Interview | null> {
    return this.interviewRepository.findByRoomCode(roomCode);
  }

  async executeByUser(userId: number): Promise<Interview[]> {
    return this.interviewRepository.findByUserId(userId);
  }

  async countActiveByUser(userId: number): Promise<number> {
    return this.interviewRepository.countActiveByUser(userId);
  }
}