// domain/entities/agent.ts

export type AgentType = 'candidate' | 'interviewer';

export interface Agent {
  id: number;
  userId: number;
  name: string;
  type: AgentType;
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  resumeText?: string;
  style?: string;
  specialties?: string;
  company?: string;
  createdAt: Date;
}

export interface CreateAgentInput {
  userId: number;
  name: string;
  type: AgentType;
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  resumeText?: string;
  style?: string;
  specialties?: string;
  company?: string;
}

export interface UpdateAgentInput {
  name?: string;
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  resumeText?: string;
  style?: string;
  specialties?: string;
  company?: string;
}
