import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IPC_CHANNELS } from "../src/shared/ipc";
import {
  ServiceAuthStatus,
  TrackMetadata,
  TransferTrackItem,
  AppleMusicTrack,
} from "../src/shared/types";
import { YouTubeMusicClient } from "../src/core/ytmusic";
import { AppleMusicClient } from "../src/core/applemusic";
import { cleanTitle } from "../src/core/sanitizer";
import {
  openYouTubeLoginModal,
  openAppleMusicLoginModal,
} from "./auth-modal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory session state
let mainWindow: BrowserWindow | null = null;
let ytClient: YouTubeMusicClient | null = null;
let appleClient: AppleMusicClient | null = null;

let ytCookieString = "";
let appleUserToken = "";
let appleDevToken = "";
let appleStorefront = "us";
let ytPlaylistsCount = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0B0E14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../index.html"));
  }
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function setupIpcHandlers() {
  // 1. Get Auth Status
  ipcMain.handle(IPC_CHANNELS.GET_STATUS, async (): Promise<ServiceAuthStatus> => {
    return {
      youtube: {
        connected: !!ytClient && ytClient.hasValidAuth(),
        playlistCount: ytPlaylistsCount,
      },
      apple: {
        connected: !!appleClient,
        storefront: appleStorefront,
      },
    };
  });

  // 2. Login YouTube Music
  ipcMain.handle(IPC_CHANNELS.LOGIN_YOUTUBE, async () => {
    if (!mainWindow) return { success: false, error: "Main window not ready" };
    try {
      const res = await openYouTubeLoginModal(mainWindow);
      if (res.success && res.cookieString) {
        ytCookieString = res.cookieString;
        ytClient = new YouTubeMusicClient(ytCookieString);
        try {
          const playlists = await ytClient.fetchPlaylists();
          ytPlaylistsCount = playlists.length;
        } catch {}
        return { success: true };
      }
      return { success: false, error: res.error || "Login canceled" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // 3. Login Apple Music
  ipcMain.handle(IPC_CHANNELS.LOGIN_APPLE, async () => {
    if (!mainWindow) return { success: false, error: "Main window not ready" };
    try {
      const res = await openAppleMusicLoginModal(mainWindow);
      if (res.success && res.musicUserToken) {
        appleUserToken = res.musicUserToken;
        appleDevToken = res.developerToken || "";
        appleClient = new AppleMusicClient(appleUserToken, appleDevToken);
        appleStorefront = await appleClient.getUserStorefront();
        return { success: true, storefront: appleStorefront };
      }
      return { success: false, error: res.error || "Login canceled" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // 4. Logout
  ipcMain.handle(IPC_CHANNELS.LOGOUT, async (_event, service: "youtube" | "apple" | "all") => {
    if (service === "youtube" || service === "all") {
      ytClient = null;
      ytCookieString = "";
      ytPlaylistsCount = 0;
    }
    if (service === "apple" || service === "all") {
      appleClient = null;
      appleUserToken = "";
      appleDevToken = "";
    }
  });

  // 5. Fetch Playlists
  ipcMain.handle(IPC_CHANNELS.FETCH_PLAYLISTS, async () => {
    if (!ytClient) throw new Error("YouTube Music not connected");
    const playlists = await ytClient.fetchPlaylists();
    ytPlaylistsCount = playlists.length;
    return playlists;
  });

  // 6. Fetch Tracks
  ipcMain.handle(IPC_CHANNELS.FETCH_TRACKS, async (_event, playlistId: string) => {
    if (!ytClient) throw new Error("YouTube Music not connected");
    return ytClient.fetchPlaylistTracks(playlistId);
  });

  // 7. Match Tracks against Apple Music Catalog (original title first)
  ipcMain.handle(IPC_CHANNELS.MATCH_TRACKS, async (_event, tracks: TrackMetadata[]): Promise<TransferTrackItem[]> => {
    if (!appleClient) throw new Error("Apple Music not connected");

    const results: TransferTrackItem[] = [];
    const sf = await appleClient.getUserStorefront();

    // Process matching with concurrency limit
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
        console.error(`Error matching track ${track.title}:`, err);
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

    return results;
  });

  // 8. Search Apple Catalog manually for override
  ipcMain.handle(IPC_CHANNELS.SEARCH_APPLE_CATALOG, async (_event, query: string): Promise<AppleMusicTrack[]> => {
    if (!appleClient) throw new Error("Apple Music not connected");
    return appleClient.searchCatalog(query);
  });

  // 9. Execute Transfer
  ipcMain.handle(
    IPC_CHANNELS.EXECUTE_TRANSFER,
    async (
      _event,
      playlistTitle: string,
      items: TransferTrackItem[]
    ): Promise<{ success: boolean; createdPlaylistId?: string; error?: string }> => {
      if (!appleClient) throw new Error("Apple Music not connected");

      try {
        const activeItems = items.filter((item) => !item.excluded && item.selectedCandidate);
        const songIds = activeItems.map((item) => item.selectedCandidate!.id);

        if (songIds.length === 0) {
          throw new Error("No tracks selected for transfer");
        }

        // Create Apple Music playlist
        const createdId = await appleClient.createPlaylist(playlistTitle);

        // Add tracks in batch with progress notifications
        const total = songIds.length;
        let success = 0;
        let failed = 0;

        for (let i = 0; i < total; i += 25) {
          const chunk = songIds.slice(i, i + 25);
          const res = await appleClient.addTracksToPlaylist(createdId, chunk);
          success += res.added;
          failed += res.failed;

          if (mainWindow) {
            mainWindow.webContents.send(IPC_CHANNELS.ON_TRANSFER_PROGRESS, {
              current: Math.min(i + 25, total),
              total,
              success,
              failed,
            });
          }
        }

        return { success: true, createdPlaylistId: createdId };
      } catch (err: any) {
        console.error("Transfer execution error:", err);
        return { success: false, error: err.message };
      }
    }
  );
}
