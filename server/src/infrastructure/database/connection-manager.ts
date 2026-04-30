import initSqlJs, { Database } from 'sql.js';
import { logger } from '../../utils/logger.js';

const DB_PATH = './interview.db';

class ConnectionManager {
  private db: Database | null = null;
  private initializing: Promise<void> | null = null;

  async getDb(): Promise<Database> {
    if (this.db) {
      return this.db;
    }

    if (this.initializing) {
      await this.initializing;
      return this.db!;
    }

    this.initializing = this.initialize();
    await this.initializing;
    return this.db!;
  }

  private async initialize(): Promise<void> {
    try {
      logger.info('Database', 'Initializing database connection...');

      const SQL = await initSqlJs();

      // Try to load existing database file
      try {
        const fs = await import('fs');
        if (fs.existsSync(DB_PATH)) {
          const fileBuffer = fs.readFileSync(DB_PATH);
          this.db = new SQL.Database(fileBuffer);
          logger.info('Database', 'Loaded existing database file');
        } else {
          this.db = new SQL.Database();
          logger.info('Database', 'Created new database');
        }
      } catch (err) {
        this.db = new SQL.Database();
        logger.warn('Database', 'Created new database (could not load existing file)');
      }

      // Enable WAL mode for better concurrent access
      this.db.run('PRAGMA journal_mode=WAL');
      this.db.run('PRAGMA synchronous=NORMAL');

      logger.info('Database', 'Database connection initialized');
    } catch (err) {
      logger.error('Database', 'Failed to initialize database', err as Error);
      throw err;
    } finally {
      this.initializing = null;
    }
  }

  async saveDb(): Promise<void> {
    if (!this.db) {
      logger.warn('Database', 'Attempted to save non-existent database');
      return;
    }

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const fs = await import('fs');
      fs.writeFileSync(DB_PATH, buffer);
      logger.debug('Database', 'Database saved to file');
    } catch (err) {
      logger.error('Database', 'Failed to save database', err as Error);
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.saveDb();
      this.db.close();
      this.db = null;
      logger.info('Database', 'Database connection closed');
    }
  }

  isInitialized(): boolean {
    return this.db !== null;
  }
}

export const connectionManager = new ConnectionManager();
