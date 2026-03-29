// presentation/controllers/interview.controller.ts
import { Request, Response } from 'express';
import { IServiceContainer } from '../../container/container.js';
import { CreateInterviewUseCase } from '../../application/use-cases/interview/create-interview.js';
import { GetInterviewUseCase } from '../../application/use-cases/interview/get-interview.js';
import { CompleteInterviewUseCase } from '../../application/use-cases/interview/complete-interview.js';
import { SendMessageUseCase } from '../../application/use-cases/interview/send-message.js';
import { GetMessagesUseCase } from '../../application/use-cases/interview/get-messages.js';
import { DeleteInterviewUseCase } from '../../application/use-cases/interview/delete-interview.js';
import { GetEvaluationUseCase } from '../../application/use-cases/interview/get-evaluation.js';
import { InterviewOrchestrator } from '../../application/services/interview-orchestrator.js';

export class InterviewController {
  private createInterviewUseCase: CreateInterviewUseCase;
  private getInterviewUseCase: GetInterviewUseCase;
  private completeInterviewUseCase: CompleteInterviewUseCase;
  private sendMessageUseCase: SendMessageUseCase;
  private getMessagesUseCase: GetMessagesUseCase;
  private deleteInterviewUseCase: DeleteInterviewUseCase;
  private getEvaluationUseCase: GetEvaluationUseCase;
  private orchestrator: InterviewOrchestrator;

  constructor(container: IServiceContainer) {
    this.createInterviewUseCase = new CreateInterviewUseCase(container);
    this.getInterviewUseCase = new GetInterviewUseCase(container);
    this.completeInterviewUseCase = new CompleteInterviewUseCase(container);
    this.sendMessageUseCase = new SendMessageUseCase(container);
    this.getMessagesUseCase = new GetMessagesUseCase(container);
    this.deleteInterviewUseCase = new DeleteInterviewUseCase(container);
    this.getEvaluationUseCase = new GetEvaluationUseCase(container);
    this.orchestrator = new InterviewOrchestrator(container);
  }

  /**
   * 获取职位列表
   */
  getPositions = async (_req: Request, res: Response): Promise<void> => {
    const positions = [
      { id: 'bd-fe-001', name: '字节跳动', position: '前端工程师', tag: '急招', salary: '35-70K·16薪', location: '北京' },
      { id: 'bd-be-001', name: '字节跳动', position: '后端工程师', tag: '急招', salary: '40-75K·16薪', location: '北京' },
      { id: 'bd-alg-001', name: '字节跳动', position: '算法工程师', tag: '急招', salary: '50-90K·16薪', location: '北京' },
      { id: 'ali-fe-001', name: '阿里巴巴', position: '前端工程师', tag: '已发布', salary: '30-55K·16薪', location: '杭州' },
      { id: 'ali-be-001', name: '阿里巴巴', position: 'Java开发工程师', tag: '已发布', salary: '32-58K·16薪', location: '杭州' },
      { id: 'ali-alg-001', name: '阿里巴巴', position: '算法工程师', tag: '急招', salary: '45-80K·16薪', location: '杭州' },
      { id: 'ali-product-001', name: '阿里巴巴', position: '产品经理', tag: '已发布', salary: '28-50K·16薪', location: '杭州' },
      { id: 'tx-fe-001', name: '腾讯', position: '前端工程师', tag: '已发布', salary: '28-55K·14薪', location: '深圳' },
      { id: 'tx-be-001', name: '腾讯', position: '后台开发工程师', tag: '已发布', salary: '30-58K·14薪', location: '深圳' },
      { id: 'tx-alg-001', name: '腾讯', position: 'AI算法工程师', tag: '急招', salary: '40-75K·14薪', location: '深圳' },
      { id: 'mt-fe-001', name: '美团', position: '前端工程师', tag: '已发布', salary: '25-48K·15薪', location: '北京' },
      { id: 'mt-be-001', name: '美团', position: '后端工程师', tag: '已发布', salary: '27-50K·15薪', location: '北京' },
      { id: 'mt-alg-001', name: '美团', position: '算法工程师', tag: '急招', salary: '35-65K·15薪', location: '北京' },
    ];
    res.json(positions);
  };

  /**
   * 获取活跃房间状态
   */
  getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const activeCount = await this.getInterviewUseCase.countActiveByUser(userId);

      res.json({
        active: activeCount,
        max: 10,
        available: activeCount < 10,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * 根据房间码获取面试
   */
  getByRoomCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const interview = await this.getInterviewUseCase.executeByRoomCode(req.params.code);
      if (!interview) {
        res.status(404).json({ error: '房间不存在' });
        return;
      }
      res.json({ success: true, data: interview });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * 创建面试
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const { type, position, candidateAgentId, interviewerAgentId } = req.body;

      if (!type || !position) {
        res.status(400).json({ success: false, error: '缺少必要参数' });
        return;
      }

      if (!['group', 'single'].includes(type)) {
        res.status(400).json({ success: false, error: '无效的面试类型' });
        return;
      }

      const interview = await this.createInterviewUseCase.execute({
        userId,
        type,
        position,
        candidateAgentId,
        interviewerAgentId,
      });

      // 如果同时有候选人和面试官 Agent，自动开始对话
      if (candidateAgentId && interviewerAgentId) {
        setTimeout(() => this.orchestrator.startInterview(interview.id), 100);
      }

      res.status(201).json({
        success: true,
        data: interview,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 获取面试列表
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const interviews = await this.getInterviewUseCase.executeByUser(userId);

      res.json({
        success: true,
        data: interviews,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 获取面试详情
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const result = await this.getInterviewUseCase.execute(id);

      if (!result) {
        res.status(404).json({
          success: false,
          error: '面试不存在',
        });
        return;
      }

      // 验证权限
      if (result.interview.userId !== userId) {
        res.status(403).json({
          success: false,
          error: '无权访问此面试',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 发送消息
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const { content, sender_type, sender_name } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, error: '消息内容不能为空' });
        return;
      }

      const result = await this.sendMessageUseCase.execute({
        interviewId: id,
        userId,
        content,
        senderType: sender_type || 'user',
        senderName: sender_name || '我',
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 获取消息列表
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const messages = await this.getMessagesUseCase.execute(id, userId);

      res.json({
        success: true,
        data: messages,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 开始面试（AI 对话）
   */
  start = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);

      // 验证面试存在且用户有权限
      const interview = await this.getInterviewUseCase.execute(id);
      if (!interview) {
        res.status(404).json({ success: false, error: '面试不存在' });
        return;
      }
      if (interview.interview.userId !== userId) {
        res.status(403).json({ success: false, error: '无权访问此面试' });
        return;
      }

      // 异步启动对话
      this.orchestrator.startInterview(id);

      res.json({
        success: true,
        message: '面试已开始',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 暂停面试
   */
  pause = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      this.orchestrator.pauseInterview(id);

      res.json({
        success: true,
        message: '面试已暂停',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 恢复面试
   */
  resume = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      this.orchestrator.resumeInterview(id);

      res.json({
        success: true,
        message: '面试已恢复',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 完成面试
   */
  complete = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);

      // 验证权限
      const interview = await this.getInterviewUseCase.execute(id);
      if (!interview) {
        res.status(404).json({ success: false, error: '面试不存在' });
        return;
      }
      if (interview.interview.userId !== userId) {
        res.status(403).json({ success: false, error: '无权访问此面试' });
        return;
      }

      const result = await this.completeInterviewUseCase.execute(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 获取评估
   */
  getEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);

      const evaluation = await this.getEvaluationUseCase.execute(id, userId);

      if (!evaluation) {
        res.status(400).json({ success: false, error: '评估不存在或面试未结束' });
        return;
      }

      res.json({
        success: true,
        data: evaluation,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * 删除面试
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);

      await this.deleteInterviewUseCase.execute(id, userId);

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}