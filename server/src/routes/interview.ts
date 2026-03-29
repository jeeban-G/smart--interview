import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { interviewService } from '../services/interview.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

// SSE clients per interview ID
const clients = new Map<number, Set<import('express').Response>>();

// SSE endpoint for interview events (auth via query param since EventSource doesn't support headers)
router.get('/:id/events', (req, res) => {
  const id = parseInt(req.params.id);

  // Validate token from query param (EventSource can't use headers)
  const token = req.query.token as string;
  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '未登录' }));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    const userId = decoded.userId;

    // Verify user has access to this interview
    const interview = interviewService.getById(id);
    if (!interview) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '面试不存在' }));
      return;
    }
    if (interview.user_id !== userId) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '无权访问此面试' }));
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Add client to this interview's subscriber set
    if (!clients.has(id)) clients.set(id, new Set());
    clients.get(id)!.add(res);

    // Send heartbeat every 30s
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients.get(id)?.delete(res);
    });
  } catch {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '无效的token' }));
  }
});

// Export clients map for use by service/index
export { clients };

// 获取活跃房间状态
router.get('/rooms', (req, res) => {
  const activeCount = interviewService.getActiveRoomCount();
  res.json({
    active: activeCount,
    max: 10,
    available: activeCount < 10
  });
});

// 获取职位列表
router.get('/positions', (req, res) => {
  const positions = [
    // 字节跳动
    { id: 'bd-fe-001', name: '字节跳动', position: '前端工程师', tag: '急招', salary: '35-70K·16薪', location: '北京' },
    { id: 'bd-be-001', name: '字节跳动', position: '后端工程师', tag: '急招', salary: '40-75K·16薪', location: '北京' },
    { id: 'bd-alg-001', name: '字节跳动', position: '算法工程师', tag: '急招', salary: '50-90K·16薪', location: '北京' },

    // 阿里巴巴
    { id: 'ali-fe-001', name: '阿里巴巴', position: '前端工程师', tag: '已发布', salary: '30-55K·16薪', location: '杭州' },
    { id: 'ali-be-001', name: '阿里巴巴', position: 'Java开发工程师', tag: '已发布', salary: '32-58K·16薪', location: '杭州' },
    { id: 'ali-alg-001', name: '阿里巴巴', position: '算法工程师', tag: '急招', salary: '45-80K·16薪', location: '杭州' },
    { id: 'ali-product-001', name: '阿里巴巴', position: '产品经理', tag: '已发布', salary: '28-50K·16薪', location: '杭州' },

    // 腾讯
    { id: 'tx-fe-001', name: '腾讯', position: '前端工程师', tag: '已发布', salary: '28-55K·14薪', location: '深圳' },
    { id: 'tx-be-001', name: '腾讯', position: '后台开发工程师', tag: '已发布', salary: '30-58K·14薪', location: '深圳' },
    { id: 'tx-alg-001', name: '腾讯', position: 'AI算法工程师', tag: '急招', salary: '40-75K·14薪', location: '深圳' },

    // 美团
    { id: 'mt-fe-001', name: '美团', position: '前端工程师', tag: '已发布', salary: '25-48K·15薪', location: '北京' },
    { id: 'mt-be-001', name: '美团', position: '后端工程师', tag: '已发布', salary: '27-50K·15薪', location: '北京' },
    { id: 'mt-alg-001', name: '美团', position: '算法工程师', tag: '急招', salary: '35-65K·15薪', location: '北京' },

    // 京东
    { id: 'jd-fe-001', name: '京东', position: '前端工程师', tag: '已发布', salary: '22-42K·18薪', location: '北京' },
    { id: 'jd-be-001', name: '京东', position: '后端工程师', tag: '已发布', salary: '25-48K·18薪', location: '北京' },
    { id: 'jd-alg-001', name: '京东', position: '算法工程师', tag: '急招', salary: '35-60K·18薪', location: '北京' },

    // 百度
    { id: 'bd-ft-001', name: '百度', position: '前端工程师', tag: '已发布', salary: '25-48K·14薪', location: '北京' },
    { id: 'bd-ft-003', name: '百度', position: '后端工程师', tag: '已发布', salary: '28-52K·14薪', location: '北京' },
    { id: 'bd-ft-alg-001', name: '百度', position: '算法工程师', tag: '急招', salary: '40-70K·14薪', location: '北京' },

    // 小米
    { id: 'xm-fe-001', name: '小米', position: '前端工程师', tag: '已发布', salary: '20-40K·14薪', location: '北京' },
    { id: 'xm-be-001', name: '小米', position: '后端工程师', tag: '已发布', salary: '22-45K·14薪', location: '北京' },
    { id: 'xm-alg-001', name: '小米', position: '算法工程师', tag: '已发布', salary: '30-55K·14薪', location: '北京' },

    // 华为
    { id: 'hw-fe-001', name: '华为', position: '前端工程师', tag: '已发布', salary: '25-48K·15薪', location: '杭州' },
    { id: 'hw-be-001', name: '华为', position: '后端工程师', tag: '已发布', salary: '28-55K·15薪', location: '深圳' },
    { id: 'hw-alg-001', name: '华为', position: '算法工程师', tag: '急招', salary: '35-65K·15薪', location: '深圳' },

    // 快手
    { id: 'ks-fe-001', name: '快手', position: '前端工程师', tag: '已发布', salary: '28-50K·16薪', location: '北京' },
    { id: 'ks-be-001', name: '快手', position: '后端工程师', tag: '已发布', salary: '30-55K·16薪', location: '北京' },
    { id: 'ks-alg-001', name: '快手', position: '推荐算法工程师', tag: '急招', salary: '45-75K·16薪', location: '北京' },

    // 网易
    { id: 'wy-fe-001', name: '网易', position: '前端工程师', tag: '已发布', salary: '22-42K·16薪', location: '杭州' },
    { id: 'wy-be-001', name: '网易', position: '后端工程师', tag: '已发布', salary: '24-45K·16薪', location: '杭州' },
    { id: 'wy-alg-001', name: '网易', position: '算法工程师', tag: '已发布', salary: '32-55K·16薪', location: '杭州' },

    // 滴滴
    { id: 'dd-fe-001', name: '滴滴', position: '前端工程师', tag: '已发布', salary: '22-40K·15薪', location: '北京' },
    { id: 'dd-be-001', name: '滴滴', position: '后端工程师', tag: '已发布', salary: '25-48K·15薪', location: '北京' },

    // 拼多多
    { id: 'pdd-fe-001', name: '拼多多', position: '前端工程师', tag: '已发布', salary: '35-60K·12薪', location: '上海' },
    { id: 'pdd-be-001', name: '拼多多', position: '后端工程师', tag: '已发布', salary: '40-70K·12薪', location: '上海' },
  ];
  res.json(positions);
});

// 创建面试
router.post('/create', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { type, position, candidate_agent_id, interviewer_agent_id } = req.body;
    console.log(`[Create] Creating interview: type=${type}, position=${position}, candidate_agent_id=${candidate_agent_id}, interviewer_agent_id=${interviewer_agent_id}`);
    if (!type || !position) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    if (!['group', 'single'].includes(type)) {
      return res.status(400).json({ error: '无效的面试类型' });
    }

    try {
      const interview = interviewService.create(req.userId!, type, position, candidate_agent_id, interviewer_agent_id);
      console.log(`[Create] Interview created with id=${interview.id}`);

      // 如果同时有候选人和面试官 Agent，自动开始对话
      if (candidate_agent_id && interviewer_agent_id) {
        console.log(`[Create] Starting background chat for interview ${interview.id}`);
        // Start background conversation (runs on server, pushes via SSE)
        setTimeout(() => interviewService.startBackgroundChat(interview.id), 100);
        res.json(interview);
      } else {
        res.json(interview);
      }
    } catch (err: any) {
      if (err.message.includes('已达上限')) {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: '创建面试失败' });
  }
});

// 获取面试历史 - 必须在 /:id 前面
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const interviews = interviewService.getHistory(req.userId!);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: '获取历史失败' });
  }
});

// 根据房间码获取面试
router.get('/room/:code', (req, res) => {
  try {
    const interview = interviewService.getByRoomCode(req.params.code);
    if (!interview) {
      return res.status(404).json({ error: '房间不存在' });
    }
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: '获取房间失败' });
  }
});

// 获取面试详情
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: '获取面试失败' });
  }
});

// 发送消息
router.post('/:id/message', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const { content, sender_type, sender_name } = req.body;
    const resolvedSenderType = sender_type || 'user';

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ error: '面试已结束' });
    }

    // 保存用户消息
    const message = interviewService.addMessage(id, resolvedSenderType, sender_name || '我', content);

    // 检查是否是两个 Agent 之间的对话
    const isAgentChat = interview.candidate_agent_id && interview.interviewer_agent_id;

    // 如果是用户消息，生成 AI 回复
    if (resolvedSenderType === 'user') {
      const replyMessage = await interviewService.generateInterviewerResponseMessage(id);
      res.json({ message, replyMessage });
    } else if (isAgentChat) {
      // 如果是 Agent 之间的对话，根据发送方确定回复方
      if (resolvedSenderType === 'ai_candidate') {
        // 候选人发的，面试官回复（同步）
        const replyMessage = await interviewService.generateInterviewerResponseMessage(id);
        res.json({ message, replyMessage });
      } else if (resolvedSenderType === 'ai_interviewer') {
        // 面试官发的，候选人回复（同步）
        const replyMessage = await interviewService.generateCandidateResponseMessage(id);
        res.json({ message, replyMessage });
      } else {
        res.json({ message });
      }
    } else {
      res.json({ message });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

// 触发下一个 Agent 回复（用于轮询获取 Agent 自动回复）
router.get('/:id/next', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    // 返回最新的消息列表
    const messages = interviewService.getMessages(id);
    res.json({ messages });
  } catch (error) {
    console.error('Get next error:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 继续 Agent 多轮对话
router.post('/:id/continue', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ error: '面试已结束' });
    }

    // 继续对话
    const result = await interviewService.continueAgentChat(id);
    res.json(result);
  } catch (error) {
    console.error('Continue chat error:', error);
    res.status(500).json({ error: '继续对话失败' });
  }
});

// 获取对话状态（是否应该继续）
router.get('/:id/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    const shouldContinue = interviewService.shouldContinueInterview(id);
    res.json({
      status: interview.status,
      ...shouldContinue
    });
  } catch (error) {
    res.status(500).json({ error: '获取状态失败' });
  }
});

// 获取消息列表
router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    const messages = interviewService.getMessages(id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: '获取消息失败' });
  }
});

// 获取评估
router.get('/:id/eval', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    // 先检查是否已有评估
    let evaluation = interviewService.getEvaluation(id);

    // 如果没有评估且面试已完成，生成评估
    if (!evaluation && interview.status === 'completed') {
      evaluation = await interviewService.generateEvaluation(id);
    }

    if (!evaluation) {
      return res.status(400).json({ error: '面试未结束或评估未生成' });
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({ error: '获取评估失败' });
  }
});

// 结束面试
router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    interviewService.complete(id);

    // 生成评估
    const evaluation = await interviewService.generateEvaluation(id);

    res.json({ message: '面试已结束', evaluation });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: '结束面试失败' });
  }
});

// 开始面试（触发后台对话）
router.post('/:id/start', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限访问此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ error: '面试已结束' });
    }

    // 检查是否已经有消息，有的话继续对话，没有才启动新对话
    const messages = interviewService.getMessages(id);
    if (messages.length > 0) {
      // 已经有消息，继续对话
      interviewService.continueBackgroundChat(id);
      res.json({ message: '面试已继续' });
    } else {
      // 没有消息，启动新对话
      interviewService.startBackgroundChat(id);
      res.json({ message: '面试已开始' });
    }
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: '开始面试失败' });
  }
});

// 暂停面试
router.post('/:id/pause', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }
    interviewService.pauseChat(id);
    res.json({ message: '面试已暂停' });
  } catch (error) {
    console.error('Pause interview error:', error);
    res.status(500).json({ error: '暂停面试失败' });
  }
});

// 继续面试
router.post('/:id/resume', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }
    interviewService.resumeChat(id);
    res.json({ message: '面试已继续' });
  } catch (error) {
    console.error('Resume interview error:', error);
    res.status(500).json({ error: '继续面试失败' });
  }
});

// 删除面试
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    // 验证用户是否有权限删除此面试
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权删除此面试' });
    }

    const success = interviewService.delete(id);
    if (success) {
      res.json({ message: '删除成功' });
    } else {
      res.status(500).json({ error: '删除失败' });
    }
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// Get feedback for an interview
router.get('/:id/feedback', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }
    const { feedbackService } = await import('../services/feedback.service.js');
    const feedbacks = feedbackService.getByInterviewId(id);
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// Add coaching log
router.post('/:id/coaching', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    const { coaching_type, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '指导内容不能为空' });
    }
    const { coachingService } = await import('../services/coaching.service.js');
    const log = coachingService.create(id, req.userId!, coaching_type || 'info_request', content);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: '记录指导失败' });
  }
});

// Get coaching logs for an interview
router.get('/:id/coaching', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }
    const { coachingService } = await import('../services/coaching.service.js');
    const logs = coachingService.getByInterviewId(id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '获取指导记录失败' });
  }
});

// Process coaching guidance
router.post('/:id/coach', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的面试ID' });
    }
    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }
    if (interview.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此面试' });
    }

    const { content } = req.body;

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '指导内容不能为空' });
    }

    const result = await interviewService.processCoaching(id, content);

    // Record the coaching log
    const coachingType = content.includes('补充') || content.includes('例子') ? 'guide' :
                         content.includes('纠正') || content.includes('不对') ? 'correct' : 'info_request';
    const { coachingService } = await import('../services/coaching.service.js');

    try {
      const log = coachingService.create(id, req.userId!, coachingType, content);
      if (log) {
        coachingService.updateResponse(log.id, result.accepted ? 'accepted' : 'rejected', result.reason);
      }
    } catch (dbError) {
      console.error('Failed to record coaching log:', dbError);
      // Continue anyway - the result is what matters
    }

    res.json(result);
  } catch (error) {
    console.error('Coach error:', error);
    res.status(500).json({ error: '处理指导失败' });
  }
});

export default router;
