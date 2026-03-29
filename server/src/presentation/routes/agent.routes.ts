// presentation/routes/agent.routes.ts
import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller.js';
import { IServiceContainer } from '../../container/container.js';

export function createAgentRouter(container: IServiceContainer): Router {
  const router = Router();
  const controller = new AgentController(container);

  // 获取 Agent 列表
  router.get('/', controller.list);

  // 创建 Agent
  router.post('/', controller.create);

  // 获取单个 Agent
  router.get('/:id', controller.getById);

  // 更新 Agent
  router.put('/:id', controller.update);

  // 删除 Agent
  router.delete('/:id', controller.delete);

  return router;
}
