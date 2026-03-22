import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'interview.db');

let db: SqlJsDatabase | null = null;

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();

  // 尝试读取已存在的数据库
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_code TEXT UNIQUE,
      type TEXT NOT NULL,
      position TEXT NOT NULL,
      question TEXT,
      status TEXT DEFAULT 'pending',
      duration INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      sender_name TEXT,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES interviews(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER UNIQUE NOT NULL,
      summary TEXT,
      pros TEXT,
      cons TEXT,
      suggestions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES interviews(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      education TEXT,
      experience TEXT,
      skills TEXT,
      projects TEXT,
      personality TEXT,
      resume_text TEXT,
      style TEXT,
      specialties TEXT,
      company TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 添加 agent_id 列到 interviews 表（如果不存在）
  try {
    db.run('ALTER TABLE interviews ADD COLUMN agent_id INTEGER');
  } catch (e) {
    // 列可能已存在，忽略错误
  }

  // 添加 candidate_agent_id 和 interviewer_agent_id 列（如果不存在）
  try {
    db.run('ALTER TABLE interviews ADD COLUMN candidate_agent_id INTEGER');
  } catch (e) {
    // 列可能已存在，忽略错误
  }

  try {
    db.run('ALTER TABLE interviews ADD COLUMN interviewer_agent_id INTEGER');
  } catch (e) {
    // 列可能已存在，忽略错误
  }

  saveDb();
  return db;
}

export function saveDb(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export function getDb(): SqlJsDatabase | null {
  return db;
}

export default { initDb, saveDb, getDb };
