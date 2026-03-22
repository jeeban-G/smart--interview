import { Router } from 'express';
import { agentService } from '../services/agent.service.js';

const router = Router();
const DEFAULT_USER_ID = 1;

// 获取所有 Agent
router.get('/', (req, res) => {
  try {
    const agents = agentService.getByUser(DEFAULT_USER_ID);
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: '获取 Agent 失败' });
  }
});

// 获取单个 Agent
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const agent = agentService.getById(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: '获取 Agent 失败' });
  }
});

// 创建 Agent
router.post('/', (req, res) => {
  try {
    const { name, type, education, experience, skills, projects, personality, resume_text, style, specialties, company } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    if (!['candidate', 'interviewer'].includes(type)) {
      return res.status(400).json({ error: '无效的 Agent 类型' });
    }

    const agent = agentService.create(DEFAULT_USER_ID, {
      name,
      type,
      education,
      experience,
      skills,
      projects,
      personality,
      resume_text,
      style,
      specialties,
      company,
    });

    res.json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: '创建 Agent 失败' });
  }
});

// 更新 Agent
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const agent = agentService.update(id, DEFAULT_USER_ID, req.body);
    if (!agent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: '更新 Agent 失败' });
  }
});

// 删除 Agent
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    agentService.delete(id, DEFAULT_USER_ID);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除 Agent 失败' });
  }
});

export default router;