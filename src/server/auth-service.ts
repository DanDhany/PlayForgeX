import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { query } from "./db.js";

export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: number;
  lastLoginAt?: number | null;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface MigrationSummary {
  migratedAccounts: number;
  migratedSecrets: number;
  migratedSnapshots: number;
}

/**
 * Hash a password using scrypt with cryptographically secure salt.
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, actualSalt, 64).toString("hex");
  return { hash, salt: actualSalt };
}

/**
 * Verify password against stored scrypt hash and salt.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const bufA = Buffer.from(computedHash, "hex");
    const bufB = Buffer.from(hash, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Register a new user account.
 */
export async function register(
  username: string,
  password: string,
  role: "admin" | "user" = "user"
): Promise<User> {
  const cleanUsername = username?.trim();
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error("Username must be at least 3 characters long");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Check if username exists
  const [existing] = await query<any[]>("SELECT id FROM users WHERE username = ? LIMIT 1", [cleanUsername]);
  if (existing && existing.length > 0) {
    throw new Error(`Username '${cleanUsername}' is already taken`);
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const { hash, salt } = hashPassword(password);
  const now = Date.now();

  await query(
    `INSERT INTO users (id, username, password_hash, salt, role, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [userId, cleanUsername, hash, salt, role, now]
  );

  return {
    id: userId,
    username: cleanUsername,
    role,
    createdAt: now,
    lastLoginAt: null,
  };
}

/**
 * Validate credentials and create a 7-day session token.
 */
export async function login(username: string, password: string): Promise<AuthResult> {
  const cleanUsername = username?.trim();
  if (!cleanUsername || !password) {
    throw new Error("Invalid username or password");
  }

  const [rows] = await query<any[]>(
    "SELECT id, username, password_hash, salt, role, created_at, last_login_at FROM users WHERE username = ? LIMIT 1",
    [cleanUsername]
  );

  if (!rows || rows.length === 0) {
    throw new Error("Invalid username or password");
  }

  const userRow = rows[0];
  const isMatch = verifyPassword(password, userRow.password_hash, userRow.salt);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  // Create session
  await query(
    "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    [token, userRow.id, expiresAt, now]
  );

  // Update last_login_at
  await query("UPDATE users SET last_login_at = ? WHERE id = ?", [now, userRow.id]);

  const user: User = {
    id: userRow.id,
    username: userRow.username,
    role: userRow.role,
    createdAt: Number(userRow.created_at),
    lastLoginAt: now,
  };

  return { user, token };
}

/**
 * Verify a session token. Returns User or null if expired / invalid.
 */
export async function verifyToken(token: string): Promise<User | null> {
  if (!token || typeof token !== "string") return null;

  const [rows] = await query<any[]>(
    `SELECT s.token, s.user_id, s.expires_at, u.id, u.username, u.role, u.created_at, u.last_login_at
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ?
     LIMIT 1`,
    [token]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const now = Date.now();

  // Expired session check
  if (Number(row.expires_at) <= now) {
    try {
      await query("DELETE FROM sessions WHERE token = ?", [token]);
    } catch {}
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: Number(row.created_at),
    lastLoginAt: row.last_login_at ? Number(row.last_login_at) : null,
  };
}

/**
 * Invalidate a session token on logout.
 */
export async function logout(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const [result] = await query<any>("DELETE FROM sessions WHERE token = ?", [token]);
  return Boolean(result?.affectedRows && result.affectedRows > 0);
}

/**
 * Look up user by ID.
 */
export async function getUserById(id: string): Promise<User | null> {
  if (!id) return null;
  const [rows] = await query<any[]>(
    "SELECT id, username, role, created_at, last_login_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    role: r.role,
    createdAt: Number(r.created_at),
    lastLoginAt: r.last_login_at ? Number(r.last_login_at) : null,
  };
}

/**
 * Look up user by username.
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const clean = username?.trim();
  if (!clean) return null;
  const [rows] = await query<any[]>(
    "SELECT id, username, role, created_at, last_login_at FROM users WHERE username = ? LIMIT 1",
    [clean]
  );
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    username: r.username,
    role: r.role,
    createdAt: Number(r.created_at),
    lastLoginAt: r.last_login_at ? Number(r.last_login_at) : null,
  };
}

/**
 * Ensure at least one admin exists. Creates 'admin' / 'tunebridge2026' if empty.
 */
export async function ensureDefaultAdmin(): Promise<User> {
  const [countRows] = await query<any[]>("SELECT COUNT(*) as count FROM users");
  const count = Number(countRows?.[0]?.count || 0);

  if (count === 0) {
    try {
      console.log("[AuthService] No users detected. Seeding default admin user ('admin')...");
      return await register("admin", "tunebridge2026", "admin");
    } catch (err: any) {
      const existing = await getUserByUsername("admin");
      if (existing) return existing;
      throw err;
    }
  }

  const existingAdmin = await getUserByUsername("admin");
  if (existingAdmin) return existingAdmin;

  const [admins] = await query<any[]>("SELECT id, username, role, created_at, last_login_at FROM users WHERE role = 'admin' LIMIT 1");
  if (admins && admins.length > 0) {
    const a = admins[0];
    return {
      id: a.id,
      username: a.username,
      role: a.role,
      createdAt: Number(a.created_at),
      lastLoginAt: a.last_login_at ? Number(a.last_login_at) : null,
    };
  }

  // If users exist but none is admin, return first user
  const [firstUser] = await query<any[]>("SELECT id, username, role, created_at, last_login_at FROM users ORDER BY created_at ASC LIMIT 1");
  const u = firstUser[0];
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: Number(u.created_at),
    lastLoginAt: u.last_login_at ? Number(u.last_login_at) : null,
  };
}

/**
 * Migrate legacy data/accounts.json, data/secrets.json and data/snapshots into MySQL
 * assigned to the admin user.
 */
export async function migrateLegacyDataToAdmin(
  adminId: string,
  customDataDir?: string
): Promise<MigrationSummary> {
  const dataDir = customDataDir || process.env.DATA_DIR || path.resolve(process.cwd(), "data");
  const accountsFile = path.join(dataDir, "accounts.json");
  const secretsFile = path.join(dataDir, "secrets.json");
  const snapshotsDir = path.join(dataDir, "snapshots");

  const summary: MigrationSummary = {
    migratedAccounts: 0,
    migratedSecrets: 0,
    migratedSnapshots: 0,
  };

  // 1. Accounts
  if (fs.existsSync(accountsFile)) {
    try {
      const raw = fs.readFileSync(accountsFile, "utf-8");
      const accountsList = JSON.parse(raw);
      if (Array.isArray(accountsList)) {
        for (const acc of accountsList) {
          if (!acc || !acc.id) continue;
          const [exists] = await query<any[]>("SELECT id FROM accounts WHERE id = ? LIMIT 1", [acc.id]);
          if (!exists || exists.length === 0) {
            const metadata = JSON.stringify({
              status: acc.status || "connected",
              storefront: acc.storefront || null,
              playlistCount: acc.playlistCount || 0,
              syncType: acc.syncType || "live",
              errorMessage: acc.errorMessage || null,
              lastVerifiedAt: acc.lastVerifiedAt || Date.now(),
            });

            await query(
              `INSERT INTO accounts (id, user_id, platform, label, is_active, metadata, created_at, updated_at)
               VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
              [
                acc.id,
                adminId,
                acc.platform || "youtube",
                acc.localAlias || acc.label || acc.id,
                metadata,
                acc.createdAt || Date.now(),
                acc.lastVerifiedAt || Date.now(),
              ]
            );
            summary.migratedAccounts++;
          }
        }
      }
    } catch (err) {
      console.warn("[AuthService] Warning reading accounts.json during migration:", err);
    }
  }

  // 2. Secrets
  if (fs.existsSync(secretsFile)) {
    try {
      const raw = fs.readFileSync(secretsFile, "utf-8");
      const secretsList = JSON.parse(raw);
      if (Array.isArray(secretsList)) {
        for (const sec of secretsList) {
          if (!sec || !sec.id) continue;

          // Verify that account exists in accounts table first (foreign key requirement)
          const [accExists] = await query<any[]>("SELECT id FROM accounts WHERE id = ? LIMIT 1", [sec.id]);
          if (!accExists || accExists.length === 0) {
            continue;
          }

          const [exists] = await query<any[]>(
            "SELECT id FROM account_secrets WHERE account_id = ? LIMIT 1",
            [sec.id]
          );

          if (!exists || exists.length === 0) {
            const secretId = `sec_${sec.id}`;
            await query(
              `INSERT INTO account_secrets (id, account_id, cookies, developer_token, user_token, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                secretId,
                sec.id,
                sec.ytCookieString || null,
                sec.appleDevToken || null,
                sec.appleUserToken || null,
                Date.now(),
              ]
            );
            summary.migratedSecrets++;
          }
        }
      }
    } catch (err) {
      console.warn("[AuthService] Warning reading secrets.json during migration:", err);
    }
  }

  // 3. Snapshots
  if (fs.existsSync(snapshotsDir)) {
    try {
      const files = fs.readdirSync(snapshotsDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const accountId = file.replace(/\.json$/, "");

        const [exists] = await query<any[]>(
          "SELECT id FROM snapshots WHERE account_id = ? LIMIT 1",
          [accountId]
        );

        if (!exists || exists.length === 0) {
          const snapshotContent = fs.readFileSync(path.join(snapshotsDir, file), "utf-8");
          const snapId = `snap_${accountId}`;
          await query(
            `INSERT INTO snapshots (id, user_id, account_id, snapshot_data, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [snapId, adminId, accountId, snapshotContent, Date.now()]
          );
          summary.migratedSnapshots++;
        }
      }
    } catch (err) {
      console.warn("[AuthService] Warning reading snapshots during migration:", err);
    }
  }

  return summary;
}
