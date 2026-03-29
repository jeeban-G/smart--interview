// domain/repositories/agent.repository.ts
import { Agent, CreateAgentInput, UpdateAgentInput } from '../entities/agent';

export interface IAgentRepository {
  create(data: CreateAgentInput): Promise<Agent>;
  findById(id: number): Promise<Agent | null>;
  findByUserId(userId: number): Promise<Agent[]>;
  update(id: number, userId: number, data: UpdateAgentInput): Promise<Agent | null>;
  delete(id: number, userId: number): Promise<boolean>;
}
