// presentation/controllers/agent.controller.ts
import { Request, Response } from 'express';
import { IServiceContainer } from '../../container/container.js';
import { CreateAgentUseCase } from '../../application/use-cases/agent/create-agent.js';
import { GetAgentUseCase } from '../../application/use-cases/agent/get-agent.js';
import { UpdateAgentUseCase } from '../../application/use-cases/agent/update-agent.js';
import { DeleteAgentUseCase } from '../../application/use-cases/agent/delete-agent.js';

export class AgentController {
  private createAgentUseCase: CreateAgentUseCase;
  private getAgentUseCase: GetAgentUseCase;
  private updateAgentUseCase: UpdateAgentUseCase;
  private deleteAgentUseCase: DeleteAgentUseCase;

  constructor(container: IServiceContainer) {
    this.createAgentUseCase = new CreateAgentUseCase(container);
    this.getAgentUseCase = new GetAgentUseCase(container);
    this.updateAgentUseCase = new UpdateAgentUseCase(container);
    this.deleteAgentUseCase = new DeleteAgentUseCase(container);
  }

  /**
   * 创建 Agent
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const agent = await this.createAgentUseCase.execute({
        userId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        data: agent,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 获取 Agent 列表
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const agents = await this.getAgentUseCase.executeByUser(userId);

      res.json({
        success: true,
        data: agents,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 获取单个 Agent
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const agent = await this.getAgentUseCase.executeById(id);

      if (!agent) {
        res.status(404).json({
          success: false,
          error: 'Agent 不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: agent,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 更新 Agent
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const agent = await this.updateAgentUseCase.execute(id, userId, req.body);

      if (!agent) {
        res.status(404).json({
          success: false,
          error: 'Agent 不存在或无权修改',
        });
        return;
      }

      res.json({
        success: true,
        data: agent,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 删除 Agent
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const success = await this.deleteAgentUseCase.execute(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Agent 不存在或无权删除',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Agent 已删除',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}
