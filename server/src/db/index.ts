// db/index.ts - 桥接文件，兼容旧代码
import { getConnection, IDatabaseConnection } from '../infrastructure/database/connection.js';
import { Database as SqlJsDatabase } from 'sql.js';

// 获取数据库连接
export function getDb(): SqlJsDatabase | null {
  try {
    const connection: IDatabaseConnection = getConnection();
    return connection.getDb();
  } catch {
    // 如果连接未初始化，返回 null
    return null;
  }
}

// 保存数据库
export function saveDb(): void {
  try {
    const connection: IDatabaseConnection = getConnection();
    connection.save();
  } catch {
    // 连接未初始化，忽略
  }
}

// 为了兼容性保留 initDb，但实际上不做任何事情
// 因为数据库初始化现在由 infrastructure/database/sqlite/index.ts 处理
export async function initDb(): Promise<SqlJsDatabase> {
  const db = getDb();
  if (!db) {
    throw new Error('Database not initialized. Ensure sqliteConnection.initialize() is called first.');
  }
  return db;
}

export default { initDb, saveDb, getDb };
