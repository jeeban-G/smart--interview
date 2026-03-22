import { Router } from 'express';
import { interviewService } from '../services/interview.service.js';

const router = Router();

const DEFAULT_USER_ID = 1;

// SSE clients per interview ID
const clients = new Map<number, Set<import('express').Response>>();

// SSE endpoint for interview events
router.get('/:id/events', (req, res) => {
  const id = parseInt(req.params.id);

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
    { id: 'bd-fe-002', name: '字节跳动', position: '前端工程师', tag: '已发布', salary: '30-55K·16薪', location: '上海' },
    { id: 'bd-be-001', name: '字节跳动', position: '后端工程师', tag: '急招', salary: '40-75K·16薪', location: '北京' },
    { id: 'bd-be-002', name: '字节跳动', position: 'Go开发工程师', tag: '已发布', salary: '38-65K·16薪', location: '杭州' },
    { id: 'bd-alg-001', name: '字节跳动', position: '算法工程师', tag: '急招', salary: '50-90K·16薪', location: '北京' },
    { id: 'bd-alg-002', name: '字节跳动', position: 'NLP算法工程师', tag: '急招', salary: '55-85K·16薪', location: '北京' },
    { id: 'bd-ml-001', name: '字节跳动', position: '机器学习工程师', tag: '已发布', salary: '45-80K·16薪', location: '上海' },
    { id: 'bd-ops-001', name: '字节跳动', position: '运营专员', tag: '已发布', salary: '15-28K·14薪', location: '北京' },

    // 阿里巴巴
    { id: 'ali-fe-001', name: '阿里巴巴', position: '前端工程师', tag: '已发布', salary: '30-55K·16薪', location: '杭州' },
    { id: 'ali-fe-002', name: '阿里巴巴', position: '前端工程师', tag: '已发布', salary: '28-48K·16薪', location: '北京' },
    { id: 'ali-be-001', name: '阿里巴巴', position: 'Java开发工程师', tag: '已发布', salary: '32-58K·16薪', location: '杭州' },
    { id: 'ali-be-002', name: '阿里巴巴', position: '后端工程师', tag: '已发布', salary: '30-52K·16薪', location: '上海' },
    { id: 'ali-alg-001', name: '阿里巴巴', position: '算法工程师', tag: '急招', salary: '45-80K·16薪', location: '杭州' },
    { id: 'ali-cloud-001', name: '阿里云', position: '后端工程师', tag: '已发布', salary: '35-60K·16薪', location: '杭州' },
    { id: 'ali-product-001', name: '阿里巴巴', position: '产品经理', tag: '已发布', salary: '28-50K·16薪', location: '杭州' },

    // 腾讯
    { id: 'tx-fe-001', name: '腾讯', position: '前端工程师', tag: '已发布', salary: '28-55K·14薪', location: '深圳' },
    { id: 'tx-fe-002', name: '腾讯', position: '前端工程师', tag: '已发布', salary: '25-45K·14薪', location: '广州' },
    { id: 'tx-be-001', name: '腾讯', position: '后台开发工程师', tag: '已发布', salary: '30-58K·14薪', location: '深圳' },
    { id: 'tx-be-002', name: '腾讯', position: 'C++后台开发', tag: '已发布', salary: '32-55K·14薪', location: '深圳' },
    { id: 'tx-alg-001', name: '腾讯', position: 'AI算法工程师', tag: '急招', salary: '40-75K·14薪', location: '深圳' },
    { id: 'tx-game-001', name: '腾讯', position: '游戏前端开发', tag: '已发布', salary: '30-50K·14薪', location: '深圳' },
    { id: 'tx-product-001', name: '腾讯', position: '产品经理', tag: '已发布', salary: '25-45K·14薪', location: '深圳' },

    // 美团
    { id: 'mt-fe-001', name: '美团', position: '前端工程师', tag: '已发布', salary: '25-48K·15薪', location: '北京' },
    { id: 'mt-fe-002', name: '美团', position: '前端工程师', tag: '已发布', salary: '22-40K·15薪', location: '上海' },
    { id: 'mt-be-001', name: '美团', position: '后端工程师', tag: '已发布', salary: '27-50K·15薪', location: '北京' },
    { id: 'mt-be-002', name: '美团', position: 'Java开发工程师', tag: '已发布', salary: '25-45K·15薪', location: '深圳' },
    { id: 'mt-alg-001', name: '美团', position: '算法工程师', tag: '急招', salary: '35-65K·15薪', location: '北京' },
    { id: 'mt-data-001', name: '美团', position: '数据工程师', tag: '已发布', salary: '28-50K·15薪', location: '北京' },

    // 京东
    { id: 'jd-fe-001', name: '京东', position: '前端工程师', tag: '已发布', salary: '22-42K·18薪', location: '北京' },
    { id: 'jd-be-001', name: '京东', position: '后端工程师', tag: '已发布', salary: '25-48K·18薪', location: '北京' },
    { id: 'jd-be-002', name: '京东', position: 'Java开发工程师', tag: '已发布', salary: '22-40K·18薪', location: '上海' },
    { id: 'jd-alg-001', name: '京东', position: '算法工程师', tag: '急招', salary: '35-60K·18薪', location: '北京' },

    // 百度
    { id: 'bd-ft-001', name: '百度', position: '前端工程师', tag: '已发布', salary: '25-48K·14薪', location: '北京' },
    { id: 'bd-ft-002', name: '百度', position: '前端工程师', tag: '已发布', salary: '22-40K·14薪', location: '深圳' },
    { id: 'bd-ft-003', name: '百度', position: '后端工程师', tag: '已发布', salary: '28-52K·14薪', location: '北京' },
    { id: 'bd-ft-alg-001', name: '百度', position: '算法工程师', tag: '急招', salary: '40-70K·14薪', location: '北京' },
    { id: 'bd-ft-alg-002', name: '百度', position: '自动驾驶算法工程师', tag: '急招', salary: '50-85K·14薪', location: '北京' },

    // 小米
    { id: 'xm-fe-001', name: '小米', position: '前端工程师', tag: '已发布', salary: '20-40K·14薪', location: '北京' },
    { id: 'xm-be-001', name: '小米', position: '后端工程师', tag: '已发布', salary: '22-45K·14薪', location: '北京' },
    { id: 'xm-alg-001', name: '小米', position: '算法工程师', tag: '已发布', salary: '30-55K·14薪', location: '北京' },

    // 华为
    { id: 'hw-be-001', name: '华为', position: '后端工程师', tag: '已发布', salary: '28-55K·15薪', location: '深圳' },
    { id: 'hw-fe-001', name: '华为', position: '前端工程师', tag: '已发布', salary: '25-48K·15薪', location: '杭州' },
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
    { id: 'dd-alg-001', name: '滴滴', position: '算法工程师', tag: '已发布', salary: '35-60K·15薪', location: '北京' },

    // 拼多多
    { id: 'pdd-fe-001', name: '拼多多', position: '前端工程师', tag: '已发布', salary: '35-60K·12薪', location: '上海' },
    { id: 'pdd-be-001', name: '拼多多', position: '后端工程师', tag: '已发布', salary: '40-70K·12薪', location: '上海' },
    { id: 'pdd-alg-001', name: '拼多多', position: '算法工程师', tag: '急招', salary: '50-80K·12薪', location: '上海' },
  ];
  res.json(positions);
});

// 创建面试
router.post('/create', async (req, res) => {
  try {
    const { type, position, candidate_agent_id, interviewer_agent_id } = req.body;
    if (!type || !position) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    if (!['group', 'single'].includes(type)) {
      return res.status(400).json({ error: '无效的面试类型' });
    }

    try {
      const interview = interviewService.create(DEFAULT_USER_ID, type, position, candidate_agent_id, interviewer_agent_id);

      // 如果同时有候选人和面试官 Agent，自动开始对话
      if (candidate_agent_id && interviewer_agent_id) {
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
router.get('/history', (req, res) => {
  try {
    const interviews = interviewService.getHistory(DEFAULT_USER_ID);
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
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: '获取面试失败' });
  }
});

// 发送消息
router.post('/:id/message', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content, sender_type, sender_name } = req.body;
    const resolvedSenderType = sender_type || 'user';

    const interview = interviewService.getById(id);
    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
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
      const aiResponse = await interviewService.generateAIResponse(id, 'ai_interviewer');
      const aiMessage = interviewService.addMessage(id, 'ai_interviewer', 'AI 面试官', aiResponse);
      res.json({ message, aiMessage });
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
router.get('/:id/next', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
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
router.post('/:id/continue', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
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
router.get('/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
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
router.get('/:id/messages', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
    }

    const messages = interviewService.getMessages(id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: '获取消息失败' });
  }
});

// 获取评估
router.get('/:id/eval', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
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
router.post('/:id/complete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
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

// 删除面试
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const interview = interviewService.getById(id);

    if (!interview) {
      return res.status(404).json({ error: '面试不存在' });
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

export default router;
