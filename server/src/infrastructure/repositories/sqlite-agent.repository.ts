// infrastructure/repositories/sqlite-agent.repository.ts
import {
  IAgentRepository,
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
} from '../../domain/index.js';
import { IDatabaseConnection } from '../database/connection.js';

export class SQLiteAgentRepository implements IAgentRepository {
  constructor(private dbConnection: IDatabaseConnection) {}

  private get db() {
    return this.dbConnection.getDb();
  }

  private save() {
    this.dbConnection.save();
  }

  private rowToAgent(row: any): Agent {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      education: row.education,
      experience: row.experience,
      skills: row.skills,
      projects: row.projects,
      personality: row.personality,
      resumeText: row.resume_text,
      style: row.style,
      specialties: row.specialties,
      company: row.company,
      createdAt: new Date(row.created_at),
    };
  }

  async create(data: CreateAgentInput): Promise<Agent> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO agents
      (user_id, name, type, education, experience, skills, projects, personality, resume_text, style, specialties, company)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.userId,
      data.name,
      data.type,
      data.education || null,
      data.experience || null,
      data.skills || null,
      data.projects || null,
      data.personality || null,
      data.resumeText || null,
      data.style || null,
      data.specialties || null,
      data.company || null,
    ]);
    stmt.free();

    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const id = idStmt.getAsObject().id as number;
    idStmt.free();
    this.save();

    const agent = await this.findById(id);
    if (!agent) throw new Error('Failed to create agent');
    return agent;
  }

  async findById(id: number): Promise<Agent | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToAgent(row);
  }

  async findByUserId(userId: number): Promise<Agent[]> {
    const db = this.db;
    if (!db) return [];

    const stmt = db.prepare('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC');
    stmt.bind([userId]);
    const agents: Agent[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      agents.push(this.rowToAgent(row));
    }
    stmt.free();
    return agents;
  }

  async update(id: number, userId: number, data: UpdateAgentInput): Promise<Agent | null> {
    const db = this.db;
    if (!db) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.education !== undefined) { fields.push('education = ?'); values.push(data.education); }
    if (data.experience !== undefined) { fields.push('experience = ?'); values.push(data.experience); }
    if (data.skills !== undefined) { fields.push('skills = ?'); values.push(data.skills); }
    if (data.projects !== undefined) { fields.push('projects = ?'); values.push(data.projects); }
    if (data.personality !== undefined) { fields.push('personality = ?'); values.push(data.personality); }
    if (data.resumeText !== undefined) { fields.push('resume_text = ?'); values.push(data.resumeText); }
    if (data.style !== undefined) { fields.push('style = ?'); values.push(data.style); }
    if (data.specialties !== undefined) { fields.push('specialties = ?'); values.push(data.specialties); }
    if (data.company !== undefined) { fields.push('company = ?'); values.push(data.company); }

    if (fields.length === 0) return this.findById(id);

    values.push(id, userId);
    const stmt = db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`);
    stmt.run(values);
    stmt.free();
    this.save();

    return this.findById(id);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const db = this.db;
    if (!db) return false;

    try {
      const stmt = db.prepare('DELETE FROM agents WHERE id = ? AND user_id = ?');
      stmt.run([id, userId]);
      stmt.free();
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}