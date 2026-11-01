import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../src/server/index.js";
import {
  initDatabase,
  checkDbConnection,
  closePool,
  resetDatabaseForTesting,
} from "../src/server/db.js";
import * as authService from "../src/server/auth-service.js";

describe("Authentication Express Endpoints & Session Management", () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Database connection check
    const connected = await checkDbConnection();
    expect(connected).toBe(true);

    await resetDatabaseForTesting();
    const initialized = await initDatabase();
    expect(initialized).toBe(true);

    // Ensure default admin is created
    await authService.ensureDefaultAdmin();

    // Start ephemeral server on random available port
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    try {
      await resetDatabaseForTesting();
      await initDatabase();
    } catch {}
    await closePool();
  });

  describe("POST /api/auth/register", () => {
    it("successfully registers a new user account and returns user + session token", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "alice_wonderland",
          password: "password123!",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe("alice_wonderland");
      expect(data.user.role).toBe("user");
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe("string");
      expect(data.token.length).toBeGreaterThan(20);
    });

    it("rejects duplicate username with status 400", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "alice_wonderland",
          password: "newpassword456",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/already taken/i);
    });

    it("rejects username shorter than 3 characters with status 400", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "al",
          password: "validpassword123",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/at least 3 characters/i);
    });

    it("rejects password shorter than 6 characters with status 400", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "valid_user",
          password: "123",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/at least 6 characters/i);
    });
  });

  describe("POST /api/auth/login", () => {
    it("successfully logs in with valid credentials and creates a session", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "alice_wonderland",
          password: "password123!",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.username).toBe("alice_wonderland");
      expect(data.token).toBeDefined();
    });

    it("logs in with default seeded admin credentials", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "tunebridge2026",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.username).toBe("admin");
      expect(data.user.role).toBe("admin");
    });

    it("rejects invalid password with status 401", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "alice_wonderland",
          password: "wrongpassword!",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/Invalid username or password/i);
    });

    it("rejects non-existent user with status 401", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "non_existent_user_999",
          password: "somepassword",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/Invalid username or password/i);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns authenticated user details when Bearer token is provided", async () => {
      // First login
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "alice_wonderland",
          password: "password123!",
        }),
      });
      const loginData = await loginRes.json();
      const token = loginData.token;

      // Verify session via /api/auth/me
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(meRes.status).toBe(200);
      const meData = await meRes.json();
      expect(meData.user).not.toBeNull();
      expect(meData.user.username).toBe("alice_wonderland");
      expect(meData.user.role).toBe("user");
    });

    it("returns user: null when an invalid or expired Bearer token is provided", async () => {
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer invalid_fake_token_12345`,
        },
      });

      expect(meRes.status).toBe(200);
      const meData = await meRes.json();
      expect(meData.user).toBeNull();
    });

    it("falls back to default admin user when no authorization header is passed", async () => {
      const meRes = await fetch(`${baseUrl}/api/auth/me`);
      expect(meRes.status).toBe(200);
      const meData = await meRes.json();
      expect(meData.user).not.toBeNull();
      expect(meData.user.username).toBe("admin");
      expect(meData.user.role).toBe("admin");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("invalidates session token on logout so subsequent /api/auth/me returns null", async () => {
      // 1. Register & login Bob
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "bob_marley",
          password: "reggaepassword!",
        }),
      });
      const regData = await regRes.json();
      const token = regData.token;

      // 2. Confirm valid session
      const verifyRes1 = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect((await verifyRes1.json()).user.username).toBe("bob_marley");

      // 3. Logout
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });
      expect(logoutRes.status).toBe(200);
      expect((await logoutRes.json()).success).toBe(true);

      // 4. Verify session is now invalidated
      const verifyRes2 = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const verifyData2 = await verifyRes2.json();
      expect(verifyData2.user).toBeNull();
    });
  });

  describe("Multi-User Account Association & Filtering", () => {
    it("associates snapshot accounts with authenticated user id", async () => {
      // Login as Alice
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "alice_wonderland",
          password: "password123!",
        }),
      });
      const { user: aliceUser, token: aliceToken } = await loginRes.json();

      // Add snapshot account under Alice
      const addRes = await fetch(`${baseUrl}/api/accounts/import-snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aliceToken}`,
        },
        body: JSON.stringify({
          alias: "Alice's Chill Tracks",
          playlists: [
            {
              id: "PL_alice_chill",
              title: "Chill Vibes",
              trackCount: 1,
              tracks: [
                {
                  title: "Sunflower",
                  artist: "Post Malone",
                  album: "Spider-Man",
                  durationSeconds: 158,
                },
              ],
            },
          ],
        }),
      });

      expect(addRes.status).toBe(200);
      const addData = await addRes.json();
      expect(addData.success).toBe(true);
      expect(addData.account.userId).toBe(aliceUser.id);
      expect(addData.account.localAlias).toBe("Alice's Chill Tracks");

      // Verify Alice can fetch her account
      const listRes = await fetch(`${baseUrl}/api/accounts`, {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });
      expect(listRes.status).toBe(200);
      const accounts = await listRes.json();
      const aliceAccounts = accounts.filter((a: any) => a.userId === aliceUser.id);
      expect(aliceAccounts.length).toBeGreaterThanOrEqual(1);
      expect(aliceAccounts.some((a: any) => a.localAlias === "Alice's Chill Tracks")).toBe(true);
    });
  });
});
