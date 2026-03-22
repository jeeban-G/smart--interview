import { Router } from 'express';

const router = Router();

// 临时：无验证登录，直接返回默认用户
router.post('/login', async (req, res) => {
  const defaultUser = { id: 1, email: 'default@local', nickname: '用户' };
  res.json({ token: 'dummy-token', user: defaultUser });
});

export default router;
