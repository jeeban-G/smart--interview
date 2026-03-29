// application/use-cases/agent/delete-agent.ts
import {
  IAgentRepository,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export class DeleteAgentUseCase {
  private agentRepository: IAgentRepository;

  constructor(container: IServiceContainer) {
    this.agentRepository = container.agentRepository;
  }

  async execute(id: number, userId: number): Promise<boolean> {
    return this.agentRepository.delete(id, userId);
  }
}
