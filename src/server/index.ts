import express, { Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { YouTubeMusicClient } from "../core/ytmusic.js";
import { AppleMusicClient } from "../core/applemusic.js";
import { cleanTitle } from "../core/sanitizer.js";
import {
  TrackMetadata,
  TransferTrackItem,
} from "../shared/types.js";

const app = express();
const PORT = parseInt(process.env.APP_PORT || process.env.PORT || "3080", 10);
const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
const SESSION_FILE = path.join(DATA_DIR, "session.json");

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Session store interface
interface SavedSession {
  ytCookieString?: string;
  appleUserToken?: string;
  appleDevToken?: string;
  appleStorefront?: string;
}

let sessionData: SavedSession = {};
let ytClient: YouTubeMusicClient | null = null;
let appleClient: AppleMusicClient | null = null;
let currentProgress = { current: 0, total: 0, success: 0, failed: 0 };

function loadSavedSession() {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const raw = fs.readFileSync(SESSION_FILE, "utf-8");
      sessionData = JSON.parse(raw);
      if (sessionData.ytCookieString) {
        ytClient = new YouTubeMusicClient(sessionData.ytCookieString);
      }
      if (sessionData.appleUserToken) {
        appleClient = new AppleMusicClient(
          sessionData.appleUserToken,
          sessionData.appleDevToken
        );
      }
      console.log("Persistent session loaded successfully from:", SESSION_FILE);
    } catch (err) {
      console.warn("Failed to load session file:", err);
    }
  }
}

function persistSession() {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save session to disk:", err);
  }
}

// Load session at startup
loadSavedSession();

// 1. Get Auth Status
app.get("/api/status", async (_req: Request, res: Response) => {
  let ytCount = 0;
  if (ytClient && ytClient.hasValidAuth()) {
    try {
      const playlists = await ytClient.fetchPlaylists();
      ytCount = playlists.length;
    } catch {}
  }

  let appleCount = 0;
  let sf = sessionData.appleStorefront || "us";
  if (appleClient) {
    try {
      sf = await appleClient.getUserStorefront();
      sessionData.appleStorefront = sf;
      const applePlaylists = await appleClient.getUserPlaylists();
      appleCount = applePlaylists.length;
    } catch {}
  }

  res.json({
    youtube: {
      connected: !!ytClient && ytClient.hasValidAuth(),
      playlistCount: ytCount,
    },
    apple: {
      connected: !!appleClient,
      storefront: sf,
      playlistCount: appleCount,
    },
  });
});

// 2. Auth YouTube Music
app.post("/api/auth/youtube", async (req: Request, res: Response) => {
  const { cookieString } = req.body;
  if (!cookieString) {
    return res.status(400).json({ error: "cookieString is required" });
  }

  try {
    const client = new YouTubeMusicClient(cookieString);
    if (!client.hasValidAuth()) {
      return res.status(400).json({
        error: "Cookie must contain SAPISID or __Secure-3PAPISID",
      });
    }

    const playlists = await client.fetchPlaylists();
    ytClient = client;
    sessionData.ytCookieString = cookieString;
    persistSession();

    res.json({ success: true, playlistCount: playlists.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to authenticate YouTube Music" });
  }
});

// 3. Auth Apple Music
app.post("/api/auth/apple", async (req: Request, res: Response) => {
  const { musicUserToken, developerToken } = req.body;
  if (!musicUserToken) {
    return res.status(400).json({ error: "musicUserToken is required" });
  }

  try {
    const client = new AppleMusicClient(musicUserToken, developerToken);
    const sf = await client.getUserStorefront();
    let playlistCount = 0;
    try {
      const playlists = await client.getUserPlaylists();
      playlistCount = playlists.length;
    } catch {}

    appleClient = client;
    sessionData.appleUserToken = musicUserToken;
    sessionData.appleDevToken = developerToken;
    sessionData.appleStorefront = sf;
    persistSession();

    res.json({ success: true, storefront: sf, playlistCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to authenticate Apple Music" });
  }
});

// 4. Logout
app.post("/api/auth/logout", (req: Request, res: Response) => {
  const { service } = req.body;
  if (service === "youtube" || service === "all") {
    ytClient = null;
    delete sessionData.ytCookieString;
  }
  if (service === "apple" || service === "all") {
    appleClient = null;
    delete sessionData.appleUserToken;
    delete sessionData.appleDevToken;
    delete sessionData.appleStorefront;
  }
  persistSession();
  res.json({ success: true });
});

// 5. Fetch Playlists (supports source=youtube | apple)
app.get("/api/playlists", async (req: Request, res: Response) => {
  const source = (req.query.source as string) || "youtube";

  if (source === "apple") {
    if (!appleClient) {
      return res.status(401).json({ error: "Apple Music not connected" });
    }
    try {
      const playlists = await appleClient.getUserPlaylists();
      return res.json(playlists);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Default: YouTube Music
  if (!ytClient) {
    return res.status(401).json({ error: "YouTube Music not connected" });
  }
  try {
    const playlists = await ytClient.fetchPlaylists();
    res.json(playlists);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Fetch Tracks (supports source=youtube | apple or auto-detect by prefix)
app.get("/api/playlists/:id/tracks", async (req: Request, res: Response) => {
  const playlistId = req.params.id as string;
  const source = (req.query.source as string) || (playlistId.startsWith("p.") ? "apple" : "youtube");

  if (source === "apple") {
    if (!appleClient) {
      return res.status(401).json({ error: "Apple Music not connected" });
    }
    try {
      const tracks = await appleClient.getPlaylistTracks(playlistId);
      return res.json(tracks);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Default: YouTube Music
  if (!ytClient) {
    return res.status(401).json({ error: "YouTube Music not connected" });
  }
  try {
    const tracks = await ytClient.fetchPlaylistTracks(playlistId);
    res.json(tracks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Match Tracks (Original Title Priority - Bidirectional)
app.post("/api/tracks/match", async (req: Request, res: Response) => {
  const { tracks, targetPlatform = "apple" } = req.body as {
    tracks: TrackMetadata[];
    targetPlatform?: "apple" | "youtube";
  };

  if (!tracks || !Array.isArray(tracks)) {
    return res.status(400).json({ error: "tracks array is required" });
  }

  if (targetPlatform === "apple" && !appleClient) {
    return res.status(401).json({ error: "Apple Music not connected" });
  }

  if (targetPlatform === "youtube" && (!ytClient || !ytClient.hasValidAuth())) {
    return res.status(401).json({ error: "YouTube Music not connected" });
  }

  let sf = "us";
  if (targetPlatform === "apple" && appleClient) {
    sf = await appleClient.getUserStorefront();
  }

  const results: TransferTrackItem[] = [];

  for (const track of tracks) {
    const sanitized = cleanTitle(track.title);
    try {
      let candidate: any;
      let match: any;

      if (targetPlatform === "apple") {
        const resMatch = await appleClient!.searchWithOriginalPriority(track, sf);
        candidate = resMatch.candidate;
        match = resMatch.match;
      } else {
        const resMatch = await ytClient!.searchWithOriginalPriority(track);
        candidate = resMatch.candidate;
        match = resMatch.match;
      }

      results.push({
        source: track,
        sanitizedTitle: sanitized,
        match,
        selectedCandidate: candidate,
        excluded: match.status === "NOT_FOUND",
      });
    } catch (err) {
      console.error(`Error matching ${track.title} on ${targetPlatform}:`, err);
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

// 8. Search Catalog manually (Bidirectional)
app.post(["/api/search", "/api/search/apple", "/api/search/youtube"], async (req: Request, res: Response) => {
  const { query, targetPlatform = "apple" } = req.body;
  if (!query) return res.json([]);

  const isYt = targetPlatform === "youtube" || req.path.includes("youtube");

  if (isYt) {
    if (!ytClient || !ytClient.hasValidAuth()) {
      return res.status(401).json({ error: "YouTube Music not connected" });
    }
    try {
      const tracks = await ytClient.searchCatalog(query);
      return res.json(tracks);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Default: Apple Music
  if (!appleClient) {
    return res.status(401).json({ error: "Apple Music not connected" });
  }
  try {
    const tracks = await appleClient.searchCatalog(query);
    res.json(tracks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Transfer Progress polling
app.get("/api/transfer/progress", (_req: Request, res: Response) => {
  res.json(currentProgress);
});

// 10. Execute Transfer (Bidirectional: yt2apple or apple2yt)
app.post("/api/transfer", async (req: Request, res: Response) => {
  const { playlistTitle, items, targetPlatform = "apple" } = req.body as {
    playlistTitle: string;
    items: TransferTrackItem[];
    targetPlatform?: "apple" | "youtube";
  };

  const activeItems = (items || []).filter((item) => !item.excluded && item.selectedCandidate);
  const trackIds = activeItems.map((item) => item.selectedCandidate!.id);

  if (trackIds.length === 0) {
    return res.status(400).json({ error: "No tracks selected for transfer" });
  }

  const total = trackIds.length;
  let success = 0;
  let failed = 0;
  currentProgress = { current: 0, total, success: 0, failed: 0 };

  try {
    if (targetPlatform === "apple") {
      if (!appleClient) {
        return res.status(401).json({ error: "Apple Music not connected" });
      }

      const createdId = await appleClient.createPlaylist(playlistTitle);

      for (let i = 0; i < total; i += 25) {
        const chunk = trackIds.slice(i, i + 25);
        const resChunk = await appleClient.addTracksToPlaylist(createdId, chunk);
        success += resChunk.added;
        failed += resChunk.failed;
        currentProgress = {
          current: Math.min(i + 25, total),
          total,
          success,
          failed,
        };
      }

      return res.json({
        success: true,
        targetPlatform: "apple",
        createdPlaylistId: createdId,
        added: success,
        failed,
      });
    } else {
      // targetPlatform === "youtube"
      if (!ytClient || !ytClient.hasValidAuth()) {
        return res.status(401).json({ error: "YouTube Music not connected" });
      }

      const initialBatch = trackIds.slice(0, 25);
      const remaining = trackIds.slice(25);

      const createdId = await ytClient.createPlaylist(
        playlistTitle,
        "Imported from Apple Music via MirrorSong",
        initialBatch
      );
      success += initialBatch.length;
      currentProgress = {
        current: initialBatch.length,
        total,
        success,
        failed: 0,
      };

      if (remaining.length > 0) {
        const resChunk = await ytClient.addTracksToPlaylist(createdId, remaining);
        success += resChunk.added;
        failed += resChunk.failed;
        currentProgress = {
          current: total,
          total,
          success,
          failed,
        };
      }

      return res.json({
        success: true,
        targetPlatform: "youtube",
        createdPlaylistId: createdId,
        added: success,
        failed,
      });
    }
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MirrorSong Web Server running at http://0.0.0.0:${PORT}`);
  console.log(`Persistent data directory: ${DATA_DIR}`);
});
