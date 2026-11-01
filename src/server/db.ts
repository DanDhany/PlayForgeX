import mysql, { Pool, PoolOptions, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export interface DbConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

function getDbConfig(): PoolOptions {
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "tunebridge",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
}

let activePool: Pool | null = null;

export function getPool(): Pool {
  if (!activePool) {
    activePool = mysql.createPool(getDbConfig());
  }
  return activePool;
}

// Export pool proxy to support direct `pool.query()` usage
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const currentPool = getPool();
    const value = (currentPool as any)[prop];
    if (typeof value === "function") {
      return value.bind(currentPool);
    }
    return value;
  },
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    const currentPool = getPool();
    const conn = await currentPool.getConnection();
    try {
      await conn.query("SELECT 1 AS health");
      return true;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.warn(`[Database] Connection check failed (${err.code || err.message}):`, err.message);
    return false;
  }
}

export async function isDbConnected(): Promise<boolean> {
  return checkDbConnection();
}

export async function query<T = any>(sql: string, params?: any[]): Promise<[T, any]> {
  return getPool().query(sql, params) as Promise<[T, any]>;
}

export async function execute<T = any>(sql: string, params?: any[]): Promise<[T, any]> {
  return getPool().execute(sql, params) as Promise<[T, any]>;
}

export async function closePool(): Promise<void> {
  if (activePool) {
    try {
      await activePool.end();
    } catch (err) {
      console.warn("[Database] Error closing connection pool:", err);
    } finally {
      activePool = null;
    }
  }
}

export async function initDatabase(): Promise<boolean> {
  const dbName = process.env.DB_NAME || "tunebridge";

  // First verify / create database if needed
  try {
    const rootConn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    });

    try {
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    } finally {
      await rootConn.end();
    }
  } catch (err: any) {
    console.warn(`[Database] Notice while ensuring database '${dbName}' exists:`, err.message);
  }

  try {
    const p = getPool();

    // 1. users
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(64) NOT NULL,
        role ENUM('admin','user') DEFAULT 'user',
        created_at BIGINT NOT NULL,
        last_login_at BIGINT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. sessions
    await p.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL,
        INDEX idx_sessions_user_id (user_id),
        INDEX idx_sessions_expires (expires_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. accounts
    await p.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        platform VARCHAR(32) NOT NULL,
        label VARCHAR(128) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        metadata JSON,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        INDEX idx_accounts_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. account_secrets
    await p.query(`
      CREATE TABLE IF NOT EXISTS account_secrets (
        id VARCHAR(64) PRIMARY KEY,
        account_id VARCHAR(64) NOT NULL,
        cookies TEXT,
        developer_token TEXT,
        user_token TEXT,
        updated_at BIGINT NOT NULL,
        INDEX idx_secrets_account_id (account_id),
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. snapshots
    await p.query(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        account_id VARCHAR(64),
        snapshot_data LONGTEXT NOT NULL,
        created_at BIGINT NOT NULL,
        INDEX idx_snapshots_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. activity_logs
    await p.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        action VARCHAR(64) NOT NULL,
        details JSON,
        created_at BIGINT NOT NULL,
        INDEX idx_logs_user_id (user_id),
        INDEX idx_logs_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("[Database] All MySQL tables initialized successfully.");
    return true;
  } catch (err: any) {
    console.error("[Database] Initialization failed:", err);
    return false;
  }
}

export async function resetDatabaseForTesting(): Promise<void> {
  const p = getPool();
  await p.query("SET FOREIGN_KEY_CHECKS = 0;");
  await p.query("DROP TABLE IF EXISTS account_secrets, snapshots, activity_logs, sessions, accounts, users;");
  await p.query("SET FOREIGN_KEY_CHECKS = 1;");
}
