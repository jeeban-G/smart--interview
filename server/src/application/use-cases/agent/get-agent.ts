// application/use-cases/agent/get-agent.ts
import {
  IAgentRepository,
  Agent,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export class GetAgentUseCase {
  private agentRepository: IAgentRepository;

  constructor(container: IServiceContainer) {
    this.agentRepository = container.agentRepository;
  }

  async executeById(id: number): Promise<Agent | null> {
    return this.agentRepository.findById(id);
  }

  async executeByUser(userId: number): Promise<Agent[]> {
    return this.agentRepository.findByUserId(userId);
  }
}
