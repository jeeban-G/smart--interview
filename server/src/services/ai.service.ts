import dotenv from 'dotenv';

dotenv.config();

// AI Provider 配置
const AI_PROVIDER = process.env.AI_PROVIDER || 'openclaw'; // 'openclaw' 或 'minimax'

export interface AIResponse {
  content: string;
  error?: string;
}

export interface Agent {
  id?: number;
  name?: string;
  type?: 'candidate' | 'interviewer';
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  company?: string;
  style?: string;
  specialties?: string;
}

export interface Interview {
  position?: string;
  question?: string | null;
  candidate_agent_id?: number | null;
  interviewer_agent_id?: number | null;
}

export const aiService = {
  /**
   * 生成 AI 响应（用户单面场景）
   */
  async generateResponse(
    interview: Interview,
    senderType: string,
    agent: Agent | null,
    conversationHistory: string
  ): Promise<AIResponse> {
    if (AI_PROVIDER === 'minimax') {
      const { aiService: service } = await import('./ai.minimax.service.js');
      return service.generateResponse(interview, senderType, agent, conversationHistory);
    } else {
      const { openclawService: service } = await import('./openclaw.service.js');
      return service.generateResponse(interview, senderType, agent, conversationHistory);
    }
  },

  /**
   * 生成候选人自我介绍
   */
  async generateCandidateIntro(interview: Interview, candidateAgent: Agent): Promise<AIResponse> {
    if (AI_PROVIDER === 'minimax') {
      const { aiService: service } = await import('./ai.minimax.service.js');
      return service.generateCandidateIntro(interview, candidateAgent);
    } else {
      const { openclawService: service } = await import('./openclaw.service.js');
      return service.generateCandidateIntro(interview, candidateAgent);
    }
  },

  /**
   * 生成面试官问题
   */
  async generateInterviewerQuestion(
    interview: Interview,
    interviewerAgent: Agent,
    candidateAgent: Agent,
    conversationHistory: string,
    hasAskedTopics: {
      projects: boolean;
      tech: boolean;
      problems: boolean;
      system: boolean;
      team: boolean;
    }
  ): Promise<AIResponse> {
    if (AI_PROVIDER === 'minimax') {
      const { aiService: service } = await import('./ai.minimax.service.js');
      return service.generateInterviewerQuestion(interview, interviewerAgent, candidateAgent, conversationHistory, hasAskedTopics);
    } else {
      const { openclawService: service } = await import('./openclaw.service.js');
      return service.generateInterviewerQuestion(interview, interviewerAgent, candidateAgent, conversationHistory, hasAskedTopics);
    }
  },

  /**
   * 生成候选人回答
   */
  async generateCandidateAnswer(
    interview: Interview,
    candidateAgent: Agent,
    lastQuestion: string,
    conversationHistory: string,
    previousAnswers: string[]
  ): Promise<AIResponse> {
    if (AI_PROVIDER === 'minimax') {
      const { aiService: service } = await import('./ai.minimax.service.js');
      return service.generateCandidateAnswer(interview, candidateAgent, lastQuestion, conversationHistory, previousAnswers);
    } else {
      const { openclawService: service } = await import('./openclaw.service.js');
      return service.generateCandidateAnswer(interview, candidateAgent, lastQuestion, conversationHistory, previousAnswers);
    }
  },

  /**
   * 生成实时反馈
   */
  async generateRealtimeFeedback(
    interview: Interview,
    recentMessages: string
  ): Promise<AIResponse> {
    if (AI_PROVIDER === 'minimax') {
      const { aiService: service } = await import('./ai.minimax.service.js');
      return service.generateRealtimeFeedback(interview, recentMessages);
    } else {
      const { openclawService: service } = await import('./openclaw.service.js');
      return service.generateRealtimeFeedback(interview, recentMessages);
    }
  },
};

// 导出 callMiniMaxAPI 保持向后兼容
export async function callMiniMaxAPI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 512
): Promise<AIResponse> {
  if (AI_PROVIDER === 'minimax') {
    const { callMiniMaxAPI: call } = await import('./ai.minimax.service.js');
    return call(systemPrompt, userPrompt, maxTokens);
  } else {
    const { callOpenClawAPI: call } = await import('./openclaw.service.js');
    return call(systemPrompt, userPrompt, maxTokens);
  }
}

// 导出当前使用的 provider 名称
export function getAIProviderName(): string {
  return AI_PROVIDER;
}
