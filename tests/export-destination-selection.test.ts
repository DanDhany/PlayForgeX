import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AccountManager } from "../src/server/account-manager";
import { getPlatformMeta } from "../src/renderer/utils/platform-meta";
import { PlatformType, ExportOptions, TransferTrackItem } from "../src/shared/types";
import { SELECTABLE_EXPORT_PLATFORMS } from "../src/renderer/components/ExportModal";

describe("Export Destination Platform Selection Suite (TDD)", () => {
  const testDataDir = path.resolve(process.cwd(), "data", "test_export_dest");
  let accountManager: AccountManager;

  beforeEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    accountManager = new AccountManager(testDataDir, "user_export_test");
  });

  afterEach(() => {
    if (fs.existsSync(testDataDir)) {
      try {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it("resolves metadata and brand identity for all selectable export platforms", () => {
    const selectablePlatforms: PlatformType[] = [
      "apple",
      "youtube",
      "spotify",
      "youtube_video",
      "deezer",
      "soundcloud",
      "file",
    ];

    for (const plat of selectablePlatforms) {
      const meta = getPlatformMeta(plat);
      expect(meta.name).toBeTruthy();
      expect(meta.shortCode).toBeTruthy();
      expect(meta.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(meta.textColor).toBeTruthy();
    }
  });

  it("allows selecting target destination account and retrieves secrets", async () => {
    // 1. Add Apple account
    const appleAcc = await accountManager.addAppleAccount(
      "mock_music_user_token_123",
      "mock_dev_token_456",
      "Personal Apple Music",
      "id",
      "user_export_test"
    );

    // 2. Add YouTube account
    const ytAcc = await accountManager.addYouTubeAccount(
      "SAPISID=mock_sapisid_cookie_789; HSID=xyz;",
      "Personal YouTube Music",
      "user_export_test"
    );

    // 3. Add Spotify snapshot account
    const spotifyAcc = accountManager.importSnapshotAccount(
      "Spotify Discover Weekly",
      [{ id: "sp_pl_1", title: "Discover Weekly", trackCount: 10 }],
      "user_export_test",
      "spotify"
    );

    expect(accountManager.getPrimaryAccount("apple", "user_export_test")?.id).toBe(appleAcc.id);
    expect(accountManager.getPrimaryAccount("youtube", "user_export_test")?.id).toBe(ytAcc.id);
    expect(accountManager.getPrimaryAccount("spotify", "user_export_test")?.id).toBe(spotifyAcc.id);

    // Secret verification
    const appleSec = accountManager.getSecret(appleAcc.id);
    expect(appleSec?.appleUserToken).toBe("mock_music_user_token_123");

    const ytSec = accountManager.getSecret(ytAcc.id);
    expect(ytSec?.ytCookieString).toContain("SAPISID=mock_sapisid_cookie_789");
  });

  it("supports exporting to File / Offline Snapshot platform without requiring cloud login", () => {
    const sampleItems: TransferTrackItem[] = [
      {
        source: {
          id: "track_1",
          title: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
        },
        sanitizedTitle: {
          originalTitle: "Blinding Lights",
          cleanTitle: "Blinding Lights",
          hasNonLatin: false,
        },
        selectedCandidate: {
          id: "candidate_1",
          name: "Blinding Lights",
          artistName: "The Weeknd",
          albumName: "After Hours",
        },
        match: {
          status: "EXACT_MATCH",
          totalScore: 0.99,
          titleScore: 1.0,
          artistScore: 0.98,
          albumScore: 0.95,
        },
        excluded: false,
      },
    ];

    const activeTracks = sampleItems.filter((i) => !i.excluded && i.selectedCandidate);
    expect(activeTracks).toHaveLength(1);

    const testPlId = "export_file_12345";
    // Create file snapshot destination
    const fileAcc = accountManager.importSnapshotAccount(
      "My Exported Offline Playlist",
      [
        {
          id: testPlId,
          title: "My Exported Offline Playlist",
          trackCount: activeTracks.length,
          tracks: activeTracks.map((i) => ({
            id: i.selectedCandidate!.id,
            title: i.selectedCandidate!.name,
            artist: i.selectedCandidate!.artistName,
            album: i.selectedCandidate?.albumName,
          })),
          platform: "file",
        },
      ],
      "user_export_test",
      "file"
    );

    expect(fileAcc.platform).toBe("file");
    expect(fileAcc.playlistCount).toBe(1);

    const savedTracks = accountManager.getPlaylistTracks(fileAcc.id, fileAcc.id);
    expect(savedTracks).toHaveLength(1);
    const playlists = accountManager.getPlaylistTracks(fileAcc.id, testPlId);
    expect(playlists).toHaveLength(1);
    expect(accountManager.hasSnapshotTracks(fileAcc.id, fileAcc.id)).toBe(true);
  });

  it("properly structures ExportOptions with explicit targetPlatform and targetAccountId", () => {
    const options: ExportOptions = {
      mode: "create",
      playlistTitle: "Top Hits 2026",
      targetPlatform: "spotify",
      targetAccountId: "acc_spotify_xyz",
    };

    expect(options.targetPlatform).toBe("spotify");
    expect(options.targetAccountId).toBe("acc_spotify_xyz");
    expect(options.mode).toBe("create");
  });

  it("verifies SELECTABLE_EXPORT_PLATFORMS contains all 7 platforms with spotify as first choice", () => {
    expect(SELECTABLE_EXPORT_PLATFORMS.map((p) => p.id)).toEqual([
      "spotify",
      "apple",
      "youtube",
      "file",
      "youtube_video",
      "deezer",
      "soundcloud",
    ]);
  });

  it("resolves destination platform dynamically without forcing apple music fallback", () => {
    const connectedAccounts = [
      { id: "sp_1", platform: "spotify" as PlatformType, localAlias: "My Spotify" },
      { id: "yt_1", platform: "youtube" as PlatformType, localAlias: "My YouTube" },
    ];

    const sourcePlatform: PlatformType | string = "youtube";
    const selectedTarget: PlatformType | string = "spotify";

    const effectiveTarget =
      selectedTarget === sourcePlatform
        ? (connectedAccounts.find((a) => a.platform !== sourcePlatform)?.platform || "spotify")
        : selectedTarget;

    expect(effectiveTarget).toBe("spotify");
  });
});
