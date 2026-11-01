import express, { Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { cleanTitle } from "../core/sanitizer.js";
import {
  TrackMetadata,
  TransferTrackItem,
  PlaylistSummary,
  SourcePlaylistSelection,
} from "../shared/types.js";
import {
  loadDraft,
  saveDraft,
  updateDraftItem,
  startBackgroundMatching,
  isJobRunning,
} from "./matcher-worker.js";
import { AccountManager } from "./account-manager.js";
import { MergeEngine } from "./merge-engine.js";
import { initDatabase, isDbConnected } from "./db.js";
import * as authService from "./auth-service.js";

const app = express();
const PORT = parseInt(process.env.APP_PORT || process.env.PORT || "3080", 10);
const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "data");

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Database & ensure default admin user
if (process.env.NODE_ENV !== "test") {
  initDatabase()
    .then(async (ok) => {
      if (ok) {
        try {
          const admin = await authService.ensureDefaultAdmin();
          await authService.migrateLegacyDataToAdmin(admin.id, DATA_DIR);
        } catch (err) {
          console.warn("[Server] Auth initialization warning:", err);
        }
      }
    })
    .catch((err) => {
      console.warn("[Server] Database init error:", err);
    });
}

// Authentication Middleware
const authMiddleware = async (req: Request, _res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieHeader = req.headers.cookie;
    let cookieToken: string | undefined;
    if (cookieHeader) {
      const match = cookieHeader.match(/tb_token=([^;]+)/);
      if (match) cookieToken = match[1];
    }
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (cookieToken || (req.headers["x-tunebridge-token"] as string | undefined));

    if (token) {
      const user = await authService.verifyToken(token);
      if (user) {
        (req as any).user = user;
        return next();
      }
      (req as any).user = null;
      return next();
    }

    // Fallback to default admin for single-user local development mode
    const defaultAdmin = await authService.getUserByUsername("admin");
    if (defaultAdmin) {
      (req as any).user = defaultAdmin;
    }
  } catch (err) {
    // fallback gracefully
  }
  next();
};

app.use(authMiddleware);

// Initialize Multi-Account & Merge Managers
const accountManager = new AccountManager(DATA_DIR);
const mergeEngine = new MergeEngine(DATA_DIR, accountManager);

let currentProgress = { current: 0, total: 0, success: 0, failed: 0 };

// ==========================================
// 1. User Authentication APIs
// ==========================================

// POST /api/auth/register
app.post("/api/auth/register", async (req: Request, res: Response) => {
  const { username, password, role } = req.body || {};
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long" });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    await authService.register(username, password, role || "user");
    const session = await authService.login(username, password);
    res.json({ success: true, user: session.user, token: session.token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const session = await authService.login(username, password);
    res.json({ success: true, user: session.user, token: session.token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Invalid username or password" });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", (req: Request, res: Response) => {
  res.json({ user: (req as any).user || null });
});

// ==========================================
// 2. Multi-Account Management APIs
// ==========================================

// GET /api/accounts - List all connected accounts (sanitized, zero secrets exposed)
app.get("/api/accounts", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (userId && (await isDbConnected())) {
    const dbAccounts = await accountManager.loadFromDb(userId);
    return res.json(dbAccounts);
  }
  res.json(accountManager.getAccounts(userId));
});

// POST /api/accounts - Add a new connection
app.post("/api/accounts", async (req: Request, res: Response) => {
  const { platform, cookieString, musicUserToken, developerToken, alias } = req.body;
  const userId = (req as any).user?.id;

  if (platform !== "youtube" && platform !== "apple") {
    return res.status(400).json({ error: "platform must be 'youtube' or 'apple'" });
  }

  const cleanAlias = typeof alias === "string" ? alias.trim() : "";
  if (!cleanAlias) {
    return res.status(400).json({ error: "Nama akun (label) wajib diisi terlebih dahulu." });
  }

  try {
    if (platform === "youtube") {
      if (!cookieString) return res.status(400).json({ error: "cookieString is required for YouTube Music" });
      const acc = await accountManager.addYouTubeAccount(cookieString, cleanAlias, userId);
      return res.json({ success: true, account: acc });
    } else {
      if (!musicUserToken) return res.status(400).json({ error: "musicUserToken is required for Apple Music" });
      const acc = await accountManager.addAppleAccount(musicUserToken, developerToken, cleanAlias, undefined, userId);
      return res.json({ success: true, account: acc });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed adding account connection" });
  }
});

// PATCH /api/accounts/:id - Rename alias
app.patch("/api/accounts/:id", (req: Request, res: Response) => {
  const accountId = String(req.params.id);
  const newAlias = req.body.alias || req.body.localAlias;
  if (!newAlias) return res.status(400).json({ error: "alias or localAlias is required" });

  try {
    const updated = accountManager.updateAlias(accountId, newAlias);
    res.json({ success: true, account: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/accounts/:id/test - Check connection status
app.post("/api/accounts/:id/test", async (req: Request, res: Response) => {
  const accountId = String(req.params.id);
  try {
    const updated = await accountManager.testConnection(accountId);
    res.json({ success: true, account: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/:id - Remove account connection
app.delete("/api/accounts/:id", (req: Request, res: Response) => {
  const accountId = String(req.params.id);
  const removed = accountManager.removeAccount(accountId);
  if (!removed) return res.status(404).json({ error: "Account not found" });
  res.json({ success: true });
});

// GET /api/accounts/:id/playlists - Get playlists for specific account
app.get("/api/accounts/:id/playlists", async (req: Request, res: Response) => {
  const accountId = String(req.params.id);
  try {
    const playlists = await accountManager.getPlaylists(accountId);
    res.json(playlists);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/import-snapshot - Direct JSON snapshot import
app.post("/api/accounts/import-snapshot", (req: Request, res: Response) => {
  const { alias, playlists } = req.body;
  const userId = (req as any).user?.id;
  if (!playlists || !Array.isArray(playlists)) {
    return res.status(400).json({ error: "playlists array is required" });
  }
  try {
    const acc = accountManager.importSnapshotAccount(alias, playlists, userId);
    res.json({ success: true, account: acc, playlistCount: acc.playlistCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Legacy-Compatible Authentication APIs
// ==========================================

// GET /api/status - Returns primary accounts status for backward compatibility
app.get("/api/status", async (_req: Request, res: Response) => {
  const accounts = accountManager.getAccounts();
  const primaryYt = accountManager.getPrimaryAccount("youtube");
  const primaryApple = accountManager.getPrimaryAccount("apple");

  res.json({
    youtube: {
      connected: !!primaryYt && primaryYt.status === "connected",
      playlistCount: primaryYt?.playlistCount || 0,
      totalAccounts: accounts.filter((a) => a.platform === "youtube").length,
    },
    apple: {
      connected: !!primaryApple && primaryApple.status === "connected",
      storefront: primaryApple?.storefront || "us",
      playlistCount: primaryApple?.playlistCount || 0,
      totalAccounts: accounts.filter((a) => a.platform === "apple").length,
    },
  });
});

// POST /api/auth/youtube
app.post("/api/auth/youtube", async (req: Request, res: Response) => {
  const { cookieString, alias } = req.body;
  const userId = (req as any).user?.id;
  if (!cookieString) return res.status(400).json({ error: "cookieString is required" });

  try {
    const acc = await accountManager.addYouTubeAccount(cookieString, alias || "Koleksi Utama (YouTube)", userId);
    res.json({ success: true, account: acc, playlistCount: acc.playlistCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed authenticating YouTube Music" });
  }
});

// POST /api/auth/apple
app.post("/api/auth/apple", async (req: Request, res: Response) => {
  const { musicUserToken, developerToken, alias } = req.body;
  const userId = (req as any).user?.id;
  if (!musicUserToken) return res.status(400).json({ error: "musicUserToken is required" });

  try {
    const acc = await accountManager.addAppleAccount(
      musicUserToken,
      developerToken,
      alias || "Koleksi Utama (Apple)",
      undefined,
      userId
    );
    res.json({ success: true, account: acc, storefront: acc.storefront, playlistCount: acc.playlistCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed authenticating Apple Music" });
  }
});

// POST /api/auth/web-catch - Universal Browser Form Navigation Callback
// Enables 1-click account addition from mobile (iOS/Android) & remote LAN clients,
// completely bypassing Mixed-Content (HTTPS -> HTTP) and CORS blocks via top-level form POST navigation.
app.post("/api/auth/web-catch", async (req: Request, res: Response) => {
  const { platform, cookieString, musicUserToken, developerToken, alias, returnUrl } = req.body;
  const userId = (req as any).user?.id;

  if (platform !== "youtube" && platform !== "apple") {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Platform Tidak Valid</title></head>
        <body style="background:#0B0C0F;color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:32px;text-align:center;">
          <h2 style="color:#FF777F;">Platform Tidak Dikenal</h2>
          <p style="color:#A3A8B5;">Platform harus 'youtube' atau 'apple'.</p>
          <a href="/#tab=accounts" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#A99BFF;color:#0B0C0F;text-decoration:none;border-radius:12px;font-weight:600;">Kembali ke TuneBridge</a>
        </body>
      </html>
    `);
  }

  const cleanAlias = typeof alias === "string" ? alias.trim() : "";
  if (!cleanAlias) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nama Akun Diperlukan</title></head>
        <body style="background:#0B0C0F;color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:32px;text-align:center;">
          <h2 style="color:#FF777F;">Nama Akun Diperlukan</h2>
          <p style="color:#A3A8B5;">Nama akun wajib ditentukan terlebih dahulu di aplikasi sebelum menghubungkan sesi.</p>
          <a href="/#tab=accounts" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#A99BFF;color:#0B0C0F;text-decoration:none;border-radius:12px;font-weight:600;">Kembali ke TuneBridge</a>
        </body>
      </html>
    `);
  }

  try {
    let addedAcc;
    if (platform === "youtube") {
      if (req.body.payload || req.body.playlists) {
        const raw = req.body.payload || req.body.playlists;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        const plList = parsed.playlists || parsed;
        addedAcc = accountManager.importSnapshotAccount(cleanAlias, plList, userId);
      } else if (cookieString) {
        addedAcc = await accountManager.addYouTubeAccount(cookieString, cleanAlias, userId);
      } else {
        throw new Error("Data playlist atau cookie string YouTube tidak ditemukan");
      }
    } else {
      if (!musicUserToken) throw new Error("Token Apple Music kosong");
      addedAcc = await accountManager.addAppleAccount(
        musicUserToken,
        developerToken,
        cleanAlias,
        undefined,
        userId
      );
    }

    const redirectTarget = returnUrl
      ? returnUrl
      : `/#tab=accounts&status=success&platform=${platform}&alias=${encodeURIComponent(addedAcc.localAlias)}`;

    return res.redirect(redirectTarget);
  } catch (err: any) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Koneksi Gagal</title></head>
        <body style="background:#0B0C0F;color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;padding:32px;text-align:center;">
          <h2 style="color:#FF777F;margin-bottom:8px;">Gagal Menghubungkan Akun</h2>
          <p style="color:#A3A8B5;margin-bottom:20px;font-size:14px;max-width:480px;margin-left:auto;margin-right:auto;">${err.message || "Terjadi kesalahan saat memproses sesi."}</p>
          <a href="/#tab=accounts" style="display:inline-block;padding:10px 24px;background:#A99BFF;color:#0B0C0F;text-decoration:none;border-radius:12px;font-weight:600;">Kembali ke TuneBridge</a>
        </body>
      </html>
    `);
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", async (req: Request, res: Response) => {
  const { service, accountId, token } = req.body || {};
  const authHeader = req.headers.authorization;
  const sessionToken = token || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined);

  if (sessionToken) {
    await authService.logout(sessionToken);
  }

  if (accountId) {
    accountManager.removeAccount(accountId);
  } else if (service === "youtube" || service === "all") {
    const primaryYt = accountManager.getPrimaryAccount("youtube");
    if (primaryYt) accountManager.removeAccount(primaryYt.id);
  } else if (service === "apple" || service === "all") {
    const primaryApple = accountManager.getPrimaryAccount("apple");
    if (primaryApple) accountManager.removeAccount(primaryApple.id);
  }

  res.json({ success: true });
});

// ==========================================
// 3. Playlists & Tracks APIs (Account-Aware)
// ==========================================

// GET /api/playlists (supports optional accountId query)
app.get("/api/playlists", async (req: Request, res: Response) => {
  const accountId = req.query.accountId as string;
  const source = (req.query.source as string) || "youtube";

  let targetAcc = accountId
    ? accountManager.getAccount(accountId)
    : accountManager.getPrimaryAccount(source as "youtube" | "apple");

  if (!targetAcc) {
    return res.status(401).json({ error: `No connected ${source} account available` });
  }

  try {
    const playlists = await accountManager.getPlaylists(targetAcc.id);
    res.json(playlists);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/playlists/:id/tracks
app.get("/api/playlists/:id/tracks", async (req: Request, res: Response) => {
  const playlistId = req.params.id as string;
  const accountId = req.query.accountId as string;
  const source = (req.query.source as string) || (playlistId.startsWith("p.") ? "apple" : "youtube");

  let targetAcc = accountId
    ? accountManager.getAccount(accountId)
    : accountManager.getPrimaryAccount(source as "youtube" | "apple");

  if (!targetAcc) {
    return res.status(401).json({ error: `No connected ${source} account available` });
  }

  try {
    if (accountManager.hasSnapshotTracks(targetAcc.id, playlistId)) {
      const tracks = accountManager.getPlaylistTracks(targetAcc.id, playlistId);
      return res.json(tracks);
    }

    if (targetAcc.platform === "apple") {
      const client = accountManager.getAppleClient(targetAcc.id);
      if (!client) return res.status(401).json({ error: "Apple client not active" });
      const tracks = await client.getPlaylistTracks(playlistId);
      return res.json(tracks);
    } else {
      const client = accountManager.getYTMClient(targetAcc.id);
      if (!client || !client.hasValidAuth()) return res.status(401).json({ error: "YouTube client not active" });
      const tracks = await client.fetchPlaylistTracks(playlistId);
      return res.json(tracks);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Match & Search APIs
// ==========================================

app.post("/api/tracks/match", async (req: Request, res: Response) => {
  const { tracks, targetPlatform = "apple", targetAccountId } = req.body as {
    tracks: TrackMetadata[];
    targetPlatform?: "apple" | "youtube";
    targetAccountId?: string;
  };

  if (!tracks || !Array.isArray(tracks)) {
    return res.status(400).json({ error: "tracks array is required" });
  }

  const targetAcc = targetAccountId
    ? accountManager.getAccount(targetAccountId)
    : accountManager.getPrimaryAccount(targetPlatform);

  if (!targetAcc) {
    return res.status(401).json({ error: `Target ${targetPlatform} account not connected` });
  }

  let sf = targetAcc.storefront || "us";
  const results: TransferTrackItem[] = [];

  for (const track of tracks) {
    const sanitized = cleanTitle(track.title);
    try {
      let candidate: any;
      let match: any;

      if (targetPlatform === "apple") {
        const client = accountManager.getAppleClient(targetAcc.id);
        if (!client) throw new Error("Apple client not available");
        const resMatch = await client.searchWithOriginalPriority(track, sf);
        candidate = resMatch.candidate;
        match = resMatch.match;
      } else {
        const client = accountManager.getYTMClient(targetAcc.id);
        if (!client || !client.hasValidAuth()) throw new Error("YouTube client not available");
        const resMatch = await client.searchWithOriginalPriority(track);
        candidate = resMatch.candidate;
        match = resMatch.match;
      }

      const shouldExclude = match.status !== "EXACT_MATCH" || match.artistScore < 0.45;

      results.push({
        source: track,
        sanitizedTitle: sanitized,
        match,
        selectedCandidate: candidate,
        excluded: shouldExclude,
      });
    } catch (err) {
      results.push({
        source: track,
        sanitizedTitle: sanitized,
        match: {
          status: "NOT_FOUND",
          totalScore: 0,
          titleScore: 0,
          artistScore: 0,
          albumScore: 0,
          reason: "Search error",
        },
        excluded: true,
      });
    }
  }

  res.json(results);
});

app.post(["/api/search", "/api/search/apple", "/api/search/youtube"], async (req: Request, res: Response) => {
  const { query, targetPlatform = "apple", targetAccountId } = req.body;
  if (!query) return res.json([]);

  const isYt = targetPlatform === "youtube" || req.path.includes("youtube");
  const platform = isYt ? "youtube" : "apple";

  const targetAcc = targetAccountId
    ? accountManager.getAccount(targetAccountId)
    : accountManager.getPrimaryAccount(platform);

  if (!targetAcc) return res.status(401).json({ error: `${platform} account not connected` });

  try {
    if (platform === "youtube") {
      const client = accountManager.getYTMClient(targetAcc.id);
      if (!client || !client.hasValidAuth()) return res.status(401).json({ error: "YouTube client not active" });
      const tracks = await client.searchCatalog(query);
      return res.json(tracks);
    } else {
      const client = accountManager.getAppleClient(targetAcc.id);
      if (!client) return res.status(401).json({ error: "Apple client not active" });
      const tracks = await client.searchCatalog(query);
      return res.json(tracks);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. Drafts & Background Matching APIs
// ==========================================

app.get("/api/drafts/:sourcePlatform/:playlistId", (req: Request, res: Response) => {
  const sourcePlatform = String(req.params.sourcePlatform);
  const playlistId = String(req.params.playlistId);
  const draft = loadDraft(sourcePlatform, playlistId);
  const isRunning = isJobRunning(sourcePlatform, playlistId);
  res.json({ draft, isRunning });
});

app.put("/api/drafts/:sourcePlatform/:playlistId/item", (req: Request, res: Response) => {
  const sourcePlatform = String(req.params.sourcePlatform);
  const playlistId = String(req.params.playlistId);
  const { item } = req.body as { item: TransferTrackItem };
  if (!item) return res.status(400).json({ error: "item is required" });
  const updated = updateDraftItem(sourcePlatform, playlistId, item);
  res.json({ success: updated });
});

app.post("/api/matching/start", async (req: Request, res: Response) => {
  const {
    sourcePlatform,
    targetPlatform,
    playlist,
    force = false,
    sourceAccountId,
    targetAccountId,
  } = req.body as {
    sourcePlatform: "youtube" | "apple";
    targetPlatform: "apple" | "youtube";
    playlist: PlaylistSummary;
    force?: boolean;
    sourceAccountId?: string;
    targetAccountId?: string;
  };

  if (!playlist || !playlist.id) return res.status(400).json({ error: "playlist is required" });

  const sourceAcc = sourceAccountId
    ? accountManager.getAccount(sourceAccountId)
    : accountManager.getPrimaryAccount(sourcePlatform);

  const targetAcc = targetAccountId
    ? accountManager.getAccount(targetAccountId)
    : accountManager.getPrimaryAccount(targetPlatform);

  const ytClient =
    sourcePlatform === "youtube"
      ? accountManager.getYTMClient(sourceAcc?.id || "")
      : accountManager.getYTMClient(targetAcc?.id || "");

  const appleClient =
    sourcePlatform === "apple"
      ? accountManager.getAppleClient(sourceAcc?.id || "")
      : accountManager.getAppleClient(targetAcc?.id || "");

  let presetTracks: TrackMetadata[] | undefined = undefined;
  if (sourceAcc && accountManager.hasSnapshotTracks(sourceAcc.id, playlist.id)) {
    presetTracks = accountManager.getPlaylistTracks(sourceAcc.id, playlist.id);
  }

  try {
    const draft = await startBackgroundMatching(
      sourcePlatform,
      targetPlatform,
      playlist,
      ytClient,
      appleClient,
      force,
      presetTracks
    );
    res.json({ success: true, draft, isRunning: isJobRunning(sourcePlatform, playlist.id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Merge Collections & Multi-Source APIs
// ==========================================

// POST /api/workflows/merge/preview - Discover & deduplicate tracks across multiple accounts
app.post("/api/workflows/merge/preview", async (req: Request, res: Response) => {
  const { sourceSelections, deduplicationPolicy = "remove_exact" } = req.body as {
    sourceSelections: SourcePlaylistSelection[];
    deduplicationPolicy?: "remove_exact" | "keep_all" | "review_possible";
  };

  if (!sourceSelections || !Array.isArray(sourceSelections) || sourceSelections.length === 0) {
    return res.status(400).json({ error: "sourceSelections array is required" });
  }

  try {
    const discovered = await mergeEngine.fetchDiscoveredTracks(sourceSelections);
    const { uniqueTracks, duplicates } = mergeEngine.deduplicateTracks(discovered, deduplicationPolicy);

    res.json({
      totalDiscovered: discovered.length,
      uniqueCount: uniqueTracks.length,
      duplicatesCount: duplicates.length,
      uniqueTracks,
      duplicates,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed generating merge preview" });
  }
});

// GET /api/activity - Transfer audit history
app.get("/api/activity", (_req: Request, res: Response) => {
  res.json(mergeEngine.getActivityLogs());
});

// GET /api/transfer/progress
app.get("/api/transfer/progress", (_req: Request, res: Response) => {
  res.json(currentProgress);
});

// POST /api/transfer - Execute Transfer (Supports both Single & Merge Collections)
app.post("/api/transfer", async (req: Request, res: Response) => {
  const {
    playlistTitle,
    items,
    targetPlatform = "apple",
    targetAccountId,
    mode = "create",
    existingPlaylistId,
    sourcePlaylistId,
    sourcePlatform = "youtube",
    workflowName,
    sourceAliases = [],
  } = req.body as {
    playlistTitle: string;
    items: TransferTrackItem[];
    targetPlatform?: "apple" | "youtube";
    targetAccountId?: string;
    mode?: "create" | "existing";
    existingPlaylistId?: string;
    sourcePlaylistId?: string;
    sourcePlatform?: "youtube" | "apple";
    workflowName?: string;
    sourceAliases?: string[];
  };

  const activeItems = (items || []).filter((item) => !item.excluded && item.selectedCandidate);
  const trackIds = activeItems.map((item) => item.selectedCandidate!.id);

  if (trackIds.length === 0) {
    return res.status(400).json({ error: "No tracks selected for transfer" });
  }

  const targetAcc = targetAccountId
    ? accountManager.getAccount(targetAccountId)
    : accountManager.getPrimaryAccount(targetPlatform);

  if (!targetAcc) {
    return res.status(401).json({ error: `Target ${targetPlatform} account not connected` });
  }

  const total = trackIds.length;
  let success = 0;
  let failed = 0;
  currentProgress = { current: 0, total, success: 0, failed: 0 };

  try {
    let destinationId: string;

    if (targetPlatform === "apple") {
      const appleClient = accountManager.getAppleClient(targetAcc.id);
      if (!appleClient) return res.status(401).json({ error: "Target Apple Music client not connected" });

      if (mode === "existing") {
        if (!existingPlaylistId) return res.status(400).json({ error: "existingPlaylistId is required" });
        destinationId = existingPlaylistId;
      } else {
        destinationId = await appleClient.createPlaylist(playlistTitle);
      }

      for (let i = 0; i < total; i += 25) {
        const chunk = trackIds.slice(i, i + 25);
        const resChunk = await appleClient.addTracksToPlaylist(destinationId, chunk);
        success += resChunk.added;
        failed += resChunk.failed;
        currentProgress = {
          current: Math.min(i + 25, total),
          total,
          success,
          failed,
        };
      }
    } else {
      // targetPlatform === "youtube"
      const ytClient = accountManager.getYTMClient(targetAcc.id);
      if (!ytClient || !ytClient.hasValidAuth()) {
        return res.status(401).json({ error: "Target YouTube Music client not connected" });
      }

      if (mode === "existing") {
        if (!existingPlaylistId) return res.status(400).json({ error: "existingPlaylistId is required" });
        destinationId = existingPlaylistId;
        for (let i = 0; i < total; i += 25) {
          const chunk = trackIds.slice(i, i + 25);
          const resChunk = await ytClient.addTracksToPlaylist(destinationId, chunk);
          success += resChunk.added;
          failed += resChunk.failed;
          currentProgress = {
            current: Math.min(i + 25, total),
            total,
            success,
            failed,
          };
        }
      } else {
        const initialBatch = trackIds.slice(0, 25);
        const remaining = trackIds.slice(25);

        destinationId = await ytClient.createPlaylist(
          playlistTitle,
          "Imported via TuneBridge",
          initialBatch
        );
        success += initialBatch.length;
        currentProgress = { current: initialBatch.length, total, success, failed: 0 };

        if (remaining.length > 0) {
          for (let i = 0; i < remaining.length; i += 25) {
            const chunk = remaining.slice(i, i + 25);
            const resChunk = await ytClient.addTracksToPlaylist(destinationId, chunk);
            success += resChunk.added;
            failed += resChunk.failed;
            currentProgress = {
              current: Math.min(initialBatch.length + i + chunk.length, total),
              total,
              success,
              failed,
            };
          }
        }
      }
    }

    currentProgress = {
      current: total,
      total,
      success,
      failed,
    };

    // Mark draft transferred if applicable
    if (sourcePlaylistId) {
      const draft = loadDraft(sourcePlatform, sourcePlaylistId);
      if (draft) {
        draft.status = "transferred";
        saveDraft(draft);
      }
    }

    // Record audit activity log
    mergeEngine.logActivity({
      workflowName: workflowName || playlistTitle,
      sourceAliases: sourceAliases.length > 0 ? sourceAliases : [sourcePlatform === "youtube" ? "YouTube Music" : "Apple Music"],
      destinationAlias: targetAcc.localAlias,
      destinationPlatform: targetPlatform,
      totalTracks: total,
      matchedCount: activeItems.length,
      successCount: success,
      failedCount: failed,
      duplicatesRemoved: 0,
      status: failed === 0 ? "completed" : success > 0 ? "partial" : "failed",
    });

    res.json({
      success: true,
      destinationPlaylistId: destinationId,
      createdPlaylistId: destinationId,
      added: success,
      failed,
      progress: currentProgress,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static build
const distDir = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

let server: any = null;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`TuneBridge Server running at http://0.0.0.0:${PORT}`);
    console.log(`Persistent data directory: ${DATA_DIR}`);
  });
}

export { app, server, accountManager, mergeEngine };
