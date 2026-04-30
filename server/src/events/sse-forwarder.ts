import { EventEmitter } from 'events';
import { Response } from 'express';

interface SSEClients {
  get(interviewId: number): Set<Response> | undefined;
}

/**
 * 发送 SSE 事件给指定面试的所有客户端
 */
function broadcastToClients(
  clients: SSEClients,
  interviewId: number,
  data: Record<string, unknown>
): void {
  const interviewClients = clients.get(interviewId);
  if (!interviewClients) return;

  const serialized = JSON.stringify(data);
  interviewClients.forEach(client => {
    client.write(`data: ${serialized}\n\n`);
  });
}

/**
 * 设置 SSE 事件转发
 * 将 interviewService 的事件转发给连接的 SSE 客户端
 */
export function setupSSEEventForwarding(
  interviewService: EventEmitter,
  clients: SSEClients
): void {
  // 消息事件
  interviewService.on('message', ({ interviewId, message, agent }) => {
    broadcastToClients(clients, interviewId, { type: 'message', message, agent });
  });

  // 面试完成事件
  interviewService.on('done', ({ interviewId }) => {
    // 生成评估报告
    (interviewService as any).generateEvaluation(interviewId)
      .then((evaluation: unknown) => {
        broadcastToClients(clients, interviewId, { type: 'done', interviewId, evaluation });
      })
      .catch((err: Error) => {
        console.error('Generate evaluation error:', err);
        broadcastToClients(clients, interviewId, { type: 'done', interviewId });
      });
  });

  // 打字指示事件
  interviewService.on('typing', ({ interviewId, agent }) => {
    broadcastToClients(clients, interviewId, { type: 'typing', agent });
  });

  // 指导采纳事件
  interviewService.on('coaching_accepted', ({ interviewId, original, applied }) => {
    broadcastToClients(clients, interviewId, {
      type: 'coaching_accepted',
      interviewId,
      original,
      applied,
    });
  });

  // 指导拒绝事件
  interviewService.on('coaching_rejected', ({ interviewId, original, reason }) => {
    broadcastToClients(clients, interviewId, {
      type: 'coaching_rejected',
      interviewId,
      original,
      reason,
    });
  });

  // 实时反馈事件
  interviewService.on('feedback', ({ interviewId, round, content }) => {
    broadcastToClients(clients, interviewId, {
      type: 'feedback',
      interviewId,
      round,
      content,
    });
  });

  // 暂停事件
  interviewService.on('paused', ({ interviewId }) => {
    broadcastToClients(clients, interviewId, { type: 'paused', interviewId });
  });

  // 恢复事件
  interviewService.on('resumed', ({ interviewId }) => {
    broadcastToClients(clients, interviewId, { type: 'resumed', interviewId });
  });
}
