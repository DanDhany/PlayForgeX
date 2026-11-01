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

  let sf = sessionData.appleStorefront || "us";
  if (appleClient) {
    try {
      sf = await appleClient.getUserStorefront();
      sessionData.appleStorefront = sf;
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
    appleClient = client;
    sessionData.appleUserToken = musicUserToken;
    sessionData.appleDevToken = developerToken;
    sessionData.appleStorefront = sf;
    persistSession();

    res.json({ success: true, storefront: sf });
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

// 5. Fetch Playlists
app.get("/api/playlists", async (_req: Request, res: Response) => {
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

// 6. Fetch Tracks
app.get("/api/playlists/:id/tracks", async (req: Request, res: Response) => {
  if (!ytClient) {
    return res.status(401).json({ error: "YouTube Music not connected" });
  }
  try {
    const playlistId = req.params.id as string;
    const tracks = await ytClient.fetchPlaylistTracks(playlistId);
    res.json(tracks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Match Tracks (Original Title Priority)
app.post("/api/tracks/match", async (req: Request, res: Response) => {
  if (!appleClient) {
    return res.status(401).json({ error: "Apple Music not connected" });
  }

  const { tracks } = req.body as { tracks: TrackMetadata[] };
  if (!tracks || !Array.isArray(tracks)) {
    return res.status(400).json({ error: "tracks array is required" });
  }

  const sf = await appleClient.getUserStorefront();
  const results: TransferTrackItem[] = [];

  for (const track of tracks) {
    const sanitized = cleanTitle(track.title);
    try {
      const { candidate, match } = await appleClient.searchWithOriginalPriority(track, sf);
      results.push({
        source: track,
        sanitizedTitle: sanitized,
        match,
        selectedCandidate: candidate,
        excluded: match.status === "NOT_FOUND",
      });
    } catch (err) {
      console.error(`Error matching ${track.title}:`, err);
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

// 8. Search Apple Catalog manually
app.post("/api/search/apple", async (req: Request, res: Response) => {
  if (!appleClient) {
    return res.status(401).json({ error: "Apple Music not connected" });
  }
  const { query } = req.body;
  if (!query) return res.json([]);
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

// 10. Execute Transfer
app.post("/api/transfer", async (req: Request, res: Response) => {
  if (!appleClient) {
    return res.status(401).json({ error: "Apple Music not connected" });
  }

  const { playlistTitle, items } = req.body as {
    playlistTitle: string;
    items: TransferTrackItem[];
  };

  const activeItems = (items || []).filter((item) => !item.excluded && item.selectedCandidate);
  const songIds = activeItems.map((item) => item.selectedCandidate!.id);

  if (songIds.length === 0) {
    return res.status(400).json({ error: "No tracks selected for transfer" });
  }

  try {
    const createdId = await appleClient.createPlaylist(playlistTitle);
    const total = songIds.length;
    let success = 0;
    let failed = 0;

    currentProgress = { current: 0, total, success: 0, failed: 0 };

    for (let i = 0; i < total; i += 25) {
      const chunk = songIds.slice(i, i + 25);
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

    res.json({
      success: true,
      createdPlaylistId: createdId,
      added: success,
      failed,
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MirrorSong Web Server running at http://0.0.0.0:${PORT}`);
  console.log(`Persistent data directory: ${DATA_DIR}`);
});
