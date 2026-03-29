// application/use-cases/interview/send-message.ts
import {
  IInterviewRepository,
  IMessageRepository,
  IAgentRepository,
  IAIProvider,
  Message,
  SenderType,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export interface SendMessageRequest {
  interviewId: number;
  userId: number;
  content: string;
  senderType: SenderType;
  senderName: string | null;
}

export interface SendMessageResult {
  message: Message;
  replyMessage?: Message;
}

export class SendMessageUseCase {
  private interviewRepository: IInterviewRepository;
  private messageRepository: IMessageRepository;
  private agentRepository: IAgentRepository;
  private aiProvider: IAIProvider;

  constructor(container: IServiceContainer) {
    this.interviewRepository = container.interviewRepository;
    this.messageRepository = container.messageRepository;
    this.agentRepository = container.agentRepository;
    this.aiProvider = container.aiProvider;
  }

  async execute(request: SendMessageRequest): Promise<SendMessageResult> {
    const { interviewId, userId, content, senderType, senderName } = request;

    // 获取面试
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview) {
      throw new Error('面试不存在');
    }

    // 验证权限
    if (interview.userId !== userId) {
      throw new Error('无权访问此面试');
    }

    if (interview.status === 'completed') {
      throw new Error('面试已结束');
    }

    // 保存消息
    const message = await this.messageRepository.create({
      interviewId,
      senderType,
      senderName,
      content,
    });

    // 检查是否是两个 Agent 之间的对话
    const isAgentChat = interview.candidateAgentId && interview.interviewerAgentId;

    // 如果是用户消息，生成 AI 回复
    if (senderType === 'user' && isAgentChat) {
      const replyMessage = await this.generateInterviewerResponse(interviewId);
      return { message, replyMessage };
    }

    return { message };
  }

  private async generateInterviewerResponse(interviewId: number): Promise<Message | undefined> {
    const interview = await this.interviewRepository.findById(interviewId);
    if (!interview || !interview.interviewerAgentId || !interview.candidateAgentId) {
      return undefined;
    }

    const messages = await this.messageRepository.findByInterviewId(interviewId);
    const interviewerAgent = await this.agentRepository.findById(interview.interviewerAgentId);
    const candidateAgent = await this.agentRepository.findById(interview.candidateAgentId);

    if (!interviewerAgent || !candidateAgent) {
      return undefined;
    }

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

    return this.messageRepository.create({
      interviewId,
      senderType: 'ai_interviewer' as SenderType,
      senderName: interviewerAgent.name,
      content: response.content,
    });
  }
}