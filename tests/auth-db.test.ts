import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  initDatabase,
  checkDbConnection,
  closePool,
  resetDatabaseForTesting,
  query,
} from "../src/server/db.js";
import {
  hashPassword,
  verifyPassword,
  register,
  login,
  verifyToken,
  logout,
  getUserById,
  getUserByUsername,
  ensureDefaultAdmin,
  migrateLegacyDataToAdmin,
} from "../src/server/auth-service.js";
import { AccountManager } from "../src/server/account-manager.js";

describe("MySQL Database Schema, Connection Pool & Auth Service", () => {
  beforeAll(async () => {
    // Ensure clean state before running tests
    const connected = await checkDbConnection();
    expect(connected).toBe(true);

    await resetDatabaseForTesting();
    const initialized = await initDatabase();
    expect(initialized).toBe(true);
  });

  afterAll(async () => {
    // Reset test database and close connection pool for graceful exit
    try {
      await resetDatabaseForTesting();
      await initDatabase();
    } catch {}
    await closePool();
  });

  describe("Database Connection & Schema Initialization", () => {
    it("connects to MySQL database and initializes all 6 required tables", async () => {
      const [rows] = await query<any[]>("SHOW TABLES;");
      const tableNames = rows.map((r: any) => Object.values(r)[0]);

      expect(tableNames).toContain("users");
      expect(tableNames).toContain("sessions");
      expect(tableNames).toContain("accounts");
      expect(tableNames).toContain("account_secrets");
      expect(tableNames).toContain("snapshots");
      expect(tableNames).toContain("activity_logs");
    });

    it("verifies column constraints and types on users table", async () => {
      const [cols] = await query<any[]>("DESCRIBE users;");
      const colMap = new Map(cols.map((c: any) => [c.Field, c]));

      expect(colMap.has("id")).toBe(true);
      expect(colMap.has("username")).toBe(true);
      expect(colMap.has("password_hash")).toBe(true);
      expect(colMap.has("salt")).toBe(true);
      expect(colMap.has("role")).toBe(true);
      expect(colMap.has("created_at")).toBe(true);
      expect(colMap.has("last_login_at")).toBe(true);

      const idCol = colMap.get("id");
      expect(idCol.Key).toBe("PRI");
    });
  });

  describe("Password Hashing & Pure Scrypt Cryptography", () => {
    it("generates random salts and consistent verification", () => {
      const pass = "SuperSecretP@ssw0rd!2026";
      const { hash: hash1, salt: salt1 } = hashPassword(pass);
      const { hash: hash2, salt: salt2 } = hashPassword(pass);

      // Salts must be unique
      expect(salt1).not.toBe(salt2);
      expect(hash1).not.toBe(hash2);

      // Verification succeeds with matching salt
      expect(verifyPassword(pass, hash1, salt1)).toBe(true);
      expect(verifyPassword(pass, hash2, salt2)).toBe(true);

      // Verification fails with wrong password or mismatched salt
      expect(verifyPassword("WrongPassword", hash1, salt1)).toBe(false);
      expect(verifyPassword(pass, hash1, salt2)).toBe(false);
    });
  });

  describe("User Registration & Queries", () => {
    it("registers a new user and rejects invalid inputs", async () => {
      await expect(register("ab", "pass123")).rejects.toThrow("Username must be at least 3 characters");
      await expect(register("validuser", "123")).rejects.toThrow("Password must be at least 6 characters");

      const user = await register("testuser_alpha", "Password#2026", "user");
      expect(user).toBeDefined();
      expect(user.id).toMatch(/^usr_/);
      expect(user.username).toBe("testuser_alpha");
      expect(user.role).toBe("user");
      expect(user.createdAt).toBeGreaterThan(0);
      expect(user.lastLoginAt).toBeNull();

      // Duplicate registration must fail
      await expect(register("testuser_alpha", "AnotherPass#2026")).rejects.toThrow("already taken");
    });

    it("fetches user by ID and by username", async () => {
      const byName = await getUserByUsername("testuser_alpha");
      expect(byName).toBeDefined();
      expect(byName?.username).toBe("testuser_alpha");

      const byId = await getUserById(byName!.id);
      expect(byId).toBeDefined();
      expect(byId?.id).toBe(byName!.id);
      expect(byId?.username).toBe("testuser_alpha");

      const nonExistent = await getUserByUsername("non_existent_user_999");
      expect(nonExistent).toBeNull();
    });
  });

  describe("Authentication, Session Tokens & Expiration", () => {
    it("authenticates valid credentials and creates 7-day session token", async () => {
      const auth = await login("testuser_alpha", "Password#2026");
      expect(auth).toBeDefined();
      expect(auth.user.username).toBe("testuser_alpha");
      expect(auth.token).toBeDefined();
      expect(auth.token.length).toBe(64); // 32 bytes hex = 64 chars

      // Validates session via verifyToken
      const verified = await verifyToken(auth.token);
      expect(verified).toBeDefined();
      expect(verified?.id).toBe(auth.user.id);
      expect(verified?.username).toBe("testuser_alpha");

      // Verify last_login_at got updated
      const updatedUser = await getUserById(auth.user.id);
      expect(updatedUser?.lastLoginAt).toBeGreaterThan(0);
    });

    it("rejects login with invalid password or non-existent user", async () => {
      await expect(login("testuser_alpha", "WrongPassword#123")).rejects.toThrow(
        "Invalid username or password"
      );
      await expect(login("unknown_user", "Password#2026")).rejects.toThrow(
        "Invalid username or password"
      );
    });

    it("invalidates session on logout", async () => {
      const auth = await login("testuser_alpha", "Password#2026");
      expect(await verifyToken(auth.token)).not.toBeNull();

      const loggedOut = await logout(auth.token);
      expect(loggedOut).toBe(true);

      const checkAfterLogout = await verifyToken(auth.token);
      expect(checkAfterLogout).toBeNull();
    });

    it("handles expired tokens by deleting them and returning null", async () => {
      const auth = await login("testuser_alpha", "Password#2026");
      // Artificially expire token in DB
      const pastTime = Date.now() - 10000;
      await query("UPDATE sessions SET expires_at = ? WHERE token = ?", [pastTime, auth.token]);

      const verified = await verifyToken(auth.token);
      expect(verified).toBeNull();

      // Session row should have been purged
      const [rows] = await query<any[]>("SELECT token FROM sessions WHERE token = ?", [auth.token]);
      expect(rows.length).toBe(0);
    });
  });

  describe("Admin Seeding & Legacy Data Migration", () => {
    it("seeds default admin user if none exists", async () => {
      // Clear users for this test
      await query("SET FOREIGN_KEY_CHECKS = 0;");
      await query("TRUNCATE TABLE sessions;");
      await query("TRUNCATE TABLE users;");
      await query("SET FOREIGN_KEY_CHECKS = 1;");

      const admin = await ensureDefaultAdmin();
      expect(admin).toBeDefined();
      expect(admin.username).toBe("admin");
      expect(admin.role).toBe("admin");

      // Can login with default credentials
      const adminLogin = await login("admin", "playforgex2026");
      expect(adminLogin.user.username).toBe("admin");
      expect(adminLogin.user.role).toBe("admin");

      // Calling again returns existing admin without duplicate error
      const adminAgain = await ensureDefaultAdmin();
      expect(adminAgain.id).toBe(admin.id);
    });

    it("migrates accounts, secrets and snapshots from disk to MySQL assigned to admin", async () => {
      const admin = await getUserByUsername("admin");
      expect(admin).toBeDefined();

      // Create a temporary data dir mimicking legacy data
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tb-migrate-test-"));
      const accountsPath = path.join(tmpDir, "accounts.json");
      const secretsPath = path.join(tmpDir, "secrets.json");
      const snapshotsDir = path.join(tmpDir, "snapshots");
      fs.mkdirSync(snapshotsDir, { recursive: true });

      fs.writeFileSync(
        accountsPath,
        JSON.stringify([
          {
            id: "acc_migrated_ytm",
            platform: "youtube",
            localAlias: "Migrated YouTube Music",
            status: "connected",
            createdAt: 1700000000000,
            playlistCount: 42,
          },
          {
            id: "acc_migrated_apple",
            platform: "apple",
            localAlias: "Migrated Apple Music",
            status: "connected",
            storefront: "id",
            createdAt: 1700000001000,
            playlistCount: 15,
          },
        ]),
        "utf-8"
      );

      fs.writeFileSync(
        secretsPath,
        JSON.stringify([
          {
            id: "acc_migrated_ytm",
            ytCookieString: "SAPISID=fake_migrated_sapisid; HSID=test;",
          },
          {
            id: "acc_migrated_apple",
            appleUserToken: "fake_migrated_apple_token",
            appleDevToken: "fake_migrated_apple_dev",
          },
        ]),
        "utf-8"
      );

      fs.writeFileSync(
        path.join(snapshotsDir, "acc_migrated_ytm.json"),
        JSON.stringify([
          {
            id: "pl_snap_1",
            title: "Snapshot Playlist 1",
            trackCount: 1,
            tracks: [{ title: "Lagu A", artist: "Penyanyi A" }],
          },
        ]),
        "utf-8"
      );

      // Perform migration
      const result = await migrateLegacyDataToAdmin(admin!.id, tmpDir);
      expect(result.migratedAccounts).toBe(2);
      expect(result.migratedSecrets).toBe(2);
      expect(result.migratedSnapshots).toBe(1);

      // Verify accounts in MySQL
      const [accRows] = await query<any[]>("SELECT * FROM accounts WHERE user_id = ?", [admin!.id]);
      expect(accRows.length).toBe(2);
      const ytmAcc = accRows.find((a: any) => a.id === "acc_migrated_ytm");
      expect(ytmAcc).toBeDefined();
      expect(ytmAcc.label).toBe("Migrated YouTube Music");
      expect(ytmAcc.platform).toBe("youtube");

      // Verify secrets in MySQL
      const [secRows] = await query<any[]>(
        "SELECT * FROM account_secrets WHERE account_id = 'acc_migrated_ytm'"
      );
      expect(secRows.length).toBe(1);
      expect(secRows[0].cookies).toContain("fake_migrated_sapisid");

      // Verify snapshots in MySQL
      const [snapRows] = await query<any[]>(
        "SELECT * FROM snapshots WHERE account_id = 'acc_migrated_ytm'"
      );
      expect(snapRows.length).toBe(1);
      expect(snapRows[0].snapshot_data).toContain("Snapshot Playlist 1");

      // Idempotency test: calling migration again returns 0 items and doesn't fail
      const repeatResult = await migrateLegacyDataToAdmin(admin!.id, tmpDir);
      expect(repeatResult.migratedAccounts).toBe(0);
      expect(repeatResult.migratedSecrets).toBe(0);
      expect(repeatResult.migratedSnapshots).toBe(0);

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });

  describe("AccountManager DB integration", () => {
    it("loads user accounts from MySQL and persists new ones", async () => {
      const admin = await getUserByUsername("admin");
      expect(admin).toBeDefined();

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tb-acc-mgr-"));
      const mgr = new AccountManager(tmpDir, admin!.id);

      // Load from DB (which already has the 2 migrated accounts from previous test)
      const accounts = await mgr.loadFromDb(admin!.id);
      expect(accounts.length).toBeGreaterThanOrEqual(2);
      expect(accounts.some((a) => a.id === "acc_migrated_ytm")).toBe(true);

      // Static helper check
      const staticAccounts = await AccountManager.getAccountsByUserId(admin!.id);
      expect(staticAccounts.length).toBe(accounts.length);

      // Remove an account through mgr and verify DB removal
      const removed = await mgr.removeAccountFromDb("acc_migrated_ytm");
      expect(removed).toBe(true);

      const [afterDelete] = await query<any[]>(
        "SELECT id FROM accounts WHERE id = 'acc_migrated_ytm'"
      );
      expect(afterDelete.length).toBe(0);

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });
});
