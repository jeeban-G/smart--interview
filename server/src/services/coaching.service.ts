import { getDb, saveDb } from '../db/index.js';

interface CoachingLog {
  id: number;
  interview_id: number;
  user_id: number;
  coaching_type: 'guide' | 'correct' | 'info_request';
  content: string;
  agent_response: 'pending' | 'accepted' | 'rejected' | 'question';
  agent_feedback: string | null;
  created_at: string;
}

function rowToLog(row: any[]): CoachingLog {
  return {
    id: row[0] as number,
    interview_id: row[1] as number,
    user_id: row[2] as number,
    coaching_type: row[3] as 'guide' | 'correct' | 'info_request',
    content: row[4] as string,
    agent_response: row[5] as 'pending' | 'accepted' | 'rejected' | 'question',
    agent_feedback: row[6] as string | null,
    created_at: row[7] as string,
  };
}

export const coachingService = {
  create(interviewId: number, userId: number, coachingType: string, content: string): CoachingLog {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO coaching_logs (interview_id, user_id, coaching_type, content, agent_response)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    stmt.run([interviewId, userId, coachingType, content]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    return this.getById(id)!;
  },

  getById(id: number): CoachingLog | null {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM coaching_logs WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    return rowToLog(result[0].values[0]);
  },

  getByInterviewId(interviewId: number): CoachingLog[] {
    const db = getDb();
    if (!db) return [];
    const result = db.exec('SELECT * FROM coaching_logs WHERE interview_id = ? ORDER BY created_at ASC', [interviewId]);
    if (result.length === 0) return [];
    return result[0].values.map(rowToLog);
  },

  updateResponse(id: number, agentResponse: string, agentFeedback: string): CoachingLog | null {
    const db = getDb();
    if (!db) return null;
    db.run('UPDATE coaching_logs SET agent_response = ?, agent_feedback = ? WHERE id = ?', [agentResponse, agentFeedback, id]);
    saveDb();
    return this.getById(id);
  },
};
