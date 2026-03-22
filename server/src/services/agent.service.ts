import { getDb, saveDb } from '../db/index.js';

interface Agent {
  id: number;
  user_id: number;
  name: string;
  type: 'candidate' | 'interviewer';
  education?: string;
  experience?: string;
  skills?: string;
  projects?: string;
  personality?: string;
  resume_text?: string;
  style?: string;
  specialties?: string;
  company?: string;
  created_at: string;
}

export const agentService = {
  create(userId: number, data: Partial<Agent> & { name: string; type: 'candidate' | 'interviewer' }) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO agents (user_id, name, type, education, experience, skills, projects, personality, resume_text, style, specialties, company)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      userId,
      data.name,
      data.type,
      data.education || null,
      data.experience || null,
      data.skills || null,
      data.projects || null,
      data.personality || null,
      data.resume_text || null,
      data.style || null,
      data.specialties || null,
      data.company || null,
    ]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;

    return this.getById(id);
  },

  getById(id: number): Agent | null {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec('SELECT * FROM agents WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      user_id: row[1] as number,
      name: row[2] as string,
      type: row[3] as 'candidate' | 'interviewer',
      education: row[4] as string | undefined,
      experience: row[5] as string | undefined,
      skills: row[6] as string | undefined,
      projects: row[7] as string | undefined,
      personality: row[8] as string | undefined,
      resume_text: row[9] as string | undefined,
      style: row[10] as string | undefined,
      specialties: row[11] as string | undefined,
      company: row[12] as string | undefined,
      created_at: row[13] as string,
    };
  },

  getByUser(userId: number): Agent[] {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = db.exec('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      id: row[0] as number,
      user_id: row[1] as number,
      name: row[2] as string,
      type: row[3] as 'candidate' | 'interviewer',
      education: row[4] as string | undefined,
      experience: row[5] as string | undefined,
      skills: row[6] as string | undefined,
      projects: row[7] as string | undefined,
      personality: row[8] as string | undefined,
      resume_text: row[9] as string | undefined,
      style: row[10] as string | undefined,
      specialties: row[11] as string | undefined,
      company: row[12] as string | undefined,
      created_at: row[13] as string,
    }));
  },

  update(id: number, userId: number, data: Partial<Agent>) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.education !== undefined) { fields.push('education = ?'); values.push(data.education); }
    if (data.experience !== undefined) { fields.push('experience = ?'); values.push(data.experience); }
    if (data.skills !== undefined) { fields.push('skills = ?'); values.push(data.skills); }
    if (data.projects !== undefined) { fields.push('projects = ?'); values.push(data.projects); }
    if (data.personality !== undefined) { fields.push('personality = ?'); values.push(data.personality); }
    if (data.resume_text !== undefined) { fields.push('resume_text = ?'); values.push(data.resume_text); }
    if (data.style !== undefined) { fields.push('style = ?'); values.push(data.style); }
    if (data.specialties !== undefined) { fields.push('specialties = ?'); values.push(data.specialties); }
    if (data.company !== undefined) { fields.push('company = ?'); values.push(data.company); }

    if (fields.length === 0) return this.getById(id);

    values.push(id, userId);
    const stmt = db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`);
    stmt.run(values);
    saveDb();

    return this.getById(id);
  },

  delete(id: number, userId: number) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('DELETE FROM agents WHERE id = ? AND user_id = ?');
    stmt.run([id, userId]);
    saveDb();
  },
};