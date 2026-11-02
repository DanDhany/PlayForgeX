import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { YouTubeMusicClient } from "../core/ytmusic.js";
import { AppleMusicClient } from "../core/applemusic.js";
import { PlatformRegistry, PlatformId } from "../core/platform-registry.js";
import { AccountConnection, PlaylistSummary, TrackMetadata, PlatformType } from "../shared/types.js";
import { query, isDbConnected } from "./db.js";

interface AccountSecret {
  id: string;
  ytCookieString?: string;
  appleUserToken?: string;
  appleDevToken?: string;
}

export interface SnapshotPlaylist extends PlaylistSummary {
  tracks?: TrackMetadata[];
}

export class AccountManager {
  private dataDir: string;
  private accountsFile: string;
  private secretsFile: string;
  private legacySessionFile: string;
  private snapshotsDir: string;
  private userId?: string;

  private accounts: Map<string, AccountConnection> = new Map();
  private secrets: Map<string, AccountSecret> = new Map();
  private ytmClients: Map<string, YouTubeMusicClient> = new Map();
  private appleClients: Map<string, AppleMusicClient> = new Map();
  private snapshots: Map<string, SnapshotPlaylist[]> = new Map();

  constructor(dataDir: string, userId?: string) {
    this.dataDir = dataDir;
    this.userId = userId;
    this.accountsFile = path.join(dataDir, "accounts.json");
    this.secretsFile = path.join(dataDir, "secrets.json");
    this.legacySessionFile = path.join(dataDir, "session.json");
    this.snapshotsDir = path.join(dataDir, "snapshots");

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }

    this.loadAndMigrate();
  }

  private loadAndMigrate(): void {
    let hasLoaded = false;

    // 1. Load accounts metadata
    if (fs.existsSync(this.accountsFile)) {
      try {
        const raw = fs.readFileSync(this.accountsFile, "utf-8");
        const list: AccountConnection[] = JSON.parse(raw);
        for (const acc of list) {
          this.accounts.set(acc.id, acc);
        }
        hasLoaded = true;
      } catch (err) {
        console.warn("[AccountManager] Failed reading accounts.json:", err);
      }
    }

    // 2. Load protected secrets
    if (fs.existsSync(this.secretsFile)) {
      try {
        const raw = fs.readFileSync(this.secretsFile, "utf-8");
        const list: AccountSecret[] = JSON.parse(raw);
        for (const sec of list) {
          this.secrets.set(sec.id, sec);
        }
      } catch (err) {
        console.warn("[AccountManager] Failed reading secrets.json:", err);
      }
    }

    // 3. Backward-compatible migration from legacy session.json
    if (!hasLoaded && fs.existsSync(this.legacySessionFile)) {
      try {
        console.log("[AccountManager] Migrating legacy session.json to multi-account schema...");
        const raw = fs.readFileSync(this.legacySessionFile, "utf-8");
        const legacy = JSON.parse(raw);

        if (legacy.ytCookieString) {
          const id = "acc_ytm_primary";
          const acc: AccountConnection = {
            id,
            platform: "youtube",
            localAlias: "Koleksi Utama (YouTube Music)",
            status: "connected",
            createdAt: Date.now(),
            lastVerifiedAt: Date.now(),
          };
          this.accounts.set(id, acc);
          this.secrets.set(id, { id, ytCookieString: legacy.ytCookieString });
        }

        if (legacy.appleUserToken) {
          const id = "acc_apple_primary";
          const acc: AccountConnection = {
            id,
            platform: "apple",
            localAlias: "Koleksi Utama (Apple Music)",
            status: "connected",
            storefront: legacy.appleStorefront || "us",
            createdAt: Date.now(),
            lastVerifiedAt: Date.now(),
          };
          this.accounts.set(id, acc);
          this.secrets.set(id, {
            id,
            appleUserToken: legacy.appleUserToken,
            appleDevToken: legacy.appleDevToken,
          });
        }

        this.persist();
      } catch (err) {
        console.warn("[AccountManager] Failed migrating legacy session:", err);
      }
    }

    // 4. Load snapshots
    if (fs.existsSync(this.snapshotsDir)) {
      try {
        const files = fs.readdirSync(this.snapshotsDir);
        for (const file of files) {
          if (file.endsWith(".json")) {
            const accId = file.replace(/\.json$/, "");
            const raw = fs.readFileSync(path.join(this.snapshotsDir, file), "utf-8");
            const data: SnapshotPlaylist[] = JSON.parse(raw);
            this.snapshots.set(accId, data);
          }
        }
      } catch (err) {
        console.warn("[AccountManager] Failed loading snapshots:", err);
      }
    }

    // 5. Instantiate clients for active accounts
    this.initializeClients();
  }

  private initializeClients(): void {
    for (const [id, acc] of this.accounts.entries()) {
      const sec = this.secrets.get(id);
      if (!sec) continue;

      if (acc.platform === "youtube" && sec.ytCookieString) {
        try {
          const client = new YouTubeMusicClient(sec.ytCookieString);
          if (client.hasValidAuth()) {
            this.ytmClients.set(id, client);
          }
        } catch {}
      } else if (acc.platform === "apple" && sec.appleUserToken) {
        try {
          const client = new AppleMusicClient(sec.appleUserToken, sec.appleDevToken);
          this.appleClients.set(id, client);
        } catch {}
      }
    }
  }

  private persist(): void {
    try {
      const accountsList = Array.from(this.accounts.values());
      fs.writeFileSync(this.accountsFile, JSON.stringify(accountsList, null, 2), "utf-8");

      const secretsList = Array.from(this.secrets.values());
      fs.writeFileSync(this.secretsFile, JSON.stringify(secretsList, null, 2), "utf-8");
    } catch (err) {
      console.error("[AccountManager] Failed to persist accounts/secrets:", err);
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getUserId(): string | undefined {
    return this.userId;
  }

  public getAccounts(userId?: string): AccountConnection[] {
    const list = Array.from(this.accounts.values());
    const targetUser = userId || this.userId;
    if (!targetUser) return list;
    return list.filter((a) => a.userId === targetUser);
  }

  public async loadFromDb(userId?: string): Promise<AccountConnection[]> {
    const targetUserId = userId || this.userId;
    const isConnected = await isDbConnected();
    if (!isConnected || !targetUserId) {
      return this.getAccounts(targetUserId);
    }
    if (!isConnected) {
      return this.getAccounts(targetUserId);
    }

    try {
      const [rows] = await query<any[]>(
        "SELECT id, user_id, platform, label, is_active, metadata, created_at, updated_at FROM accounts WHERE user_id = ? AND is_active = 1",
        [targetUserId]
      );

      if (!rows || rows.length === 0) {
        return this.getAccounts(targetUserId);
      }

      const accountIds: string[] = [];
      for (const row of rows) {
        let meta: any = {};
        try {
          meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata || {};
        } catch {}

        const acc: AccountConnection = {
          id: row.id,
          platform: row.platform,
          localAlias: row.label,
          status: meta.status || "connected",
          storefront: meta.storefront,
          playlistCount: meta.playlistCount || 0,
          syncType: meta.syncType || "live",
          errorMessage: meta.errorMessage,
          createdAt: Number(row.created_at),
          lastVerifiedAt: meta.lastVerifiedAt ? Number(meta.lastVerifiedAt) : Number(row.updated_at),
          userId: row.user_id,
        };
        this.accounts.set(acc.id, acc);
        accountIds.push(acc.id);
      }

      if (accountIds.length > 0) {
        const placeholders = accountIds.map(() => "?").join(",");
        const [secretsRows] = await query<any[]>(
          `SELECT id, account_id, cookies, developer_token, user_token, updated_at FROM account_secrets WHERE account_id IN (${placeholders})`,
          accountIds
        );

        for (const sec of secretsRows || []) {
          this.secrets.set(sec.account_id, {
            id: sec.account_id,
            ytCookieString: sec.cookies || undefined,
            appleUserToken: sec.user_token || undefined,
            appleDevToken: sec.developer_token || undefined,
          });
        }

        const [snapRows] = await query<any[]>(
          `SELECT account_id, snapshot_data FROM snapshots WHERE account_id IN (${placeholders})`,
          accountIds
        );

        for (const s of snapRows || []) {
          try {
            const data = JSON.parse(s.snapshot_data);
            this.snapshots.set(s.account_id, data);
          } catch {}
        }
      }

      this.initializeClients();
      return this.getAccounts(targetUserId);
    } catch (err) {
      console.warn("[AccountManager] Failed loading from database, fallback to cache:", err);
      return this.getAccounts(targetUserId);
    }
  }

  public async saveAccountToDb(
    account: AccountConnection,
    secret?: AccountSecret,
    targetUserId?: string
  ): Promise<void> {
    const uid = targetUserId || account.userId || this.userId;
    if (!uid) return;

    const connected = await isDbConnected();
    if (!connected) return;

    try {
      const metadata = JSON.stringify({
        status: account.status,
        storefront: account.storefront,
        playlistCount: account.playlistCount,
        syncType: account.syncType,
        errorMessage: account.errorMessage,
        lastVerifiedAt: account.lastVerifiedAt,
      });

      await query(
        `INSERT INTO accounts (id, user_id, platform, label, is_active, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           label = VALUES(label),
           metadata = VALUES(metadata),
           updated_at = VALUES(updated_at)`,
        [
          account.id,
          uid,
          account.platform,
          account.localAlias,
          metadata,
          account.createdAt,
          account.lastVerifiedAt || Date.now(),
        ]
      );

      const sec = secret || this.secrets.get(account.id);
      if (sec) {
        await query(
          `INSERT INTO account_secrets (id, account_id, cookies, developer_token, user_token, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             cookies = VALUES(cookies),
             developer_token = VALUES(developer_token),
             user_token = VALUES(user_token),
             updated_at = VALUES(updated_at)`,
          [
            `sec_${account.id}`,
            account.id,
            sec.ytCookieString || null,
            sec.appleDevToken || null,
            sec.appleUserToken || null,
            Date.now(),
          ]
        );
      }

      const snap = this.snapshots.get(account.id);
      if (snap) {
        await query(
          `INSERT INTO snapshots (id, user_id, account_id, snapshot_data, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             snapshot_data = VALUES(snapshot_data)`,
          [
            `snap_${account.id}`,
            uid,
            account.id,
            JSON.stringify(snap),
            Date.now(),
          ]
        );
      }
    } catch (err) {
      console.warn("[AccountManager] Failed saving account to DB:", err);
    }
  }

  public async removeAccountFromDb(accountId: string): Promise<boolean> {
    const connected = await isDbConnected();
    if (!connected) return false;
    try {
      const [res] = await query<any>("DELETE FROM accounts WHERE id = ?", [accountId]);
      return Boolean(res?.affectedRows && res.affectedRows > 0);
    } catch (err) {
      console.warn("[AccountManager] Failed removing account from DB:", err);
      return false;
    }
  }

  public static async getAccountsByUserId(userId: string): Promise<AccountConnection[]> {
    const connected = await isDbConnected();
    if (!connected) return [];
    try {
      const [rows] = await query<any[]>(
        "SELECT id, user_id, platform, label, is_active, metadata, created_at, updated_at FROM accounts WHERE user_id = ? AND is_active = 1",
        [userId]
      );
      return (rows || []).map((row) => {
        let meta: any = {};
        try {
          meta = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata || {};
        } catch {}
        return {
          id: row.id,
          platform: row.platform,
          localAlias: row.label,
          status: meta.status || "connected",
          storefront: meta.storefront,
          playlistCount: meta.playlistCount || 0,
          syncType: meta.syncType || "live",
          errorMessage: meta.errorMessage,
          createdAt: Number(row.created_at),
          lastVerifiedAt: meta.lastVerifiedAt ? Number(meta.lastVerifiedAt) : Number(row.updated_at),
          userId: row.user_id,
        };
      });
    } catch {
      return [];
    }
  }

  public getAccount(id: string): AccountConnection | undefined {
    return this.accounts.get(id);
  }

  public getPrimaryAccount(platform: PlatformType | string, userId?: string): AccountConnection | undefined {
    const targetUser = userId || this.userId;
    for (const acc of this.accounts.values()) {
      if (acc.platform === platform && acc.status === "connected") {
        if (!targetUser || acc.userId === targetUser) {
          return acc;
        }
      }
    }
    // Fallback: return any account of that platform
    for (const acc of this.accounts.values()) {
      if (acc.platform === platform) {
        if (!targetUser || acc.userId === targetUser) {
          return acc;
        }
      }
    }
    return undefined;
  }

  public getYTMClient(accountId: string): YouTubeMusicClient | null {
    return this.ytmClients.get(accountId) || null;
  }

  public getAppleClient(accountId: string): AppleMusicClient | null {
    return this.appleClients.get(accountId) || null;
  }

  public async addYouTubeAccount(
    cookieString: string,
    alias?: string,
    targetUserId?: string
  ): Promise<AccountConnection> {
    const client = new YouTubeMusicClient(cookieString);
    if (!client.hasValidAuth()) {
      throw new Error("Cookie must contain valid SAPISID or __Secure-3PAPISID");
    }

    // Verify by fetching playlists if possible
    let playlistCount = 0;
    let initialStatus: "connected" | "reauth_required" = "connected";
    let initialError: string | undefined = undefined;

    try {
      const playlists = await client.fetchPlaylists();
      playlistCount = playlists.length;
    } catch (err: any) {
      console.warn("[AccountManager] Playlist fetch check warning:", err?.message);
      if (err?.message?.includes("Sign-in required")) {
        initialStatus = "reauth_required";
        initialError = err.message;
      }
    }

    // Reuse existing account if matching alias already exists, otherwise generate unique id
    const existing = alias?.trim()
      ? Array.from(this.accounts.values()).find(
          (a) => a.platform === "youtube" && a.localAlias.toLowerCase() === alias.trim().toLowerCase()
        )
      : undefined;

    const id = existing ? existing.id : `acc_ytm_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const localAlias = alias?.trim() || existing?.localAlias || (playlistCount > 0 ? `YouTube Music (${playlistCount} lagu)` : "YouTube Music");
    const uid = targetUserId || this.userId;

    const acc: AccountConnection = {
      id,
      platform: "youtube",
      localAlias,
      status: initialStatus,
      errorMessage: initialError,
      createdAt: existing ? existing.createdAt : Date.now(),
      lastVerifiedAt: Date.now(),
      playlistCount,
      userId: uid,
    };

    const sec = { id, ytCookieString: cookieString };
    this.accounts.set(id, acc);
    this.secrets.set(id, sec);
    this.ytmClients.set(id, client);

    this.persist();
    if (uid) {
      this.saveAccountToDb(acc, sec, uid).catch(() => {});
    }
    return acc;
  }

  public async addAppleAccount(
    musicUserToken: string,
    developerToken?: string,
    alias?: string,
    storefront?: string,
    targetUserId?: string
  ): Promise<AccountConnection> {
    const client = new AppleMusicClient(musicUserToken, developerToken);
    let sf = storefront;
    if (!sf) {
      try {
        sf = await client.getUserStorefront();
      } catch {
        sf = "us";
      }
    }

    let count = 0;
    try {
      const pl = await client.getUserPlaylists();
      count = pl.length;
    } catch {}

    const existing = alias?.trim()
      ? Array.from(this.accounts.values()).find(
          (a) => a.platform === "apple" && a.localAlias.toLowerCase() === alias.trim().toLowerCase()
        )
      : undefined;

    const id = existing ? existing.id : `acc_apple_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const localAlias = alias?.trim() || existing?.localAlias || `Apple Music (${sf.toUpperCase()})`;
    const uid = targetUserId || this.userId;

    const acc: AccountConnection = {
      id,
      platform: "apple",
      localAlias,
      status: "connected",
      storefront: sf,
      createdAt: existing ? existing.createdAt : Date.now(),
      lastVerifiedAt: Date.now(),
      playlistCount: count,
      userId: uid,
    };

    const sec = { id, appleUserToken: musicUserToken, appleDevToken: developerToken };
    this.accounts.set(id, acc);
    this.secrets.set(id, sec);
    this.appleClients.set(id, client);

    this.persist();
    if (uid) {
      this.saveAccountToDb(acc, sec, uid).catch(() => {});
    }
    return acc;
  }

  public updateAlias(id: string, newAlias: string): AccountConnection {
    const acc = this.accounts.get(id);
    if (!acc) {
      throw new Error(`Account connection with ID ${id} not found`);
    }
    acc.localAlias = newAlias.trim() || acc.localAlias;
    this.persist();
    if (this.userId || acc.userId) {
      this.saveAccountToDb(acc).catch(() => {});
    }
    return acc;
  }

  public async testConnection(id: string): Promise<AccountConnection> {
    const acc = this.accounts.get(id);
    if (!acc) throw new Error(`Account ${id} not found`);

    // 1. If it's a snapshot-backed account, check memory or disk cache
    if (this.snapshots.has(id)) {
      const snap = this.snapshots.get(id)!;
      acc.status = "connected";
      acc.playlistCount = snap.length;
      acc.lastVerifiedAt = Date.now();
      acc.errorMessage = undefined;
      this.persist();
      return acc;
    }

    const snapPath = path.join(this.snapshotsDir, `${id}.json`);
    if (fs.existsSync(snapPath)) {
      try {
        const raw = fs.readFileSync(snapPath, "utf-8");
        const snap = JSON.parse(raw);
        this.snapshots.set(id, snap);
        acc.status = "connected";
        acc.playlistCount = snap.length;
        acc.lastVerifiedAt = Date.now();
        acc.errorMessage = undefined;
        this.persist();
        return acc;
      } catch {}
    }

    if (acc.syncType === "snapshot") {
      acc.status = "connected";
      acc.lastVerifiedAt = Date.now();
      acc.errorMessage = undefined;
      this.persist();
      return acc;
    }

    acc.status = "checking";

    try {
      if (acc.platform === "youtube") {
        const client = this.ytmClients.get(id);
        if (!client || !client.hasValidAuth()) {
          acc.status = "reauth_required";
          acc.errorMessage = "Missing valid SAPISID session cookie";
        } else {
          const pl = await client.fetchPlaylists();
          acc.status = "connected";
          acc.playlistCount = pl.length;
          acc.lastVerifiedAt = Date.now();
          acc.errorMessage = undefined;
        }
      } else if (acc.platform === "apple") {
        const client = this.appleClients.get(id);
        if (!client) {
          acc.status = "reauth_required";
          acc.errorMessage = "Missing valid Music-User-Token";
        } else {
          const sf = await client.getUserStorefront();
          acc.storefront = sf;
          const pl = await client.getUserPlaylists();
          acc.status = "connected";
          acc.playlistCount = pl.length;
          acc.lastVerifiedAt = Date.now();
          acc.errorMessage = undefined;
        }
      } else {
        // Platform registry adapters (spotify, youtube_video, deezer, soundcloud, file, etc.)
        const adapter = PlatformRegistry.getAdapter(acc.platform as PlatformId);
        if (!adapter) {
          acc.status = "connected";
          acc.lastVerifiedAt = Date.now();
          acc.errorMessage = undefined;
        } else {
          const sec = this.secrets.get(id);
          const creds = sec?.ytCookieString || sec?.appleUserToken;
          try {
            if (typeof adapter.fetchPlaylists === "function") {
              const pls = await adapter.fetchPlaylists(creds);
              acc.status = "connected";
              if (pls.length > 0) {
                acc.playlistCount = pls.length;
              }
            } else {
              acc.status = "connected";
            }
            acc.lastVerifiedAt = Date.now();
            acc.errorMessage = undefined;
          } catch (err: any) {
            if (acc.playlistCount && acc.playlistCount > 0) {
              acc.status = "connected";
              acc.lastVerifiedAt = Date.now();
              acc.errorMessage = undefined;
            } else {
              acc.status = "error";
              acc.errorMessage = err.message || "Connection verification failed";
            }
          }
        }
      }
    } catch (err: any) {
      acc.status = err?.message?.includes("Sign-in required") ? "reauth_required" : "error";
      acc.errorMessage = err.message || "Failed verifying connection";
    }

    this.persist();
    return acc;
  }

  public importSnapshotAccount(
    alias: string,
    playlists: SnapshotPlaylist[],
    targetUserId?: string,
    platform: string = "youtube"
  ): AccountConnection {
    if (!playlists || !Array.isArray(playlists)) {
      throw new Error("playlists array is required for snapshot import");
    }

    for (const pl of playlists) {
      pl.platform = (pl.platform || platform) as any;
    }

    const trimmedAlias = alias?.trim() || `${platform} Library`;
    const existing = Array.from(this.accounts.values()).find(
      (a) => a.platform === platform && a.localAlias.toLowerCase() === trimmedAlias.toLowerCase()
    );

    const id = existing
      ? existing.id
      : `acc_${platform}_snap_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const uid = targetUserId || this.userId;

    const acc: AccountConnection = {
      id,
      platform: platform as any,
      localAlias: trimmedAlias,
      status: "connected",
      syncType: "snapshot",
      createdAt: existing ? existing.createdAt : Date.now(),
      lastVerifiedAt: Date.now(),
      playlistCount: playlists.length,
      userId: uid,
    };

    this.accounts.set(id, acc);
    this.snapshots.set(id, playlists);

    try {
      const snapPath = path.join(this.snapshotsDir, `${id}.json`);
      fs.writeFileSync(snapPath, JSON.stringify(playlists, null, 2), "utf-8");
    } catch (err) {
      console.error("[AccountManager] Failed saving snapshot file:", err);
    }

    this.persist();
    if (uid) {
      this.saveAccountToDb(acc, undefined, uid).catch(() => {});
    }
    return acc;
  }

  public getSecret(id: string): AccountSecret | undefined {
    return this.secrets.get(id);
  }

  public getPlaylistTracks(accountId: string, playlistId: string): TrackMetadata[] {
    const snap = this.snapshots.get(accountId);
    if (!snap) return [];
    const pl =
      snap.find(
        (p) =>
          p.id === playlistId ||
          p.id === `VL${playlistId}` ||
          `VL${p.id}` === playlistId ||
          (playlistId.startsWith("VL") && p.id === playlistId.slice(2))
      ) || (playlistId === accountId && snap.length === 1 ? snap[0] : undefined);
    return pl?.tracks || [];
  }

  public hasSnapshotTracks(accountId: string, playlistId: string): boolean {
    const snap = this.snapshots.get(accountId);
    if (!snap) return false;
    const pl =
      snap.find(
        (p) =>
          p.id === playlistId ||
          p.id === `VL${playlistId}` ||
          `VL${p.id}` === playlistId ||
          (playlistId.startsWith("VL") && p.id === playlistId.slice(2))
      ) || (playlistId === accountId && snap.length === 1 ? snap[0] : undefined);
    return Boolean(pl && pl.tracks && pl.tracks.length > 0);
  }

  public removeAccount(id: string): boolean {
    const existed = this.accounts.delete(id);
    this.secrets.delete(id);
    this.ytmClients.delete(id);
    this.appleClients.delete(id);
    this.snapshots.delete(id);

    try {
      const snapPath = path.join(this.snapshotsDir, `${id}.json`);
      if (fs.existsSync(snapPath)) {
        fs.unlinkSync(snapPath);
      }
    } catch (err) {
      console.warn("[AccountManager] Failed deleting snapshot file:", err);
    }

    if (existed) {
      this.persist();
      this.removeAccountFromDb(id).catch(() => {});
    }
    return existed;
  }

  public async getPlaylists(accountId: string): Promise<PlaylistSummary[]> {
    const acc = this.accounts.get(accountId);
    if (!acc) throw new Error(`Account ${accountId} not found`);

    if (this.snapshots.has(accountId)) {
      const snap = this.snapshots.get(accountId)!;
      return snap.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        trackCount: p.tracks?.length || p.trackCount || 0,
        thumbnailUrl: p.thumbnailUrl,
        platform: p.platform || acc.platform,
      }));
    }

    if (acc.platform === "youtube") {
      const client = this.ytmClients.get(accountId);
      if (!client || !client.hasValidAuth()) {
        throw new Error(`YouTube Music account '${acc.localAlias}' is not authenticated`);
      }
      const pls = await client.fetchPlaylists();
      return pls.map((p) => ({ ...p, platform: "youtube" }));
    } else if (acc.platform === "apple") {
      const client = this.appleClients.get(accountId);
      if (!client) {
        throw new Error(`Apple Music account '${acc.localAlias}' is not authenticated`);
      }
      const pls = await client.getUserPlaylists();
      return pls.map((p) => ({ ...p, platform: "apple" }));
    } else {
      const adapter = PlatformRegistry.getAdapter(acc.platform as PlatformId);
      if (adapter && adapter.fetchPlaylists) {
        const sec = this.secrets.get(accountId);
        const pls = await adapter.fetchPlaylists(sec);
        return pls.map((p) => ({ ...p, platform: acc.platform }));
      }
      return [];
    }
  }
}
