// domain/repositories/evaluation.repository.ts
import { Evaluation, CreateEvaluationInput } from '../entities/evaluation';

export interface IEvaluationRepository {
  create(data: CreateEvaluationInput): Promise<Evaluation>;
  findById(id: number): Promise<Evaluation | null>;
  findByInterviewId(interviewId: number): Promise<Evaluation | null>;
  update(id: number, data: Partial<Evaluation>): Promise<Evaluation | null>;
  deleteByInterviewId(interviewId: number): Promise<void>;
  delete(id: number): Promise<boolean>;
}
