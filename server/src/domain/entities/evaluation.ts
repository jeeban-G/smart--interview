// domain/entities/evaluation.ts

export interface Evaluation {
  id: number;
  interviewId: number;
  summary: string;
  highlights: Highlight[];
  pros: string;
  cons: string;
  suggestions: string;
  overallScore?: number;
  technicalDepth?: number;
  communication?: number;
  projectExperience?: number;
  adaptability?: number;
  createdAt: Date;
}

export interface Highlight {
  question: string;
  answer: string;
}

export interface CreateEvaluationInput {
  interviewId: number;
  summary: string;
  highlights: Highlight[];
  pros: string;
  cons: string;
  suggestions: string;
  overallScore?: number;
  technicalDepth?: number;
  communication?: number;
  projectExperience?: number;
  adaptability?: number;
}
