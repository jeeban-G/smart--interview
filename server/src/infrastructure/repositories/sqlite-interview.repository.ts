// infrastructure/repositories/sqlite-interview.repository.ts
import {
  IInterviewRepository,
  Interview,
  CreateInterviewInput,
  generateRoomCode,
} from '../../domain/index.js';
import { IDatabaseConnection } from '../database/connection.js';

export class SQLiteInterviewRepository implements IInterviewRepository {
  constructor(private dbConnection: IDatabaseConnection) {}

  private get db() {
    return this.dbConnection.getDb();
  }

  private save() {
    this.dbConnection.save();
  }

  private rowToInterview(row: any): Interview {
    return {
      id: row.id,
      userId: row.user_id,
      roomCode: row.room_code,
      type: row.type,
      position: row.position,
      question: row.question,
      status: row.status,
      duration: row.duration,
      candidateAgentId: row.candidate_agent_id,
      interviewerAgentId: row.interviewer_agent_id,
      createdAt: new Date(row.created_at),
    };
  }

  async create(data: CreateInterviewInput): Promise<Interview> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    // 生成唯一房间码
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
      const checkStmt = db.prepare('SELECT id FROM interviews WHERE room_code = ?');
      checkStmt.bind([roomCode]);
      const exists = checkStmt.step();
      checkStmt.free();
      if (!exists) break;
    } while (true);

    const stmt = db.prepare(
      `INSERT INTO interviews
       (user_id, room_code, type, position, question, status, duration, candidate_agent_id, interviewer_agent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run([
      data.userId,
      roomCode,
      data.type,
      data.position,
      data.question || null,
      'in_progress',
      0,
      data.candidateAgentId || null,
      data.interviewerAgentId || null,
    ]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    this.save();

    const interview = await this.findById(id);
    if (!interview) throw new Error('Failed to create interview');
    return interview;
  }

  async findById(id: number): Promise<Interview | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM interviews WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToInterview(row);
  }

  async findByRoomCode(roomCode: string): Promise<Interview | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM interviews WHERE room_code = ?');
    stmt.bind([roomCode]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToInterview(row);
  }

  async findByUserId(userId: number): Promise<Interview[]> {
    const db = this.db;
    if (!db) return [];

    const stmt = db.prepare('SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC');
    stmt.bind([userId]);
    const interviews: Interview[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      interviews.push(this.rowToInterview(row));
    }
    stmt.free();
    return interviews;
  }

  async update(id: number, data: Partial<Interview>): Promise<Interview | null> {
    const db = this.db;
    if (!db) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration); }
    if (data.question !== undefined) { fields.push('question = ?'); values.push(data.question); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    db.run(`UPDATE interviews SET ${fields.join(', ')} WHERE id = ?`, values);
    this.save();

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = this.db;
    if (!db) return false;

    try {
      db.run('DELETE FROM interviews WHERE id = ?', [id]);
      this.save();
      return true;
    } catch {
      return false;
    }
  }

  async countActiveByUser(userId: number): Promise<number> {
    const db = this.db;
    if (!db) return 0;

    const result = db.exec(
      `SELECT COUNT(*) FROM interviews WHERE user_id = ${userId} AND status = 'in_progress'`
    );
    return (result[0]?.values[0]?.[0] as number) || 0;
  }
}
