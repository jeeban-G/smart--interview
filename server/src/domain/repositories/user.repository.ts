// domain/repositories/user.repository.ts
import { User, CreateUserInput } from '../entities/user';

export interface IUserRepository {
  create(data: CreateUserInput): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: number, data: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
}
