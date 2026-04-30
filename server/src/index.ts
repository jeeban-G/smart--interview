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
import { setupSSEEventForwarding } from './events/sse-forwarder.js';
import { errorHandler } from './middleware/error-handler.js';
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

// Setup SSE event forwarding
setupSSEEventForwarding(interviewService, clients);

// Error handling middleware (must be after routes)
app.use(errorHandler);

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
