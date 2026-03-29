import { Router } from 'express';
import { profileService } from '../services/profile.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /profiles - Get current user's profile
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const profile = profileService.getByUserId(req.userId!);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '获取画像失败' });
  }
});

// GET /profiles/:id - Get profile by ID
router.get('/:id', (req, res) => {
  try {
    const profile = profileService.getById(parseInt(req.params.id));
    if (!profile) {
      return res.status(404).json({ error: '画像不存在' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '获取画像失败' });
  }
});

// POST /profiles - Create new profile
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, target_position, education, experience, skills, projects, personality, preferred_style } = req.body;
    const profile = profileService.create(req.userId!, {
      name,
      target_position,
      education,
      experience,
      skills,
      projects,
      personality,
      preferred_style,
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '创建画像失败' });
  }
});

// PUT /profiles/:id - Update profile
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的画像ID' });
    }

    // 验证用户是否有权限更新此 profile
    const existing = profileService.getById(id);
    if (!existing) {
      return res.status(404).json({ error: '画像不存在' });
    }
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: '无权修改此画像' });
    }

    const { name, target_position, education, experience, skills, projects, personality, preferred_style } = req.body;
    const profile = profileService.update(id, {
      name,
      target_position,
      education,
      experience,
      skills,
      projects,
      personality,
      preferred_style,
    });
    if (!profile) {
      return res.status(404).json({ error: '画像不存在' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: '更新画像失败' });
  }
});

// DELETE /profiles/:id - Delete profile
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的画像ID' });
    }

    // 验证用户是否有权限删除此 profile
    const existing = profileService.getById(id);
    if (!existing) {
      return res.status(404).json({ error: '画像不存在' });
    }
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: '无权删除此画像' });
    }

    const success = profileService.delete(id);
    if (!success) {
      return res.status(404).json({ error: '画像不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除画像失败' });
  }
});

export default router;