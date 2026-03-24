import { Router } from 'express';
import { profileService } from '../services/profile.service.js';

const router = Router();
const DEFAULT_USER_ID = 1;

// GET /profiles - Get current user's profile
router.get('/', (req, res) => {
  try {
    const profile = profileService.getByUserId(DEFAULT_USER_ID);
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
router.post('/', (req, res) => {
  try {
    const { name, target_position, education, experience, skills, projects, personality, preferred_style } = req.body;
    const profile = profileService.create(DEFAULT_USER_ID, {
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
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的画像ID' });
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
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的画像ID' });
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