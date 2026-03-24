import type { Agent, UserProfile, CoachingLog, InterviewFeedback } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const api = {
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getRoomStatus: () => request<{ active: number; max: number; available: boolean }>('/interview/rooms'),

  getPositions: () => request<{ id: string; name: string }[]>('/interview/positions'),

  createInterview: (data: { type: string; position: string; candidate_agent_id?: number; interviewer_agent_id?: number }) =>
    request('/interview/create', { method: 'POST', body: JSON.stringify(data) }),

  getInterview: (id: number) => request(`/interview/${id}`),

  getHistory: () => request('/interview/history'),

  sendMessage: (id: number, content: string, sender_type: string = 'user', sender_name?: string) =>
    request(`/interview/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, sender_type, sender_name }),
    }),

  getMessages: (id: number) => request(`/interview/${id}/messages`),

  getNextMessages: (id: number) => request<{ messages: any[] }>(`/interview/${id}/next`),

  continueAgentChat: (id: number) => request<{ messages: any[]; shouldContinue: boolean }>(`/interview/${id}/continue`, { method: 'POST' }),

  getInterviewStatus: (id: number) => request<{ status: string; continue: boolean; reason: string }>(`/interview/${id}/status`),

  getEvaluation: (id: number) => request(`/interview/${id}/eval`),

  completeInterview: (id: number) =>
    request(`/interview/${id}/complete`, { method: 'POST' }),

  startInterview: (id: number) =>
    request(`/interview/${id}/start`, { method: 'POST' }),

  pauseInterview: (id: number) =>
    request(`/interview/${id}/pause`, { method: 'POST' }),

  resumeInterview: (id: number) =>
    request(`/interview/${id}/resume`, { method: 'POST' }),

  deleteInterview: (id: number) =>
    request(`/interview/${id}`, { method: 'DELETE' }),

  // Agent APIs
  getAgents: () => request<Agent[]>('/agents'),

  getAgent: (id: number) => request<Agent>(`/agents/${id}`),

  createAgent: (data: Partial<Agent> & { name: string; type: 'candidate' | 'interviewer' }) =>
    request<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),

  updateAgent: (id: number, data: Partial<Agent>) =>
    request<Agent>(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAgent: (id: number) =>
    request<void>(`/agents/${id}`, { method: 'DELETE' }),

  // Profile APIs
  getProfile: () => request<UserProfile>('/profiles'),
  getProfileById: (id: number) => request<UserProfile>(`/profiles/${id}`),
  createProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (id: number, data: Partial<UserProfile>) =>
    request<UserProfile>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Coaching APIs
  getCoachingLogs: (interviewId: number) =>
    request<CoachingLog[]>(`/interview/${interviewId}/coaching`),
  processCoaching: (interviewId: number, content: string) =>
    request<{ accepted: boolean; reason: string; appliedContent?: string }>(
      `/interview/${interviewId}/coach`,
      { method: 'POST', body: JSON.stringify({ content }) }
    ),

  // Feedback APIs
  getFeedbacks: (interviewId: number) =>
    request<InterviewFeedback[]>(`/interview/${interviewId}/feedback`),
};
