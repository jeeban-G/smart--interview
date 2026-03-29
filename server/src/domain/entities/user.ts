// domain/entities/user.ts

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  nickname?: string;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  nickname?: string;
}
