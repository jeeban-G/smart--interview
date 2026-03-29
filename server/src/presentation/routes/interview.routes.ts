// presentation/routes/interview.routes.ts
import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller.js';
import { IServiceContainer } from '../../container/container.js';

export function createInterviewRouter(container: IServiceContainer): Router {
  const router = Router();
  const controller = new InterviewController(container);

  // 获取职位列表
  router.get('/positions', controller.getPositions);

  // 获取活跃房间状态
  router.get('/rooms', controller.getRooms);

  // 根据房间码获取面试
  router.get('/room/:code', controller.getByRoomCode);

  // 创建面试
  router.post('/create', controller.create);

  // 获取面试列表
  router.get('/history', controller.list);

  // 获取面试详情
  router.get('/:id', controller.getById);

  // 发送消息
  router.post('/:id/message', controller.sendMessage);

  // 获取消息列表
  router.get('/:id/messages', controller.getMessages);

  // 开始面试
  router.post('/:id/start', controller.start);

  // 暂停面试
  router.post('/:id/pause', controller.pause);

  // 恢复面试
  router.post('/:id/resume', controller.resume);

  // 完成面试
  router.post('/:id/complete', controller.complete);

  // 获取评估
  router.get('/:id/eval', controller.getEvaluation);

  // 删除面试
  router.delete('/:id', controller.delete);

  return router;
}