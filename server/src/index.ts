import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initDb } from './db/index.js';
import { interviewService } from './services/interview.service.js';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import agentRoutes from './routes/agent.js';
import profileRoutes from './routes/profile.js';
import { clients } from './routes/interview.js';
import './config.js'; // Validates required env vars when accessed

dotenv.config();

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/profiles', profileRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SSE event forwarding from interviewService to connected clients
interviewService.on('message', ({ interviewId, message, agent }) => {
  const interviewClients = clients.get(interviewId);
  if (interviewClients) {
    const data = JSON.stringify({ type: 'message', message, agent });
    interviewClients.forEach(client => {
      client.write(`data: ${data}\n\n`);
    });
  }
});

interviewService.on('done', ({ interviewId }) => {
  // 生成评估报告
  interviewService.generateEvaluation(interviewId).then((evaluation) => {
    const interviewClients = clients.get(interviewId);
    if (interviewClients) {
      const data = JSON.stringify({ type: 'done', interviewId, evaluation });
      interviewClients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  }).catch((err) => {
    console.error('Generate evaluation error:', err);
    const interviewClients = clients.get(interviewId);
    if (interviewClients) {
      const data = JSON.stringify({ type: 'done', interviewId });
      interviewClients.forEach(client => {
        client.write(`data: ${data}\n\n`);
      });
    }
  });
});

interviewService.on('typing', ({ interviewId, agent }) => {
  const interviewClients = clients.get(interviewId);
  if (interviewClients) {
    const data = JSON.stringify({ type: 'typing', agent });
    interviewClients.forEach(client => {
      client.write(`data: ${data}\n\n`);
    });
  }
});

interviewService.on('coaching_accepted', ({ interviewId, original, applied }) => {
  const interviewClients = clients.get(interviewId);
  if (interviewClients) {
    const data = JSON.stringify({ type: 'coaching_accepted', interviewId, original, applied });
    interviewClients.forEach(client => {
      client.write(`data: ${data}\n\n`);
    });
  }
});

interviewService.on('coaching_rejected', ({ interviewId, original, reason }) => {
  const interviewClients = clients.get(interviewId);
  if (interviewClients) {
    const data = JSON.stringify({ type: 'coaching_rejected', interviewId, original, reason });
    interviewClients.forEach(client => {
      client.write(`data: ${data}\n\n`);
    });
  }
});

interviewService.on('feedback', ({ interviewId, round, content }) => {
  const interviewClients = clients.get(interviewId);
  if (interviewClients) {
    const data = JSON.stringify({ type: 'feedback', interviewId, round, content });
    interviewClients.forEach(client => {
      client.write(`data: ${data}\n\n`);
    });
  }
});

const PORT = process.env.PORT || 3001;

// 初始化数据库后启动服务器
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
