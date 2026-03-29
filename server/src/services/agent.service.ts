import { getDb, saveDb } from '../db/index.js';

export interface Agent {
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
    stmt.free();

    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const id = idStmt.getAsObject().id as number;
    idStmt.free();
    saveDb();

    return this.getById(id);
  },

  getById(id: number): Agent | null {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return {
      id: row.id as number,
      user_id: row.user_id as number,
      name: row.name as string,
      type: row.type as 'candidate' | 'interviewer',
      education: row.education as string | undefined,
      experience: row.experience as string | undefined,
      skills: row.skills as string | undefined,
      projects: row.projects as string | undefined,
      personality: row.personality as string | undefined,
      resume_text: row.resume_text as string | undefined,
      style: row.style as string | undefined,
      specialties: row.specialties as string | undefined,
      company: row.company as string | undefined,
      created_at: row.created_at as string,
    };
  },

  getByUser(userId: number): Agent[] {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC');
    stmt.bind([userId]);
    const agents: Agent[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      agents.push({
        id: row.id as number,
        user_id: row.user_id as number,
        name: row.name as string,
        type: row.type as 'candidate' | 'interviewer',
        education: row.education as string | undefined,
        experience: row.experience as string | undefined,
        skills: row.skills as string | undefined,
        projects: row.projects as string | undefined,
        personality: row.personality as string | undefined,
        resume_text: row.resume_text as string | undefined,
        style: row.style as string | undefined,
        specialties: row.specialties as string | undefined,
        company: row.company as string | undefined,
        created_at: row.created_at as string,
      });
    }
    stmt.free();
    return agents;
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