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

    const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
    if (result.length === 0 || result[0].values.length === 0) return null;

    const user = result[0].values[0];
    const userObj = {
      id: user[0] as number,
      email: user[1] as string,
      password_hash: user[2] as string,
      nickname: user[3] as string,
      created_at: user[4] as string
    };

    const valid = bcrypt.compareSync(password, userObj.password_hash);
    if (!valid) return null;

    return { id: userObj.id, email: userObj.email, nickname: userObj.nickname };
  },

  getById(id: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec('SELECT id, email, nickname, created_at FROM users WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;

    const user = result[0].values[0];
    return {
      id: user[0] as number,
      email: user[1] as string,
      nickname: user[2] as string,
      created_at: user[3] as string
    };
  }
};
