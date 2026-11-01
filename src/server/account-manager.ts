import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { YouTubeMusicClient } from "../core/ytmusic.js";
import { AppleMusicClient } from "../core/applemusic.js";
import { AccountConnection, PlaylistSummary, TrackMetadata } from "../shared/types.js";

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

  private accounts: Map<string, AccountConnection> = new Map();
  private secrets: Map<string, AccountSecret> = new Map();
  private ytmClients: Map<string, YouTubeMusicClient> = new Map();
  private appleClients: Map<string, AppleMusicClient> = new Map();
  private snapshots: Map<string, SnapshotPlaylist[]> = new Map();

  constructor(dataDir: string) {
    this.dataDir = dataDir;
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

  public getAccounts(): AccountConnection[] {
    return Array.from(this.accounts.values());
  }

  public getAccount(id: string): AccountConnection | undefined {
    return this.accounts.get(id);
  }

  public getPrimaryAccount(platform: "youtube" | "apple"): AccountConnection | undefined {
    for (const acc of this.accounts.values()) {
      if (acc.platform === platform && acc.status === "connected") {
        return acc;
      }
    }
    // Fallback: return any account of that platform
    for (const acc of this.accounts.values()) {
      if (acc.platform === platform) return acc;
    }
    return undefined;
  }

  public getYTMClient(accountId: string): YouTubeMusicClient | null {
    return this.ytmClients.get(accountId) || null;
  }

  public getAppleClient(accountId: string): AppleMusicClient | null {
    return this.appleClients.get(accountId) || null;
  }

  public async addYouTubeAccount(cookieString: string, alias?: string): Promise<AccountConnection> {
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

    const acc: AccountConnection = {
      id,
      platform: "youtube",
      localAlias,
      status: initialStatus,
      errorMessage: initialError,
      createdAt: existing ? existing.createdAt : Date.now(),
      lastVerifiedAt: Date.now(),
      playlistCount,
    };

    this.accounts.set(id, acc);
    this.secrets.set(id, { id, ytCookieString: cookieString });
    this.ytmClients.set(id, client);

    this.persist();
    return acc;
  }

  public async addAppleAccount(
    musicUserToken: string,
    developerToken?: string,
    alias?: string,
    storefront?: string
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

    const acc: AccountConnection = {
      id,
      platform: "apple",
      localAlias,
      status: "connected",
      storefront: sf,
      createdAt: existing ? existing.createdAt : Date.now(),
      lastVerifiedAt: Date.now(),
      playlistCount: count,
    };

    this.accounts.set(id, acc);
    this.secrets.set(id, { id, appleUserToken: musicUserToken, appleDevToken: developerToken });
    this.appleClients.set(id, client);

    this.persist();
    return acc;
  }

  public updateAlias(id: string, newAlias: string): AccountConnection {
    const acc = this.accounts.get(id);
    if (!acc) {
      throw new Error(`Account connection with ID ${id} not found`);
    }
    acc.localAlias = newAlias.trim() || acc.localAlias;
    this.persist();
    return acc;
  }

  public async testConnection(id: string): Promise<AccountConnection> {
    const acc = this.accounts.get(id);
    if (!acc) throw new Error(`Account ${id} not found`);

    // If it's a snapshot-backed account, it is always connected with local cache
    if (this.snapshots.has(id)) {
      const snap = this.snapshots.get(id)!;
      acc.status = "connected";
      acc.playlistCount = snap.length;
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
      } else {
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
    playlists: SnapshotPlaylist[]
  ): AccountConnection {
    if (!playlists || !Array.isArray(playlists)) {
      throw new Error("playlists array is required for snapshot import");
    }

    const trimmedAlias = alias?.trim() || "YouTube Music (Mobile)";
    const existing = Array.from(this.accounts.values()).find(
      (a) => a.platform === "youtube" && a.localAlias.toLowerCase() === trimmedAlias.toLowerCase()
    );

    const id = existing
      ? existing.id
      : `acc_ytm_snap_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const acc: AccountConnection = {
      id,
      platform: "youtube",
      localAlias: trimmedAlias,
      status: "connected",
      syncType: "snapshot",
      createdAt: existing ? existing.createdAt : Date.now(),
      lastVerifiedAt: Date.now(),
      playlistCount: playlists.length,
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
    return acc;
  }

  public getPlaylistTracks(accountId: string, playlistId: string): TrackMetadata[] {
    const snap = this.snapshots.get(accountId);
    if (!snap) return [];
    const pl = snap.find(
      (p) =>
        p.id === playlistId ||
        p.id === `VL${playlistId}` ||
        `VL${p.id}` === playlistId ||
        (playlistId.startsWith("VL") && p.id === playlistId.slice(2))
    );
    return pl?.tracks || [];
  }

  public hasSnapshotTracks(accountId: string, playlistId: string): boolean {
    const snap = this.snapshots.get(accountId);
    if (!snap) return false;
    const pl = snap.find(
      (p) =>
        p.id === playlistId ||
        p.id === `VL${playlistId}` ||
        `VL${p.id}` === playlistId ||
        (playlistId.startsWith("VL") && p.id === playlistId.slice(2))
    );
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
      }));
    }

    if (acc.platform === "youtube") {
      const client = this.ytmClients.get(accountId);
      if (!client || !client.hasValidAuth()) {
        throw new Error(`YouTube Music account '${acc.localAlias}' is not authenticated`);
      }
      return client.fetchPlaylists();
    } else {
      const client = this.appleClients.get(accountId);
      if (!client) {
        throw new Error(`Apple Music account '${acc.localAlias}' is not authenticated`);
      }
      return client.getUserPlaylists();
    }
  }
}
