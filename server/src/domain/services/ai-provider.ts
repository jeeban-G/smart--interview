// domain/services/ai-provider.ts

export interface AIResponse {
  content: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GenerateResponseInput {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface GenerateQuestionInput {
  position: string;
  interviewerProfile: {
    name: string;
    company: string;
    style: string;
    specialties: string;
  };
  candidateProfile: {
    name: string;
    education?: string;
    experience?: string;
    skills?: string;
    personality?: string;
  };
  conversationHistory: string;
  askedTopics: {
    projects: boolean;
    tech: boolean;
    problems: boolean;
    system: boolean;
    team: boolean;
  };
}

export interface GenerateAnswerInput {
  position: string;
  candidateProfile: {
    name: string;
    education?: string;
    experience?: string;
    skills?: string;
    personality?: string;
  };
  lastQuestion: string;
  conversationHistory: string;
  previousAnswers: string[];
}

export interface GenerateEvaluationInput {
  position: string;
  interviewType: 'group' | 'single';
  conversationHistory: string;
}

export interface GenerateFeedbackInput {
  recentMessages: string;
}

export interface IAIProvider {
  generateResponse(input: GenerateResponseInput): Promise<AIResponse>;
  generateInterviewQuestion(input: GenerateQuestionInput): Promise<AIResponse>;
  generateCandidateAnswer(input: GenerateAnswerInput): Promise<AIResponse>;
  generateEvaluation(input: GenerateEvaluationInput): Promise<AIResponse>;
  generateRealtimeFeedback(input: GenerateFeedbackInput): Promise<AIResponse>;
  generateCandidateIntro(
    position: string,
    candidateProfile: GenerateAnswerInput['candidateProfile']
  ): Promise<AIResponse>;
}
