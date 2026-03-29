import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';

// 加载环境变量
dotenv.config();

// 领域层
import { EventTypes } from './domain/services/event-bus.js';

// 基础设施层
import { sqliteConnection } from './infrastructure/database/sqlite/index.js';
import { getConnection } from './infrastructure/database/connection.js';
import { SQLiteInterviewRepository } from './infrastructure/repositories/sqlite-interview.repository.js';
import { SQLiteAgentRepository } from './infrastructure/repositories/sqlite-agent.repository.js';
import { SQLiteMessageRepository } from './infrastructure/repositories/sqlite-message.repository.js';
import { SQLiteEvaluationRepository } from './infrastructure/repositories/sqlite-evaluation.repository.js';
import { SQLiteUserRepository } from './infrastructure/repositories/sqlite-user.repository.js';
import { MiniMaxProvider } from './infrastructure/ai/minimax-provider.js';
import { eventBus } from './infrastructure/event/event-bus.js';
import { consoleLogger } from './infrastructure/logger/console-logger.js';

// 容器
import { setContainer, IServiceContainer } from './container/container.js';

// 路由
import { createInterviewRouter } from './presentation/routes/interview.routes.js';
import { createAgentRouter } from './presentation/routes/agent.routes.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 认证中间件
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// SSE 客户端管理
const sseClients: Map<number, Response[]> = new Map();

// 初始化应用
async function bootstrap() {
  const app = express();
  const server = createServer(app);

  // 中间件
  app.use(cors());
  app.use(express.json());

  // 初始化数据库
  await sqliteConnection.initialize();
  const dbConnection = getConnection();

  // 创建仓储实例
  const interviewRepository = new SQLiteInterviewRepository(dbConnection);
  const agentRepository = new SQLiteAgentRepository(dbConnection);
  const messageRepository = new SQLiteMessageRepository(dbConnection);
  const evaluationRepository = new SQLiteEvaluationRepository(dbConnection);
  const userRepository = new SQLiteUserRepository(dbConnection);

  // 创建 AI 提供商
  const aiProvider = new MiniMaxProvider();

  // 设置依赖注入容器
  const container: IServiceContainer = {
    dbConnection,
    interviewRepository,
    agentRepository,
    messageRepository,
    evaluationRepository,
    userRepository,
    aiProvider,
    eventBus,
    logger: consoleLogger,
  };
  setContainer(container);

  // 设置事件监听，转发到 SSE 客户端
  eventBus.subscribe<{ interviewId: number; message: any; agent: string }>(
    EventTypes.MESSAGE_RECEIVED,
    (event) => {
      const { interviewId, message, agent } = event.payload;
      const clients = sseClients.get(interviewId) || [];
      const data = JSON.stringify({ type: 'message', message, agent });
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  );

  eventBus.subscribe<{ interviewId: number; agent: string }>(
    EventTypes.TYPING_STARTED,
    (event) => {
      const { interviewId, agent } = event.payload;
      const clients = sseClients.get(interviewId) || [];
      const data = JSON.stringify({ type: 'typing', agent });
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  );

  eventBus.subscribe<{ interviewId: number }>(
    EventTypes.INTERVIEW_COMPLETED,
    (event) => {
      const { interviewId } = event.payload;
      const clients = sseClients.get(interviewId) || [];
      const data = JSON.stringify({ type: 'done', interviewId });
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  );

  eventBus.subscribe<{ interviewId: number }>(
    EventTypes.INTERVIEW_PAUSED,
    (event) => {
      const { interviewId } = event.payload;
      const clients = sseClients.get(interviewId) || [];
      const data = JSON.stringify({ type: 'paused', interviewId });
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  );

  eventBus.subscribe<{ interviewId: number }>(
    EventTypes.INTERVIEW_RESUMED,
    (event) => {
      const { interviewId } = event.payload;
      const clients = sseClients.get(interviewId) || [];
      const data = JSON.stringify({ type: 'resumed', interviewId });
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  );

  eventBus.subscribe<{ interviewId: number; round: number; content: string }>(
    EventTypes.FEEDBACK_RECEIVED,
    (event) => {
      const { interviewId, round, content } = event.payload;
      const clients = sseClients.get(interviewId) || [];
      const data = JSON.stringify({ type: 'feedback', interviewId, round, content });
      clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  );

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // SSE 事件流
  app.get('/api/interview/:id/events', async (req, res) => {
    const interviewId = parseInt(req.params.id);
    const token = req.query.token as string;

    let decoded: { userId: number };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '无效的认证令牌' }));
      return;
    }

    // 验证用户有权限访问此面试
    const interview = await interviewRepository.findById(interviewId);
    if (!interview) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '面试不存在' }));
      return;
    }

    if (interview.userId !== decoded.userId) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '无权访问此面试' }));
      return;
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // 发送连接成功消息
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // 添加到客户端列表
    if (!sseClients.has(interviewId)) {
      sseClients.set(interviewId, []);
    }
    sseClients.get(interviewId)!.push(res);

    // 心跳检测
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

    // 清理断开连接的客户端
    req.on('close', () => {
      clearInterval(heartbeat);
      const clients = sseClients.get(interviewId);
      if (clients) {
        const index = clients.indexOf(res);
        if (index !== -1) {
          clients.splice(index, 1);
        }
        if (clients.length === 0) {
          sseClients.delete(interviewId);
        }
      }
    });
  });

  // 认证路由（暂保留原有实现）
  app.use('/api/auth', (await import('./routes/auth.js')).default);

  // 受保护的路由
  app.use('/api/interview', authMiddleware, createInterviewRouter(container));
  app.use('/api/agents', authMiddleware, createAgentRouter(container));

  // 简历路由（暂保留原有实现）
  app.use('/api/profiles', authMiddleware, (await import('./routes/profile.js')).default);

  // 启动服务器
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
