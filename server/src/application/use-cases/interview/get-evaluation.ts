// application/use-cases/interview/get-evaluation.ts
import {
  IInterviewRepository,
  IEvaluationRepository,
  IMessageRepository,
  IAIProvider,
  Evaluation,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export class GetEvaluationUseCase {
  private interviewRepository: IInterviewRepository;
  private evaluationRepository: IEvaluationRepository;
  private messageRepository: IMessageRepository;
  private aiProvider: IAIProvider;

  constructor(container: IServiceContainer) {
    this.interviewRepository = container.interviewRepository;
    this.evaluationRepository = container.evaluationRepository;
    this.messageRepository = container.messageRepository;
    this.aiProvider = container.aiProvider;
  }

  async execute(interviewId: number, userId: number): Promise<Evaluation | null> {
    // 验证面试存在且用户有权限
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new Error('面试不存在');
    }

    if (interview.userId !== userId) {
      throw new Error('无权访问此面试');
    }

    // 先检查是否已有评估
    let evaluation = await this.evaluationRepository.findByInterviewId(interviewId);

    // 如果没有评估且面试已完成，生成评估
    if (!evaluation && interview.status === 'completed') {
      evaluation = await this.generateEvaluation(interview);
    }

    return evaluation;
  }

  private async generateEvaluation(interview: { id: number; position: string; type: 'group' | 'single' }): Promise<Evaluation> {
    const conversationHistory = await this.messageRepository.getConversationHistory(interview.id);

    const aiResponse = await this.aiProvider.generateEvaluation({
      position: interview.position,
      interviewType: interview.type,
      conversationHistory,
    });

    let parsedEvaluation: {
      summary: string;
      highlights: { question: string; answer: string }[];
      pros: string | string[];
      cons: string | string[];
      suggestions: string | string[];
    };

    try {
      const cleanText = aiResponse.content
        .replace(/^```json\s*/g, '')
        .replace(/\s*```$/g, '')
        .trim();
      parsedEvaluation = JSON.parse(cleanText);
    } catch {
      parsedEvaluation = {
        summary: aiResponse.content,
        highlights: [],
        pros: '',
        cons: '',
        suggestions: '',
      };
    }

    return this.evaluationRepository.create({
      interviewId: interview.id,
      summary: parsedEvaluation.summary || '',
      highlights: Array.isArray(parsedEvaluation.highlights) ? parsedEvaluation.highlights : [],
      pros: Array.isArray(parsedEvaluation.pros) ? parsedEvaluation.pros.join('; ') : parsedEvaluation.pros || '',
      cons: Array.isArray(parsedEvaluation.cons) ? parsedEvaluation.cons.join('; ') : parsedEvaluation.cons || '',
      suggestions: Array.isArray(parsedEvaluation.suggestions) ? parsedEvaluation.suggestions.join('; ') : parsedEvaluation.suggestions || '',
    });
  }
}