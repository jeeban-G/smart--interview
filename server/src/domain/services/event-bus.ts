// domain/services/event-bus.ts

export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
}

export type EventHandler<T> = (event: DomainEvent<T>) => void;

export interface IEventBus {
  publish<T>(event: DomainEvent<T>): void;
  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void;
  unsubscribe<T>(eventType: string, handler: EventHandler<T>): void;
}

// 预定义事件类型
export const EventTypes = {
  // 面试事件
  INTERVIEW_CREATED: 'interview:created',
  INTERVIEW_STARTED: 'interview:started',
  INTERVIEW_PAUSED: 'interview:paused',
  INTERVIEW_RESUMED: 'interview:resumed',
  INTERVIEW_COMPLETED: 'interview:completed',

  // 消息事件
  MESSAGE_RECEIVED: 'message:received',
  TYPING_STARTED: 'typing:started',

  // Coaching 事件
  COACHING_ACCEPTED: 'coaching:accepted',
  COACHING_REJECTED: 'coaching:rejected',

  // 反馈事件
  FEEDBACK_RECEIVED: 'feedback:received',
} as const;
