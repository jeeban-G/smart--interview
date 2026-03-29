import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db/index.js';

export const userService = {
  register(email: string, password: string, nickname?: string) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const password_hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)');
    try {
      stmt.run([email, password_hash, nickname || email.split('@')[0]]);
      const result = db.exec('SELECT last_insert_rowid() as id');
      const id = result[0]?.values[0]?.[0];
      saveDb();
      return { id, email, nickname: nickname || email.split('@')[0] };
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('UNIQUE constraint failed');
      }
      throw error;
    }
  },

  login(email: string, password: string) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const user = stmt.getAsObject();
    stmt.free();

    const userObj = {
      id: user.id as number,
      email: user.email as string,
      password_hash: user.password_hash as string,
      nickname: user.nickname as string,
      created_at: user.created_at as string
    };

    const valid = bcrypt.compareSync(password, userObj.password_hash);
    if (!valid) return null;

    return { id: userObj.id, email: userObj.email, nickname: userObj.nickname };
  },

  getById(id: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT id, email, nickname, created_at FROM users WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const user = stmt.getAsObject();
    stmt.free();

    return {
      id: user.id as number,
      email: user.email as string,
      nickname: user.nickname as string,
      created_at: user.created_at as string
    };
  }
};
