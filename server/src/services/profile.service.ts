import { getDb, saveDb } from '../db/index.js';

interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  target_position: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  projects: string | null;
  personality: string | null;
  preferred_style: 'gentle' | 'strict' | 'coaching';
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: any[]): UserProfile {
  return {
    id: row[0] as number,
    user_id: row[1] as number,
    name: row[2] as string,
    target_position: row[3] as string | null,
    education: row[4] as string | null,
    experience: row[5] as string | null,
    skills: row[6] as string | null,
    projects: row[7] as string | null,
    personality: row[8] as string | null,
    preferred_style: (row[9] as string) as 'gentle' | 'strict' | 'coaching',
    created_at: row[10] as string,
    updated_at: row[11] as string,
  };
}

export const profileService = {
  create(userId: number, data: Partial<UserProfile>): UserProfile {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO user_profiles (user_id, name, target_position, education, experience, skills, projects, personality, preferred_style)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      userId,
      data.name || '',
      data.target_position || null,
      data.education || null,
      data.experience || null,
      data.skills || null,
      data.projects || null,
      data.personality || null,
      data.preferred_style || 'gentle',
    ]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    return this.getById(id)!;
  },

  getById(id: number): UserProfile | null {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM user_profiles WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return rowToProfile(result[0].values[0]);
  },

  getByUserId(userId: number): UserProfile | null {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM user_profiles WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [userId]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return rowToProfile(result[0].values[0]);
  },

  update(id: number, data: Partial<UserProfile>): UserProfile | null {
    const db = getDb();
    if (!db) return null;
    const existing = this.getById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.target_position !== undefined) { fields.push('target_position = ?'); values.push(data.target_position); }
    if (data.education !== undefined) { fields.push('education = ?'); values.push(data.education); }
    if (data.experience !== undefined) { fields.push('experience = ?'); values.push(data.experience); }
    if (data.skills !== undefined) { fields.push('skills = ?'); values.push(data.skills); }
    if (data.projects !== undefined) { fields.push('projects = ?'); values.push(data.projects); }
    if (data.personality !== undefined) { fields.push('personality = ?'); values.push(data.personality); }
    if (data.preferred_style !== undefined) { fields.push('preferred_style = ?'); values.push(data.preferred_style); }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(`UPDATE user_profiles SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();
    return this.getById(id);
  },

  delete(id: number): boolean {
    const db = getDb();
    if (!db) return false;
    db.run('DELETE FROM user_profiles WHERE id = ?', [id]);
    saveDb();
    return true;
  },
};
