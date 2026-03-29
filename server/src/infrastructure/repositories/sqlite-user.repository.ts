// infrastructure/repositories/sqlite-user.repository.ts
import {
  IUserRepository,
  User,
  CreateUserInput,
} from '../../domain/index.js';
import { IDatabaseConnection } from '../database/connection.js';

export class SQLiteUserRepository implements IUserRepository {
  constructor(private dbConnection: IDatabaseConnection) {}

  private get db() {
    return this.dbConnection.getDb();
  }

  private save() {
    this.dbConnection.save();
  }

  private rowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      nickname: row.nickname,
      createdAt: new Date(row.created_at),
    };
  }

  async create(data: CreateUserInput): Promise<User> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, nickname)
      VALUES (?, ?, ?)
    `);
    stmt.run([data.email, data.passwordHash, data.nickname || null]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    this.save();

    const user = await this.findById(id);
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  async findById(id: number): Promise<User | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToUser(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToUser(row);
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const db = this.db;
    if (!db) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.nickname !== undefined) { fields.push('nickname = ?'); values.push(data.nickname); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    this.save();

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = this.db;
    if (!db) return false;

    try {
      db.run('DELETE FROM users WHERE id = ?', [id]);
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}