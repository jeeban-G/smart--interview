// application/use-cases/agent/create-agent.ts
import {
  IAgentRepository,
  Agent,
  CreateAgentInput,
} from '../../../domain/index.js';
import { IServiceContainer } from '../../../container/container.js';

export interface CreateAgentRequest {
  userId: number;
  name: string;
  type: 'candidate' | 'interviewer';
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  resumeText?: string;
  style?: string;
  specialties?: string;
  company?: string;
}

export class CreateAgentUseCase {
  private agentRepository: IAgentRepository;

  constructor(container: IServiceContainer) {
    this.agentRepository = container.agentRepository;
  }

  async execute(request: CreateAgentRequest): Promise<Agent> {
    const input: CreateAgentInput = {
      userId: request.userId,
      name: request.name,
      type: request.type,
      education: request.education,
      experience: request.experience,
      skills: request.skills,
      projects: request.projects,
      personality: request.personality,
      resumeText: request.resumeText,
      style: request.style,
      specialties: request.specialties,
      company: request.company,
    };

    return this.agentRepository.create(input);
  }
}
