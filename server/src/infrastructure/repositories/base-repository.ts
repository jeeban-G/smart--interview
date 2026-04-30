import { Database, BindParams, SqlValue } from 'sql.js';
import { connectionManager } from '../database/connection-manager.js';
import { logger } from '../../utils/logger.js';

export abstract class BaseRepository {
  protected async getDb(): Promise<Database> {
    return connectionManager.getDb();
  }

  protected async saveDb(): Promise<void> {
    return connectionManager.saveDb();
  }

  protected async runQuery(sql: string, params: SqlValue[] = []): Promise<void> {
    const db = await this.getDb();
    try {
      db.run(sql, params as BindParams);
      await this.saveDb();
    } catch (err) {
      logger.error(this.constructor.name, `Failed to run query: ${sql}`, err as Error);
      throw err;
    }
  }

  protected async getOne<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
    const db = await this.getDb();
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params as BindParams);

      if (!stmt.step()) {
        stmt.free();
        return null;
      }

      const row = stmt.getAsObject();
      stmt.free();
      return row as unknown as T;
    } catch (err) {
      logger.error(this.constructor.name, `Failed to get one: ${sql}`, err as Error);
      throw err;
    }
  }

  protected async getMany<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    const db = await this.getDb();
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params as BindParams);

      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }

      stmt.free();
      return results;
    } catch (err) {
      logger.error(this.constructor.name, `Failed to get many: ${sql}`, err as Error);
      throw err;
    }
  }

  protected async insert(sql: string, params: SqlValue[] = []): Promise<number> {
    const db = await this.getDb();
    try {
      db.run(sql, params as BindParams);
      const result = db.exec('SELECT last_insert_rowid() as id');
      const id = (result[0]?.values[0]?.[0] as number) || 0;
      await this.saveDb();
      return id;
    } catch (err) {
      logger.error(this.constructor.name, `Failed to insert: ${sql}`, err as Error);
      throw err;
    }
  }

  protected async count(sql: string, params: SqlValue[] = []): Promise<number> {
    const db = await this.getDb();
    try {
      const result = db.exec(sql, params as BindParams);
      return (result[0]?.values[0]?.[0] as number) || 0;
    } catch (err) {
      logger.error(this.constructor.name, `Failed to count: ${sql}`, err as Error);
      throw err;
    }
  }
}
