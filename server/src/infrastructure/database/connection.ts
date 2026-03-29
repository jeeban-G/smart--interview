// infrastructure/database/connection.ts
import { Database as SqlJsDatabase } from 'sql.js';

// 数据库连接接口
export interface IDatabaseConnection {
  getDb(): SqlJsDatabase | null;
  save(): void;
}

// 全局连接实例（将在初始化时设置）
let connection: IDatabaseConnection | null = null;

export function setConnection(conn: IDatabaseConnection): void {
  connection = conn;
}

export function getConnection(): IDatabaseConnection {
  if (!connection) {
    throw new Error('Database connection not initialized');
  }
  return connection;
}
