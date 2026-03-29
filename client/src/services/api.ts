import type { Agent, UserProfile, CoachingLog, InterviewFeedback, Message } from '../types';

const API_BASE = '/api';

// 获取 token
function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  // 创建 Headers 对象
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  // 添加额外的 headers
  if (options?.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers.append(key, value);
    });
  }

  // 如果有 token，添加到请求头
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 如果是 401 错误，可能 token 过期，清除本地认证信息
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 可以在这里触发重定向到登录页
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

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

  getNextMessages: (id: number) => request<{ messages: Message[] }>(`/interview/${id}/next`),

  continueAgentChat: (id: number) => request<{ messages: Message[]; shouldContinue: boolean }>(`/interview/${id}/continue`, { method: 'POST' }),

  getInterviewStatus: (id: number) => request<{ status: string; shouldContinue: boolean; reason?: string }>(`/interview/${id}/status`),

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
