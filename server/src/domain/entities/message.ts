// domain/entities/message.ts

export type SenderType = 'user' | 'ai_interviewer' | 'ai_candidate' | 'system';

export interface Message {
  id: number;
  interviewId: number;
  senderType: SenderType;
  senderName: string | null;
  content: string;
  timestamp: Date;
}

export interface CreateMessageInput {
  interviewId: number;
  senderType: SenderType;
  senderName: string | null;
  content: string;
}
