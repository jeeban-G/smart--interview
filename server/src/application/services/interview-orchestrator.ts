// application/services/interview-orchestrator.ts
import {
  IInterviewRepository,
  IAgentRepository,
  IMessageRepository,
  IEvaluationRepository,
  IAIProvider,
  IEventBus,
  Interview,
  Agent,
  Message,
  SenderType,
  EventTypes,
} from '../../domain/index.js';
import { IServiceContainer } from '../../container/container.js';

interface ConversationContext {
  interviewId: number;
  candidateAgent: Agent;
  interviewerAgent: Agent;
  interview: Interview;
}

interface ShouldContinueResult {
  shouldContinue: boolean;
  reason: string;
}

export class InterviewOrchestrator {
  private interviewRepository: IInterviewRepository;
  private agentRepository: IAgentRepository;
  private messageRepository: IMessageRepository;
  private evaluationRepository: IEvaluationRepository;
  private aiProvider: IAIProvider;
  private eventBus: IEventBus;

  // 暂停标志
  private pauseFlags: Map<number, boolean> = new Map();
  // 恢复信号
  private resumeSignals: Map<number, (() => void)[]> = new Map();
  // 运行中的面试（防止重复启动）
  private runningInterviews: Map<number, boolean> = new Map();

  constructor(container: IServiceContainer) {
    this.interviewRepository = container.interviewRepository;
    this.agentRepository = container.agentRepository;
    this.messageRepository = container.messageRepository;
    this.evaluationRepository = container.evaluationRepository;
    this.aiProvider = container.aiProvider;
    this.eventBus = container.eventBus;
  }

  /**
   * 启动 AI 面试对话
   */
  async startInterview(interviewId: number): Promise<void> {
    // 检查是否已经在运行
    if (this.runningInterviews.get(interviewId)) {
      console.log(`[InterviewOrchestrator] Interview ${interviewId} is already running`);
      return;
    }

    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new Error('面试不存在');
    }

    if (!interview.candidateAgentId || !interview.interviewerAgentId) {
      throw new Error('面试未配置 AI Agent');
    }

    const [candidateAgent, interviewerAgent] = await Promise.all([
      this.agentRepository.findById(interview.candidateAgentId),
      this.agentRepository.findById(interview.interviewerAgentId),
    ]);

    if (!candidateAgent || !interviewerAgent) {
      throw new Error('Agent 不存在');
    }

    // 标记为运行中
    this.runningInterviews.set(interviewId, true);

    const context: ConversationContext = {
      interviewId,
      candidateAgent,
      interviewerAgent,
      interview,
    };

    // 发布面试开始事件
    this.eventBus.publish({
      type: EventTypes.INTERVIEW_STARTED,
      payload: { interviewId },
      timestamp: new Date(),
    });

    // 开始对话循环
    this.runConversationLoop(context).finally(() => {
      // 循环结束后清除运行标记
      this.runningInterviews.delete(interviewId);
    });
  }

  /**
   * 暂停面试
   */
  pauseInterview(interviewId: number): void {
    this.pauseFlags.set(interviewId, true);
    this.eventBus.publish({
      type: EventTypes.INTERVIEW_PAUSED,
      payload: { interviewId },
      timestamp: new Date(),
    });
  }

  /**
   * 恢复面试
   */
  resumeInterview(interviewId: number): void {
    // 如果面试已经在运行，只需要清除暂停标志并触发恢复信号
    if (this.runningInterviews.get(interviewId)) {
      this.pauseFlags.set(interviewId, false);

      // 触发所有等待的恢复信号
      const signals = this.resumeSignals.get(interviewId) || [];
      signals.forEach(signal => signal());
      this.resumeSignals.delete(interviewId);

      this.eventBus.publish({
        type: EventTypes.INTERVIEW_RESUMED,
        payload: { interviewId },
        timestamp: new Date(),
      });
      return;
    }

    // 如果面试没有运行，需要重新启动
    this.pauseFlags.set(interviewId, false);

    this.eventBus.publish({
      type: EventTypes.INTERVIEW_RESUMED,
      payload: { interviewId },
      timestamp: new Date(),
    });

    // 使用 startInterview 重新启动对话循环（会自动检查是否已在运行）
    this.startInterview(interviewId);
  }

  /**
   * 运行对话循环
   */
  private async runConversationLoop(context: ConversationContext): Promise<void> {
    const { interviewId, candidateAgent, interviewerAgent } = context;

    // 获取已有消息数量
    const existingMessages = await this.messageRepository.findByInterviewId(interviewId);

    // 如果没有消息，从候选人自我介绍开始
    if (existingMessages.length === 0) {
      await this.generateCandidateIntro(context);
    }

    // 对话循环
    while (true) {
      // 检查是否暂停
      if (await this.isPaused(interviewId)) {
        return;
      }

      // 检查面试是否已结束
      const currentInterview = await this.interviewRepository.findById(interviewId);
      if (!currentInterview || currentInterview.status === 'completed') {
        break;
      }

      // 检查是否应该继续
      const shouldContinueResult = await this.shouldContinueInterview(interviewId);
      if (!shouldContinueResult.shouldContinue) {
        await this.completeInterview(interviewId);
        break;
      }

      // 等待一段时间（模拟思考时间）
      await this.delay(6000);

      // 再次检查暂停状态
      if (await this.isPaused(interviewId)) {
        return;
      }

      // 生成候选人回答
      await this.generateCandidateResponse(context);

      // 等待一段时间
      await this.delay(6000);

      // 检查是否应该继续
      const continueCheck = await this.shouldContinueInterview(interviewId);
      if (!continueCheck.shouldContinue) {
        await this.completeInterview(interviewId);
        break;
      }

      // 生成面试官问题
      await this.generateInterviewerQuestion(context);
    }
  }

  /**
   * 生成候选人自我介绍
   */
  private async generateCandidateIntro(context: ConversationContext): Promise<void> {
    const { interviewId, candidateAgent, interview } = context;

    // 发布打字中事件
    this.eventBus.publish({
      type: EventTypes.TYPING_STARTED,
      payload: { interviewId, agent: 'candidate' },
      timestamp: new Date(),
    });

    const response = await this.aiProvider.generateCandidateIntro(
      interview.position,
      {
        name: candidateAgent.name,
        education: candidateAgent.education,
        experience: candidateAgent.experience,
        skills: candidateAgent.skills,
        personality: candidateAgent.personality,
      }
    );

    const message = await this.messageRepository.create({
      interviewId,
      senderType: 'ai_candidate' as SenderType,
      senderName: candidateAgent.name,
      content: response.content,
    });

    this.eventBus.publish({
      type: EventTypes.MESSAGE_RECEIVED,
      payload: { interviewId, message, agent: 'candidate' },
      timestamp: new Date(),
    });
  }

  /**
   * 生成候选人回答
   */
  private async generateCandidateResponse(context: ConversationContext): Promise<void> {
    const { interviewId, candidateAgent, interview } = context;

    // 发布打字中事件
    this.eventBus.publish({
      type: EventTypes.TYPING_STARTED,
      payload: { interviewId, agent: 'candidate' },
      timestamp: new Date(),
    });

    const messages = await this.messageRepository.findByInterviewId(interviewId);
    const conversationHistory = await this.messageRepository.getConversationHistory(interviewId);

    const lastQuestion = [...messages]
      .reverse()
      .find(m => m.senderType === 'ai_interviewer')?.content || '';

    const previousAnswers = messages
      .filter(m => m.senderType === 'ai_candidate')
      .map(m => m.content);

    const response = await this.aiProvider.generateCandidateAnswer({
      position: interview.position,
      candidateProfile: {
        name: candidateAgent.name,
        education: candidateAgent.education,
        experience: candidateAgent.experience,
        skills: candidateAgent.skills,
        personality: candidateAgent.personality,
      },
      lastQuestion,
      conversationHistory,
      previousAnswers,
    });

    const message = await this.messageRepository.create({
      interviewId,
      senderType: 'ai_candidate' as SenderType,
      senderName: candidateAgent.name,
      content: response.content,
    });

    this.eventBus.publish({
      type: EventTypes.MESSAGE_RECEIVED,
      payload: { interviewId, message, agent: 'candidate' },
      timestamp: new Date(),
    });

    // 生成实时反馈
    await this.generateRealtimeFeedback(interviewId, messages.length / 2);
  }

  /**
   * 生成面试官问题
   */
  private async generateInterviewerQuestion(context: ConversationContext): Promise<void> {
    const { interviewId, interviewerAgent, candidateAgent, interview } = context;

    // 发布打字中事件
    this.eventBus.publish({
      type: EventTypes.TYPING_STARTED,
      payload: { interviewId, agent: 'interviewer' },
      timestamp: new Date(),
    });

    const messages = await this.messageRepository.findByInterviewId(interviewId);
    const conversationHistory = await this.messageRepository.getConversationHistory(interviewId);

    // 分析已问过的话题
    const candidateResponses = messages
      .filter(m => m.senderType === 'ai_candidate')
      .map(m => m.content);
    const askedTopics = candidateResponses.join('');

    const response = await this.aiProvider.generateInterviewQuestion({
      position: interview.position,
      interviewerProfile: {
        name: interviewerAgent.name,
        company: interviewerAgent.company || '其他',
        style: interviewerAgent.style || '',
        specialties: interviewerAgent.specialties || '',
      },
      candidateProfile: {
        name: candidateAgent.name,
        education: candidateAgent.education,
        experience: candidateAgent.experience,
        skills: candidateAgent.skills,
        personality: candidateAgent.personality,
      },
      conversationHistory,
      askedTopics: {
        projects: askedTopics.includes('项目'),
        tech: askedTopics.includes('技术') || askedTopics.includes('React') || askedTopics.includes('TypeScript'),
        problems: askedTopics.includes('问题') || askedTopics.includes('挑战') || askedTopics.includes('困难'),
        system: askedTopics.includes('系统') || askedTopics.includes('架构') || askedTopics.includes('设计'),
        team: askedTopics.includes('团队') || askedTopics.includes('协作') || askedTopics.includes('合作'),
      },
    });

    const message = await this.messageRepository.create({
      interviewId,
      senderType: 'ai_interviewer' as SenderType,
      senderName: interviewerAgent.name,
      content: response.content,
    });

    this.eventBus.publish({
      type: EventTypes.MESSAGE_RECEIVED,
      payload: { interviewId, message, agent: 'interviewer' },
      timestamp: new Date(),
    });
  }

  /**
   * 生成实时反馈
   */
  private async generateRealtimeFeedback(interviewId: number, round: number): Promise<void> {
    const messages = await this.messageRepository.findByInterviewId(interviewId);
    const recentMessages = messages.slice(-4);
    const recentMessagesStr = recentMessages
      .map(m => `${m.senderName || m.senderType}: ${m.content}`)
      .join('\n');

    const response = await this.aiProvider.generateRealtimeFeedback({
      recentMessages: recentMessagesStr,
    });

    if (response.content) {
      this.eventBus.publish({
        type: EventTypes.FEEDBACK_RECEIVED,
        payload: { interviewId, round, content: response.content },
        timestamp: new Date(),
      });
    }
  }

  /**
   * 完成面试
   */
  private async completeInterview(interviewId: number): Promise<void> {
    await this.interviewRepository.update(interviewId, { status: 'completed' });

    this.eventBus.publish({
      type: EventTypes.INTERVIEW_COMPLETED,
      payload: { interviewId },
      timestamp: new Date(),
    });

    // 清理暂停状态
    this.pauseFlags.delete(interviewId);
    this.resumeSignals.delete(interviewId);
  }

  /**
   * 判断是否继续面试
   */
  private async shouldContinueInterview(interviewId: number): Promise<ShouldContinueResult> {
    const messages = await this.messageRepository.findByInterviewId(interviewId);
    const messageCount = messages.length;

    // 对话轮数（每轮2条消息：候选人说，面试官问）
    const roundCount = Math.floor(messageCount / 2);

    // 如果面试已经进行了太多轮（超过20条消息），强制结束
    if (messageCount >= 20) {
      return { shouldContinue: false, reason: '对话轮数已达上限' };
    }

    // 如果消息数少于4条，说明刚开始，继续
    if (roundCount < 2) {
      return { shouldContinue: true, reason: '刚开始面试' };
    }

    // 检查最后一条面试官的消息是否明确表示要结束
    const lastInterviewerMsg = [...messages]
      .reverse()
      .find(m => m.senderType === 'ai_interviewer');

    if (lastInterviewerMsg) {
      const endPhrases = [
        '今天的面试就到这里',
        '面试就到这里',
        '就到这里吧',
        '感谢参加面试',
        '等后续通知',
        '后续会通知',
        '面试结束',
        '我们这边会尽快通知',
        '欢迎加入我们',
        '期待你的加入',
      ];

      for (const phrase of endPhrases) {
        if (lastInterviewerMsg.content.includes(phrase)) {
          return { shouldContinue: false, reason: '面试官已明确结束' };
        }
      }
    }

    // 检查对话质量
    const recentCandidateMsgs = messages.slice(-6).filter(m => m.senderType === 'ai_candidate');
    if (recentCandidateMsgs.length >= 3) {
      const avgLength = recentCandidateMsgs.reduce((sum, m) => sum + m.content.length, 0) / recentCandidateMsgs.length;
      if (avgLength < 30) {
        return { shouldContinue: false, reason: '候选人回答趋于简短，话题已充分讨论' };
      }
    }

    // 检查是否有重复问题
    const interviewerMsgs = messages.slice(-4).filter(m => m.senderType === 'ai_interviewer');
    if (interviewerMsgs.length >= 2) {
      const lastTwo = interviewerMsgs.slice(-2);
      const words1 = new Set(lastTwo[0].content.split(/\s+/));
      const words2 = new Set(lastTwo[1].content.split(/\s+/));
      const intersection = [...words1].filter(w => words2.has(w) && w.length > 2);
      if (intersection.length > words1.size * 0.5) {
        return { shouldContinue: false, reason: '面试官问题趋于重复' };
      }
    }

    return { shouldContinue: true, reason: '对话尚未充分' };
  }

  /**
   * 检查是否暂停
   */
  private async isPaused(interviewId: number): Promise<boolean> {
    if (this.pauseFlags.get(interviewId)) {
      // 等待恢复信号
      return new Promise((resolve) => {
        const signals = this.resumeSignals.get(interviewId) || [];
        signals.push(() => resolve(false));
        this.resumeSignals.set(interviewId, signals);
      });
    }
    return false;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
