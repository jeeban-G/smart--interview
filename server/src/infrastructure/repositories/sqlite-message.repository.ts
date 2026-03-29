// infrastructure/repositories/sqlite-message.repository.ts
import {
  IMessageRepository,
  Message,
  CreateMessageInput,
} from '../../domain/index.js';
import { IDatabaseConnection } from '../database/connection.js';

export class SQLiteMessageRepository implements IMessageRepository {
  constructor(private dbConnection: IDatabaseConnection) {}

  private get db() {
    return this.dbConnection.getDb();
  }

  private save() {
    this.dbConnection.save();
  }

  private rowToMessage(row: any): Message {
    return {
      id: row.id,
      interviewId: row.interview_id,
      senderType: row.sender_type,
      senderName: row.sender_name,
      content: row.content,
      timestamp: new Date(row.timestamp),
    };
  }

  async create(data: CreateMessageInput): Promise<Message> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO messages (interview_id, sender_type, sender_name, content)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([
      data.interviewId,
      data.senderType,
      data.senderName,
      data.content,
    ]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    this.save();

    const message = await this.findById(id);
    if (!message) throw new Error('Failed to create message');
    return message;
  }

  async findById(id: number): Promise<Message | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToMessage(row);
  }

  async findByInterviewId(interviewId: number): Promise<Message[]> {
    const db = this.db;
    if (!db) return [];

    const stmt = db.prepare(
      'SELECT * FROM messages WHERE interview_id = ? ORDER BY timestamp ASC'
    );
    stmt.bind([interviewId]);
    const messages: Message[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      messages.push(this.rowToMessage(row));
    }
    stmt.free();
    return messages;
  }

  async deleteByInterviewId(interviewId: number): Promise<void> {
    const db = this.db;
    if (!db) return;

    db.run('DELETE FROM messages WHERE interview_id = ?', [interviewId]);
    this.save();
  }

  async getConversationHistory(interviewId: number): Promise<string> {
    const messages = await this.findByInterviewId(interviewId);
    return messages
      .map((m) => `${m.senderName || m.senderType}: ${m.content}`)
      .join('\n');
  }
}