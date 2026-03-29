// domain/repositories/message.repository.ts
import { Message, CreateMessageInput } from '../entities/message';

export interface IMessageRepository {
  create(data: CreateMessageInput): Promise<Message>;
  findByInterviewId(interviewId: number): Promise<Message[]>;
  findById(id: number): Promise<Message | null>;
  deleteByInterviewId(interviewId: number): Promise<void>;
  getConversationHistory(interviewId: number): Promise<string>;
}
