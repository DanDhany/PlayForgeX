import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AccountManager } from "../src/server/account-manager";
import { MergeEngine } from "../src/server/merge-engine";
import { startBackgroundMatching, loadDraft } from "../src/server/matcher-worker";
import { TrackMetadata, SourcePlaylistSelection, PlatformType } from "../src/shared/types";

describe("Merge Workflow & Multi-Platform Export Suite (TDD)", () => {
  const testDataDir = path.resolve(process.cwd(), "data", "test_merge_export");
  let accountManager: AccountManager;
  let mergeEngine: MergeEngine;

  beforeEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    accountManager = new AccountManager(testDataDir, "user_merge_test");
    mergeEngine = new MergeEngine(testDataDir, accountManager);
  });

  afterEach(() => {
    if (fs.existsSync(testDataDir)) {
      try {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      } catch {}
    }
  });

  it("discovers tracks from multiple platforms and deduplicates with remove_exact policy", async () => {
    // 1. Setup YouTube Playlist
    const ytTracks: TrackMetadata[] = [
      { id: "yt_1", videoId: "yt_1", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming" },
      { id: "yt_2", videoId: "yt_2", title: "Starboy", artist: "The Weeknd", album: "Starboy" },
    ];
    const ytAcc = accountManager.importSnapshotAccount("YT Playlist", [
      { id: "pl_yt", title: "YT Synth", trackCount: 2, tracks: ytTracks, platform: "youtube" }
    ], "user_merge_test", "youtube");

    // 2. Setup Spotify Playlist with a duplicate track
    const spTracks: TrackMetadata[] = [
      { id: "sp_1", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming" }, // Duplicate
      { id: "sp_2", title: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories" },
    ];
    const spAcc = accountManager.importSnapshotAccount("SP Playlist", [
      { id: "pl_sp", title: "SP Synth", trackCount: 2, tracks: spTracks, platform: "spotify" }
    ], "user_merge_test", "spotify");

    const sourceSelections: SourcePlaylistSelection[] = [
      {
        accountId: ytAcc.id,
        accountAlias: ytAcc.localAlias,
        platform: "youtube",
        playlistId: "pl_yt",
        playlistTitle: "YT Synth",
        trackCount: 2,
      },
      {
        accountId: spAcc.id,
        accountAlias: spAcc.localAlias,
        platform: "spotify",
        playlistId: "pl_sp",
        playlistTitle: "SP Synth",
        trackCount: 2,
      },
    ];

    const discovered = await mergeEngine.fetchDiscoveredTracks(sourceSelections);
    expect(discovered).toHaveLength(4);

    const { uniqueTracks, duplicates } = mergeEngine.deduplicateTracks(discovered, "remove_exact");
    expect(uniqueTracks).toHaveLength(3);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].track.title).toBe("Midnight City");
  });

  it("matches presetTracks into target platform 'spotify' without scraping source platform", async () => {
    const presetTracks: TrackMetadata[] = [
      { id: "track_1", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming" },
      { id: "track_2", title: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories" },
    ];

    const virtualPlaylist = {
      id: `virtual_merge_${Date.now()}`,
      title: "Merged Collection",
      trackCount: presetTracks.length,
    };

    const draft = await startBackgroundMatching(
      "youtube", // Source platform
      "spotify", // Target platform
      virtualPlaylist,
      null, // No YT Client
      null, // No Apple Client
      true, // force
      presetTracks // Pass preset tracks directly
    );

    expect(draft.playlistId).toBe(virtualPlaylist.id);
    expect(draft.targetPlatform).toBe("spotify");

    // Poll until draft background matching completes
    let readyDraft = loadDraft("youtube", virtualPlaylist.id);
    let attempts = 0;
    while ((!readyDraft || readyDraft.status !== "ready" || readyDraft.items.length < 2) && attempts < 20) {
      await new Promise((r) => setTimeout(r, 100));
      readyDraft = loadDraft("youtube", virtualPlaylist.id);
      attempts++;
    }

    expect(readyDraft).toBeDefined();
    expect(readyDraft?.items).toHaveLength(2);
    expect(readyDraft?.items[0].selectedCandidate).toBeDefined();
    expect(readyDraft?.items[0].selectedCandidate?.name).toBe("Midnight City");
    expect(readyDraft?.items[1].selectedCandidate?.name).toBe("Get Lucky");
  });

  it("matches presetTracks into target platform 'deezer' and 'soundcloud'", async () => {
    const presetTracks: TrackMetadata[] = [
      { id: "track_dz", title: "One More Time", artist: "Daft Punk", album: "Discovery" },
    ];

    const virtualPlaylist = {
      id: `virtual_merge_dz_${Date.now()}`,
      title: "Merged Deezer Collection",
      trackCount: 1,
    };

    await startBackgroundMatching(
      "file",
      "deezer",
      virtualPlaylist,
      null,
      null,
      true,
      presetTracks
    );

    let readyDraft = loadDraft("file", virtualPlaylist.id);
    let attempts = 0;
    while ((!readyDraft || readyDraft.status !== "ready") && attempts < 20) {
      await new Promise((r) => setTimeout(r, 100));
      readyDraft = loadDraft("file", virtualPlaylist.id);
      attempts++;
    }

    expect(readyDraft).toBeDefined();
    expect(readyDraft?.items).toHaveLength(1);
    expect(readyDraft?.items[0].selectedCandidate?.name).toBe("One More Time");
  });

  it("creates destination snapshot account when exporting to newly implemented platform without cloud write login", () => {
    const activeTracks: TrackMetadata[] = [
      { id: "t1", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming" },
      { id: "t2", title: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories" },
    ];

    const testPlatforms: PlatformType[] = ["spotify", "youtube_video", "deezer", "soundcloud", "file"];

    for (const plat of testPlatforms) {
      const testTitle = `Merged Playlist to ${plat}`;
      const exportAcc = accountManager.importSnapshotAccount(
        testTitle,
        [
          {
            id: `export_${plat}_${Date.now()}`,
            title: testTitle,
            trackCount: activeTracks.length,
            tracks: activeTracks,
            platform: plat,
          },
        ],
        "user_merge_test",
        plat
      );

      expect(exportAcc.platform).toBe(plat);
      expect(exportAcc.playlistCount).toBe(1);

      const tracks = accountManager.getPlaylistTracks(exportAcc.id, exportAcc.id);
      expect(tracks).toHaveLength(2);
      expect(tracks[0].title).toBe("Midnight City");
      expect(tracks[1].title).toBe("Get Lucky");
    }
  });

  it("logs transfer activity for merged collection export", () => {
    mergeEngine.logActivity({
      userId: "user_merge_test",
      username: "testuser",
      workflowName: "Midnight Daft Punk Merge",
      sourceAliases: ["Personal YT", "Spotify Disco"],
      destinationAlias: "Spotify Export Collection",
      destinationPlatform: "spotify",
      totalTracks: 2,
      matchedCount: 2,
      successCount: 2,
      failedCount: 0,
      duplicatesRemoved: 1,
      status: "completed",
    });

    const logs = mergeEngine.getActivityLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const last = logs[logs.length - 1];
    expect(last.workflowName).toBe("Midnight Daft Punk Merge");
    expect(last.destinationPlatform).toBe("spotify");
    expect(last.successCount).toBe(2);
  });
});
