import { getDb, saveDb } from '../db/index.js';

interface InterviewFeedback {
  id: number;
  interview_id: number;
  round: number;
  type: 'realtime' | 'summary';
  content: string;
  created_at: string;
}

function rowToFeedback(row: any[]): InterviewFeedback {
  return {
    id: row[0] as number,
    interview_id: row[1] as number,
    round: row[2] as number,
    type: row[3] as 'realtime' | 'summary',
    content: row[4] as string,
    created_at: row[5] as string,
  };
}

export const feedbackService = {
  create(interviewId: number, round: number, type: string, content: string): InterviewFeedback {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO interview_feedbacks (interview_id, round, type, content)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([interviewId, round, type, content]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    return this.getById(id)!;
  },

  getById(id: number): InterviewFeedback | null {
    const db = getDb();
    if (!db) return null;
    const stmt = db.prepare('SELECT * FROM interview_feedbacks WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as number,
      interview_id: row.interview_id as number,
      round: row.round as number,
      type: row.type as 'realtime' | 'summary',
      content: row.content as string,
      created_at: row.created_at as string,
    };
  },

  getByInterviewId(interviewId: number): InterviewFeedback[] {
    const db = getDb();
    if (!db) return [];
    const stmt = db.prepare('SELECT * FROM interview_feedbacks WHERE interview_id = ? ORDER BY round ASC, created_at ASC');
    stmt.bind([interviewId]);
    const feedbacks: InterviewFeedback[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      feedbacks.push({
        id: row.id as number,
        interview_id: row.interview_id as number,
        round: row.round as number,
        type: row.type as 'realtime' | 'summary',
        content: row.content as string,
        created_at: row.created_at as string,
      });
    }
    stmt.free();
    return feedbacks;
  },
};