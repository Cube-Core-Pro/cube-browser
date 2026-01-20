/**
 * CUBE Elite v7 - PostgreSQL Database Client
 * 
 * Production-grade database connection pool with:
 * - Connection pooling
 * - Error handling with proper typing
 * - Transaction support
 * - Query logging (dev mode)
 * - Automatic reconnection
 * 
 * @module lib/database
 * @version 1.0.0
 * @created 2025-12-27
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ============================================================================
// Types
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface QueryOptions {
  text: string;
  values?: unknown[];
  name?: string;
}

export interface TransactionCallback<T> {
  (client: PoolClient): Promise<T>;
}

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly detail?: string;
  public readonly table?: string;
  public readonly constraint?: string;

  constructor(message: string, code: string, detail?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.detail = detail;
  }
}

// ============================================================================
// Configuration
// ============================================================================

const isDev = process.env.NODE_ENV === 'development';

const getConfig = (): DatabaseConfig => {
  return {
    host: process.env.DATABASE_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'cube_nexum',
    user: process.env.DATABASE_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
};

// ============================================================================
// Pool Management (Singleton)
// ============================================================================

let pool: Pool | null = null;

const getPool = (): Pool => {
  if (!pool) {
    const config = getConfig();
    pool = new Pool(config);

    // Error handler for idle clients
    pool.on('error', (err: Error) => {
      console.error('[Database] Unexpected error on idle client:', err.message);
    });

    // Connection event for debugging
    pool.on('connect', () => {
      if (isDev) {
        console.log('[Database] New client connected to pool');
      }
    });

    if (isDev) {
      console.log('[Database] Pool initialized with config:', {
        host: config.host,
        port: config.port,
        database: config.database,
        max: config.max,
      });
    }
  }
  return pool;
};

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Execute a query against the database
 * 
 * @param text SQL query string
 * @param values Query parameters
 * @returns Query result
 * 
 * @example
 * const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const p = getPool();

  try {
    const result = await p.query<T>(text, values);

    if (isDev) {
      const duration = Date.now() - start;
      console.log('[Database] Query executed:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        rows: result.rowCount,
        duration: `${duration}ms`,
      });
    }

    return result;
  } catch (error) {
    const pgError = error as { code?: string; detail?: string; message?: string };
    throw new DatabaseError(
      pgError.message || 'Query failed',
      pgError.code || 'UNKNOWN',
      pgError.detail
    );
  }
}

/**
 * Execute a query and return the first row
 * 
 * @param text SQL query string
 * @param values Query parameters
 * @returns First row or null
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, values);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 * 
 * @param text SQL query string
 * @param values Query parameters
 * @returns Array of rows
 */
export async function queryAll<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, values);
  return result.rows;
}

/**
 * Execute multiple queries in a transaction
 * 
 * @param callback Function that receives a client and executes queries
 * @returns Result of the callback
 * 
 * @example
 * const result = await transaction(async (client) => {
 *   await client.query('INSERT INTO users ...');
 *   await client.query('INSERT INTO audit_log ...');
 *   return { success: true };
 * });
 */
export async function transaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const p = getPool();
  const client = await p.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    const pgError = error as { code?: string; detail?: string; message?: string };
    throw new DatabaseError(
      pgError.message || 'Transaction failed',
      pgError.code || 'UNKNOWN',
      pgError.detail
    );
  } finally {
    client.release();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check database connection health
 */
export async function healthCheck(): Promise<{ connected: boolean; latency: number; poolSize: number }> {
  const start = Date.now();
  try {
    await query('SELECT 1');
    const p = getPool();
    return {
      connected: true,
      latency: Date.now() - start,
      poolSize: p.totalCount,
    };
  } catch {
    return {
      connected: false,
      latency: -1,
      poolSize: 0,
    };
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats(): { total: number; idle: number; waiting: number } {
  const p = getPool();
  return {
    total: p.totalCount,
    idle: p.idleCount,
    waiting: p.waitingCount,
  };
}

/**
 * Close the database pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    if (isDev) {
      console.log('[Database] Pool closed');
    }
  }
}

/**
 * Generate a UUID using PostgreSQL
 */
export async function generateUUID(): Promise<string> {
  const result = await queryOne<{ uuid: string }>('SELECT uuid_generate_v4() as uuid');
  return result?.uuid || crypto.randomUUID();
}

// ============================================================================
// Helper for building queries
// ============================================================================

export class QueryBuilder {
  private _select: string[] = [];
  private _from: string = '';
  private _joins: string[] = [];
  private _where: string[] = [];
  private _orderBy: string[] = [];
  private _groupBy: string[] = [];
  private _limit?: number;
  private _offset?: number;
  private _values: unknown[] = [];
  private _paramIndex = 1;

  select(...columns: string[]): this {
    this._select.push(...columns);
    return this;
  }

  from(table: string): this {
    this._from = table;
    return this;
  }

  join(table: string, on: string): this {
    this._joins.push(`JOIN ${table} ON ${on}`);
    return this;
  }

  leftJoin(table: string, on: string): this {
    this._joins.push(`LEFT JOIN ${table} ON ${on}`);
    return this;
  }

  where(condition: string, value?: unknown): this {
    if (value !== undefined) {
      this._where.push(condition.replace('?', `$${this._paramIndex++}`));
      this._values.push(value);
    } else {
      this._where.push(condition);
    }
    return this;
  }

  andWhere(condition: string, value?: unknown): this {
    return this.where(condition, value);
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBy.push(`${column} ${direction}`);
    return this;
  }

  groupBy(...columns: string[]): this {
    this._groupBy.push(...columns);
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  offset(n: number): this {
    this._offset = n;
    return this;
  }

  build(): { text: string; values: unknown[] } {
    const parts: string[] = [];

    parts.push(`SELECT ${this._select.length ? this._select.join(', ') : '*'}`);
    parts.push(`FROM ${this._from}`);

    if (this._joins.length) {
      parts.push(this._joins.join(' '));
    }

    if (this._where.length) {
      parts.push(`WHERE ${this._where.join(' AND ')}`);
    }

    if (this._groupBy.length) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`);
    }

    if (this._orderBy.length) {
      parts.push(`ORDER BY ${this._orderBy.join(', ')}`);
    }

    if (this._limit !== undefined) {
      parts.push(`LIMIT ${this._limit}`);
    }

    if (this._offset !== undefined) {
      parts.push(`OFFSET ${this._offset}`);
    }

    return {
      text: parts.join(' '),
      values: this._values,
    };
  }

  async execute<T extends QueryResultRow = QueryResultRow>(): Promise<T[]> {
    const { text, values } = this.build();
    return queryAll<T>(text, values);
  }
}

// ============================================================================
// Default Export
// ============================================================================

const db = {
  query,
  queryOne,
  queryAll,
  transaction,
  healthCheck,
  getPoolStats,
  closePool,
  generateUUID,
  QueryBuilder,
};

export default db;
