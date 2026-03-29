// domain/repositories/interview.repository.ts
import { Interview, CreateInterviewInput } from '../entities/interview';

export interface IInterviewRepository {
  create(data: CreateInterviewInput): Promise<Interview>;
  findById(id: number): Promise<Interview | null>;
  findByRoomCode(roomCode: string): Promise<Interview | null>;
  findByUserId(userId: number): Promise<Interview[]>;
  update(id: number, data: Partial<Interview>): Promise<Interview | null>;
  delete(id: number): Promise<boolean>;
  countActiveByUser(userId: number): Promise<number>;
}
