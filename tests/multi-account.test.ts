import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { AccountManager } from "../src/server/account-manager.js";

describe("AccountManager Multi-Account Storage & Migration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tunebridge-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("migrates legacy session.json into accounts.json and secrets.json seamlessly", () => {
    const legacySessionPath = path.join(tmpDir, "session.json");
    fs.writeFileSync(
      legacySessionPath,
      JSON.stringify({
        ytCookieString: "SAPISID=fake_sapisid_token; HSID=fake_hsid; SSID=fake_ssid;",
        appleUserToken: "fake_apple_media_token_123",
        appleDevToken: "fake_developer_token_abc",
        appleStorefront: "id",
      }),
      "utf-8"
    );

    const mgr = new AccountManager(tmpDir);
    const accounts = mgr.getAccounts();

    expect(accounts.length).toBe(2);
    const ytm = accounts.find((a) => a.platform === "youtube");
    const apple = accounts.find((a) => a.platform === "apple");

    expect(ytm).toBeDefined();
    expect(ytm?.id).toBe("acc_ytm_primary");
    expect(ytm?.status).toBe("connected");

    expect(apple).toBeDefined();
    expect(apple?.id).toBe("acc_apple_primary");
    expect(apple?.storefront).toBe("id");

    // Check files persisted
    expect(fs.existsSync(path.join(tmpDir, "accounts.json"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "secrets.json"))).toBe(true);

    // Verify secrets.json holds credentials while accounts.json has no cookies/tokens
    const accountsRaw = fs.readFileSync(path.join(tmpDir, "accounts.json"), "utf-8");
    expect(accountsRaw).not.toContain("SAPISID=fake_sapisid_token");
    expect(accountsRaw).not.toContain("fake_apple_media_token_123");

    const secretsRaw = fs.readFileSync(path.join(tmpDir, "secrets.json"), "utf-8");
    expect(secretsRaw).toContain("SAPISID=fake_sapisid_token");
    expect(secretsRaw).toContain("fake_apple_media_token_123");
  });

  it("allows renaming account aliases and persists changes", async () => {
    const mgr = new AccountManager(tmpDir);
    await mgr.addAppleAccount("apple_token", "dev_token", "Mobil (Apple Music)", "us");

    const accounts = mgr.getAccounts();
    expect(accounts.length).toBe(1);
    const accId = accounts[0].id;
    expect(accounts[0].localAlias).toBe("Mobil (Apple Music)");

    const updated = mgr.updateAlias(accId, "Head Unit Carplay");
    expect(updated?.localAlias).toBe("Head Unit Carplay");

    // Reload manager from disk to confirm persistence
    const reloadedMgr = new AccountManager(tmpDir);
    const reloadedAcc = reloadedMgr.getAccount(accId);
    expect(reloadedAcc?.localAlias).toBe("Head Unit Carplay");
  });

  it("removes account and corresponding secret without affecting other accounts", async () => {
    const mgr = new AccountManager(tmpDir);
    const acc1 = await mgr.addAppleAccount("tok_1", "dev_1", "Akun Pribadi", "us");
    const acc2 = await mgr.addAppleAccount("tok_2", "dev_2", "Akun Keluarga", "us");

    expect(mgr.getAccounts().length).toBe(2);

    const removed = mgr.removeAccount(acc1.id);
    expect(removed).toBe(true);
    expect(mgr.getAccounts().length).toBe(1);
    expect(mgr.getAccount(acc1.id)).toBeUndefined();
    expect(mgr.getAccount(acc2.id)).toBeDefined();

    const secretsRaw = fs.readFileSync(path.join(tmpDir, "secrets.json"), "utf-8");
    expect(secretsRaw).not.toContain("tok_1");
    expect(secretsRaw).toContain("tok_2");
  });

  it("adds multiple distinct accounts (Account A, B, C) and keeps them isolated", async () => {
    const mgr = new AccountManager(tmpDir);

    // Add 3 separate accounts
    const accA = await mgr.addAppleAccount("tok_a", undefined, "Koleksi Orang A");
    const accB = await mgr.addAppleAccount("tok_b_old", undefined, "Koleksi Orang B");
    const accC = await mgr.addAppleAccount("tok_c", undefined, "Koleksi Orang C");

    expect(mgr.getAccounts().length).toBe(3);
    expect(accA.id).not.toBe(accB.id);
    expect(accB.id).not.toBe(accC.id);

    // Verify updating an existing alias refreshes rather than duplicates
    const refreshedB = await mgr.addAppleAccount("tok_b_updated", undefined, "Koleksi Orang B");
    expect(refreshedB.id).toBe(accB.id);
    expect(mgr.getAccounts().length).toBe(3);

    // Verify secrets are isolated
    const secretsRaw = fs.readFileSync(path.join(tmpDir, "secrets.json"), "utf-8");
    expect(secretsRaw).toContain("tok_a");
    expect(secretsRaw).toContain("tok_b_updated");
    expect(secretsRaw).not.toContain("tok_b_old"); // replaced
    expect(secretsRaw).toContain("tok_c");
  });

  it("adds YouTube accounts and verifies status", async () => {
    const mgr = new AccountManager(tmpDir);
    const ytCookie = "SAPISID=fake_sapisid_xyz; __Secure-3PAPISID=fake_3p; LOGIN_INFO=fake_info;";

    // Mock fetch to simulate valid YouTube browse response
    const origFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          contents: {
            singleColumnBrowseResultsRenderer: {
              tabs: [
                {
                  tabRenderer: {
                    content: {
                      sectionListRenderer: {
                        contents: [
                          {
                            gridRenderer: {
                              items: [
                                {
                                  musicTwoRowItemRenderer: {
                                    title: { runs: [{ text: "Favorites" }] },
                                    navigationEndpoint: { browseEndpoint: { browseId: "VLPL123" } },
                                    subtitle: { runs: [{ text: "Playlist • 10 songs" }] },
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        }),
        { status: 200 }
      );

    try {
      const acc = await mgr.addYouTubeAccount(ytCookie, "Koleksi Orang D (YouTube)");
      expect(acc.platform).toBe("youtube");
      expect(acc.localAlias).toBe("Koleksi Orang D (YouTube)");
      expect(acc.status).toBe("connected");
      expect(acc.playlistCount).toBe(1);

      const retrieved = mgr.getAccount(acc.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.localAlias).toBe("Koleksi Orang D (YouTube)");
    } finally {
      global.fetch = origFetch;
    }
  });
});
