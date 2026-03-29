// domain/entities/interview.ts

export type InterviewType = 'group' | 'single';
export type InterviewStatus = 'pending' | 'in_progress' | 'completed';

export interface Interview {
  id: number;
  userId: number;
  roomCode: string;
  type: InterviewType;
  position: string;
  question: string | null;
  status: InterviewStatus;
  duration: number;
  candidateAgentId: number | null;
  interviewerAgentId: number | null;
  createdAt: Date;
}

export interface CreateInterviewInput {
  userId: number;
  type: InterviewType;
  position: string;
  question?: string;
  candidateAgentId?: number;
  interviewerAgentId?: number;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
