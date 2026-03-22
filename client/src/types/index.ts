export interface User {
  id: number;
  email: string;
  nickname: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Position {
  id: string;
  name: string;
  position: string;
  tag?: string;
  salary?: string;
  location?: string;
}

export interface Interview {
  id: number;
  user_id: number;
  room_code?: string;
  type: 'group' | 'single';
  position: string;
  question: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  duration: number;
  candidate_agent_id?: number | null;
  interviewer_agent_id?: number | null;
  created_at: string;
}

export interface Message {
  id: number;
  interview_id: number;
  sender_type: 'user' | 'ai_interviewer' | 'ai_candidate';
  sender_name?: string;
  content: string;
  timestamp: string;
}

export interface Evaluation {
  id: number;
  interview_id: number;
  summary: string;
  pros: string;
  cons: string;
  suggestions: string;
  created_at: string;
}

export interface Agent {
  id: number;
  user_id: number;
  name: string;
  type: 'candidate' | 'interviewer';
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  resume_text?: string;
  style?: string;
  specialties?: string;
  company?: string;
  created_at: string;
}
