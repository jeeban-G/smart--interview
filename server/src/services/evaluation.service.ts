import { getDb, saveDb } from '../db/index.js';
import { aiService, callMiniMaxAPI } from './ai.service.js';

export interface Evaluation {
  id: number;
  interview_id: number;
  summary: string;
  pros: string;
  cons: string;
  suggestions: string;
  overall_score?: number;
  technical_depth?: number;
  communication?: number;
  project_experience?: number;
  adaptability?: number;
  highlights?: { question: string; answer: string }[];
  created_at: string;
}

function rowToEvaluation(row: any[]): Evaluation {
  return {
    id: row[0] as number,
    interview_id: row[1] as number,
    summary: row[2] as string,
    pros: row[3] as string,
    cons: row[4] as string,
    suggestions: row[5] as string,
    created_at: row[6] as string,
    overall_score: row[7] as number | undefined,
    technical_depth: row[8] as number | undefined,
    communication: row[9] as number | undefined,
    project_experience: row[10] as number | undefined,
    adaptability: row[11] as number | undefined,
  };
}

export const evaluationService = {
  /**
   * 生成面试评估
   */
  async generateEvaluation(
    interviewId: number,
    interviewPosition: string,
    interviewType: 'group' | 'single',
    conversationHistory: string
  ): Promise<Evaluation> {
    const evaluationPrompt = `作为一个专业的面试评估专家，请根据以下面试对话，对求职者的表现进行评估。

面试职位: ${interviewPosition}
面试类型: ${interviewType === 'group' ? '群面' : '单面'}

对话历史:
${conversationHistory}

请给出以下格式的评估:
1. 总体评价 (summary): 对候选人整体表现的评价
2. 亮点时刻 (highlights): 候选人回答得最好的2-3个时刻，描述问题和精彩回答
3. 优点 (pros): 面试中展现的优点
4. 不足之处 (cons): 面试中暴露的不足
5. 改进建议 (suggestions): 针对不足的具体改进建议

请用JSON格式返回:
{"summary": "...", "highlights": [{"question": "...", "answer": "..."}, ...], "pros": [...], "cons": [...], "suggestions": [...]}`;

    const response = await callMiniMaxAPI(
      '你是一个专业的面试评估专家。',
      evaluationPrompt,
      2048
    );

    let evaluation;
    try {
      // Remove markdown code fences if present
      const cleanText = response.content.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').trim();
      evaluation = JSON.parse(cleanText);
    } catch {
      evaluation = {
        summary: response.content,
        highlights: [],
        pros: '',
        cons: '',
        suggestions: '',
      };
    }

    // 确保highlights是数组格式
    if (!Array.isArray(evaluation.highlights)) {
      evaluation.highlights = [];
    }

    // 保存评估
    return this.create(interviewId, {
      summary: evaluation.summary || '',
      pros: Array.isArray(evaluation.pros) ? evaluation.pros.join('; ') : (evaluation.pros || ''),
      cons: Array.isArray(evaluation.cons) ? evaluation.cons.join('; ') : (evaluation.cons || ''),
      suggestions: Array.isArray(evaluation.suggestions) ? evaluation.suggestions.join('; ') : (evaluation.suggestions || ''),
      highlights: evaluation.highlights,
    });
  },

  /**
   * 创建评估记录
   */
  create(
    interviewId: number,
    data: Partial<Evaluation>
  ): Evaluation {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      INSERT INTO evaluations (interview_id, summary, pros, cons, suggestions)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([
      interviewId,
      data.summary || '',
      data.pros || '',
      data.cons || '',
      data.suggestions || '',
    ]);
    saveDb();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;

    return this.getById(id)!;
  },

  /**
   * 获取评估
   */
  getById(id: number): Evaluation | null {
    const db = getDb();
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM evaluations WHERE id = ?');
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
      summary: row.summary as string,
      pros: row.pros as string,
      cons: row.cons as string,
      suggestions: row.suggestions as string,
      overall_score: row.overall_score as number | undefined,
      technical_depth: row.technical_depth as number | undefined,
      communication: row.communication as number | undefined,
      project_experience: row.project_experience as number | undefined,
      adaptability: row.adaptability as number | undefined,
      highlights: row.highlights ? JSON.parse(row.highlights as string) : undefined,
      created_at: row.created_at as string,
    };
  },

  /**
   * 获取面试的评估
   */
  getByInterviewId(interviewId: number): Evaluation | null {
    const db = getDb();
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?');
    stmt.bind([interviewId]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();

    return {
      id: row.id as number,
      interview_id: row.interview_id as number,
      summary: row.summary as string,
      pros: row.pros as string,
      cons: row.cons as string,
      suggestions: row.suggestions as string,
      overall_score: row.overall_score as number | undefined,
      technical_depth: row.technical_depth as number | undefined,
      communication: row.communication as number | undefined,
      project_experience: row.project_experience as number | undefined,
      adaptability: row.adaptability as number | undefined,
      highlights: row.highlights ? JSON.parse(row.highlights as string) : undefined,
      created_at: row.created_at as string,
    };
  },

  /**
   * 更新评估
   */
  update(id: number, data: Partial<Evaluation>): Evaluation | null {
    const db = getDb();
    if (!db) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.summary !== undefined) { fields.push('summary = ?'); values.push(data.summary); }
    if (data.pros !== undefined) { fields.push('pros = ?'); values.push(data.pros); }
    if (data.cons !== undefined) { fields.push('cons = ?'); values.push(data.cons); }
    if (data.suggestions !== undefined) { fields.push('suggestions = ?'); values.push(data.suggestions); }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    db.run(`UPDATE evaluations SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();

    return this.getById(id);
  },

  /**
   * 删除评估
   */
  delete(id: number): boolean {
    const db = getDb();
    if (!db) return false;

    db.run('DELETE FROM evaluations WHERE id = ?', [id]);
    saveDb();
    return true;
  },
};
