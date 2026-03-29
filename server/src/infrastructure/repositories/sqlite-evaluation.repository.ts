// infrastructure/repositories/sqlite-evaluation.repository.ts
import {
  IEvaluationRepository,
  Evaluation,
  CreateEvaluationInput,
} from '../../domain/index.js';
import { IDatabaseConnection } from '../database/connection.js';

export class SQLiteEvaluationRepository implements IEvaluationRepository {
  constructor(private dbConnection: IDatabaseConnection) {}

  private get db() {
    return this.dbConnection.getDb();
  }

  private save() {
    this.dbConnection.save();
  }

  private rowToEvaluation(row: any): Evaluation {
    return {
      id: row.id,
      interviewId: row.interview_id,
      summary: row.summary,
      highlights: row.highlights ? JSON.parse(row.highlights) : [],
      pros: row.pros,
      cons: row.cons,
      suggestions: row.suggestions,
      overallScore: row.overall_score,
      technicalDepth: row.technical_depth,
      communication: row.communication,
      projectExperience: row.project_experience,
      adaptability: row.adaptability,
      createdAt: new Date(row.created_at),
    };
  }

  async create(data: CreateEvaluationInput): Promise<Evaluation> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO evaluations
      (interview_id, summary, highlights, pros, cons, suggestions, overall_score, technical_depth, communication, project_experience, adaptability)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      data.interviewId,
      data.summary,
      JSON.stringify(data.highlights),
      data.pros,
      data.cons,
      data.suggestions,
      data.overallScore || null,
      data.technicalDepth || null,
      data.communication || null,
      data.projectExperience || null,
      data.adaptability || null,
    ]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    this.save();

    const evaluation = await this.findById(id);
    if (!evaluation) throw new Error('Failed to create evaluation');
    return evaluation;
  }

  async findById(id: number): Promise<Evaluation | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM evaluations WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToEvaluation(row);
  }

  async findByInterviewId(interviewId: number): Promise<Evaluation | null> {
    const db = this.db;
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?');
    stmt.bind([interviewId]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return this.rowToEvaluation(row);
  }

  async update(id: number, data: Partial<Evaluation>): Promise<Evaluation | null> {
    const db = this.db;
    if (!db) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.summary !== undefined) { fields.push('summary = ?'); values.push(data.summary); }
    if (data.pros !== undefined) { fields.push('pros = ?'); values.push(data.pros); }
    if (data.cons !== undefined) { fields.push('cons = ?'); values.push(data.cons); }
    if (data.suggestions !== undefined) { fields.push('suggestions = ?'); values.push(data.suggestions); }
    if (data.overallScore !== undefined) { fields.push('overall_score = ?'); values.push(data.overallScore); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    db.run(`UPDATE evaluations SET ${fields.join(', ')} WHERE id = ?`, values);
    this.save();

    return this.findById(id);
  }

  async deleteByInterviewId(interviewId: number): Promise<void> {
    const db = this.db;
    if (!db) return;

    db.run('DELETE FROM evaluations WHERE interview_id = ?', [interviewId]);
    this.save();
  }

  async delete(id: number): Promise<boolean> {
    const db = this.db;
    if (!db) return false;

    try {
      db.run('DELETE FROM evaluations WHERE id = ?', [id]);
      this.save();
      return true;
    } catch {
      return false;
    }
  }
}