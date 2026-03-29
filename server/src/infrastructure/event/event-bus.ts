// infrastructure/event/event-bus.ts
import {
  IEventBus,
  DomainEvent,
  EventHandler,
} from '../../domain/services/event-bus.js';

export class EventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();

  publish<T>(event: DomainEvent<T>): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event as DomainEvent<unknown>);
        } catch (error) {
          console.error(`[EventBus] Error handling event ${event.type}:`, error);
        }
      });
    }
  }

  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler<unknown>);

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(eventType, handler);
    };
  }

  unsubscribe<T>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler<unknown>);
    }
  }

  // 清除所有处理器（主要用于测试）
  clear(): void {
    this.handlers.clear();
  }
}

// 单例实例
export const eventBus = new EventBus();
