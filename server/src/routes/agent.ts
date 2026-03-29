import { Router } from 'express';
import { agentService } from '../services/agent.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// 获取所有 Agent
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const agents = agentService.getByUser(req.userId!);
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: '获取 Agent 失败' });
  }
});

// 获取单个 Agent
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const agent = agentService.getById(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }
    // Verify ownership
    if (agent.user_id !== req.userId) {
      return res.status(403).json({ error: '无权访问此 Agent' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: '获取 Agent 失败' });
  }
});

// 创建 Agent
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, type, education, experience, skills, projects, personality, resume_text, style, specialties, company } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    if (!['candidate', 'interviewer'].includes(type)) {
      return res.status(400).json({ error: '无效的 Agent 类型' });
    }

    const agent = agentService.create(req.userId!, {
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
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的Agent ID' });
    }
    const agent = agentService.update(id, req.userId!, req.body);
    if (!agent) {
      return res.status(404).json({ error: 'Agent 不存在' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: '更新 Agent 失败' });
  }
});

// 删除 Agent
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的Agent ID' });
    }
    agentService.delete(id, req.userId!);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除 Agent 失败' });
  }
});

export default router;