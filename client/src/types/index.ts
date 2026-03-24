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
  highlights?: { question: string; answer: string }[];
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

export interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  target_position: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  projects: string | null;
  personality: string | null;
  preferred_style: 'gentle' | 'strict' | 'coaching';
  created_at: string;
  updated_at: string;
}

export interface CoachingLog {
  id: number;
  interview_id: number;
  user_id: number;
  coaching_type: 'guide' | 'correct' | 'info_request';
  content: string;
  agent_response: 'pending' | 'accepted' | 'rejected' | 'question';
  agent_feedback: string | null;
  created_at: string;
}

export interface InterviewFeedback {
  id: number;
  interview_id: number;
  round: number;
  type: 'realtime' | 'summary';
  content: string;
  created_at: string;
}

export interface EnhancedEvaluation extends Evaluation {
  overall_score?: number;
  technical_depth?: number;
  communication?: number;
  project_experience?: number;
  adaptability?: number;
}
