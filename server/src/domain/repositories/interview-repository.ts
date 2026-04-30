import { Interview } from '../entities/interview.js';

export interface IInterviewRepository {
  create(data: Omit<Interview, 'id' | 'created_at'>): Promise<Interview>;
  getById(id: number): Promise<Interview | null>;
  getByRoomCode(roomCode: string): Promise<Interview | null>;
  getByUserId(userId: number): Promise<Interview[]>;
  update(id: number, data: Partial<Interview>): Promise<void>;
  delete(id: number): Promise<void>;
  countActiveByUserId(userId: number): Promise<number>;
}
