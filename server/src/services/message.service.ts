import { getDb, saveDb } from '../db/index.js';

export interface Message {
  id: number;
  interview_id: number;
  sender_type: string;
  sender_name: string | null;
  content: string;
  timestamp: string;
}

function rowToMessage(row: any[]): Message {
  return {
    id: row[0] as number,
    interview_id: row[1] as number,
    sender_type: row[2] as string,
    sender_name: row[3] as string | null,
    content: row[4] as string,
    timestamp: row[5] as string,
  };
}

export const messageService = {
  create(interviewId: number, senderType: string, senderName: string | null, content: string): Message {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(
      'INSERT INTO messages (interview_id, sender_type, sender_name, content) VALUES (?, ?, ?, ?)'
    );
    stmt.run([interviewId, senderType, senderName, content]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;

    return {
      id,
      interview_id: interviewId,
      sender_type: senderType,
      sender_name: senderName,
      content,
      timestamp: new Date().toISOString(),
    };
  },

  getByInterviewId(interviewId: number): Message[] {
    const db = getDb();
    if (!db) return [];

    const stmt = db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY timestamp ASC');
    stmt.bind([interviewId]);
    const messages: Message[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      messages.push({
        id: row.id as number,
        interview_id: row.interview_id as number,
        sender_type: row.sender_type as string,
        sender_name: row.sender_name as string | null,
        content: row.content as string,
        timestamp: row.timestamp as string,
      });
    }
    stmt.free();
    return messages;
  },

  getById(id: number): Message | null {
    const db = getDb();
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
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
      sender_type: row.sender_type as string,
      sender_name: row.sender_name as string | null,
      content: row.content as string,
      timestamp: row.timestamp as string,
    };
  },

  deleteByInterviewId(interviewId: number): void {
    const db = getDb();
    if (!db) return;

    const stmt = db.prepare('DELETE FROM messages WHERE interview_id = ?');
    stmt.run([interviewId]);
    stmt.free();
    saveDb();
  },

  getConversationHistory(interviewId: number): string {
    const messages = this.getByInterviewId(interviewId);
    return messages
      .map(m => `${m.sender_name || m.sender_type}: ${m.content}`)
      .join('\n');
  },
};
