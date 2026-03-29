// application/use-cases/agent/update-agent.ts
import {
  IAgentRepository,
  Agent,
  UpdateAgentInput,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export class UpdateAgentUseCase {
  private agentRepository: IAgentRepository;

  constructor(container: IServiceContainer) {
    this.agentRepository = container.agentRepository;
  }

  async execute(
    id: number,
    userId: number,
    data: UpdateAgentInput
  ): Promise<Agent | null> {
    return this.agentRepository.update(id, userId, data);
  }
}
