// application/use-cases/interview/complete-interview.ts
import {
  IInterviewRepository,
  IEvaluationRepository,
  IMessageRepository,
  IAIProvider,
  Interview,
  Evaluation,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export class CompleteInterviewUseCase {
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

  async execute(id: number): Promise<{ interview: Interview; evaluation: Evaluation }> {
    const interview = await this.interviewRepository.findById(id);
    if (!interview) {
      throw new Error('面试不存在');
    }

    if (interview.status === 'completed') {
      const existingEvaluation = await this.evaluationRepository.findByInterviewId(id);
      return {
        interview,
        evaluation: existingEvaluation!,
      };
    }

    // 更新面试状态为已完成
    const updatedInterview = await this.interviewRepository.update(id, {
      status: 'completed',
    });

    if (!updatedInterview) {
      throw new Error('更新面试状态失败');
    }

    // 生成评估报告
    const evaluation = await this.generateEvaluation(updatedInterview);

    return {
      interview: updatedInterview,
      evaluation,
    };
  }

  private async generateEvaluation(interview: Interview): Promise<Evaluation> {
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

    // 确保 highlights 是数组
    const highlights = Array.isArray(parsedEvaluation.highlights)
      ? parsedEvaluation.highlights
      : [];

    // 转换数组为字符串
    const pros = Array.isArray(parsedEvaluation.pros)
      ? parsedEvaluation.pros.join('; ')
      : parsedEvaluation.pros || '';
    const cons = Array.isArray(parsedEvaluation.cons)
      ? parsedEvaluation.cons.join('; ')
      : parsedEvaluation.cons || '';
    const suggestions = Array.isArray(parsedEvaluation.suggestions)
      ? parsedEvaluation.suggestions.join('; ')
      : parsedEvaluation.suggestions || '';

    return this.evaluationRepository.create({
      interviewId: interview.id,
      summary: parsedEvaluation.summary || '',
      highlights,
      pros,
      cons,
      suggestions,
    });
  }
}