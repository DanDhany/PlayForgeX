import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { MergeEngine, AggregatedTrack } from "../src/server/merge-engine.js";
import { AccountManager } from "../src/server/account-manager.js";

describe("MergeEngine Multi-Source Deduplication & Audit", () => {
  let tmpDir: string;
  let mgr: AccountManager;
  let engine: MergeEngine;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "playforgex-merge-test-"));
    mgr = new AccountManager(tmpDir);
    engine = new MergeEngine(tmpDir, mgr);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes exact duplicates across different source accounts while keeping variants", () => {
    const tracks: AggregatedTrack[] = [
      {
        sourceAccountId: "acc_ytm_1",
        sourceAccountAlias: "YouTube Orang A",
        sourcePlaylistId: "pl_1",
        sourcePlaylistTitle: "Favorite 2024",
        track: {
          id: "yt_1",
          title: "Bohemian Rhapsody",
          artist: "Queen",
          album: "A Night at the Opera",
          durationSeconds: 354,
        },
      },
      {
        sourceAccountId: "acc_ytm_2",
        sourceAccountAlias: "YouTube Orang B",
        sourcePlaylistId: "pl_2",
        sourcePlaylistTitle: "Rock Classics",
        track: {
          id: "yt_2",
          title: "Bohemian Rhapsody", // Exact duplicate
          artist: "Queen",
          album: "Greatest Hits",
          durationSeconds: 354,
        },
      },
      {
        sourceAccountId: "acc_ytm_3",
        sourceAccountAlias: "YouTube Orang C",
        sourcePlaylistId: "pl_3",
        sourcePlaylistTitle: "Live Concerts",
        track: {
          id: "yt_3",
          title: "Bohemian Rhapsody (Live at Wembley '86)", // Live variant - must NOT be dropped
          artist: "Queen",
          album: "Live at Wembley",
          durationSeconds: 360,
        },
      },
      {
        sourceAccountId: "acc_ytm_3",
        sourceAccountAlias: "YouTube Orang C",
        sourcePlaylistId: "pl_3",
        sourcePlaylistTitle: "Live Concerts",
        track: {
          id: "yt_4",
          title: "Radio Ga Ga",
          artist: "Queen",
          durationSeconds: 343,
        },
      },
    ];

    const result = engine.deduplicateTracks(tracks, "remove_exact");

    // Total unique should be 3 (Bohemian Rhapsody, Bohemian Rhapsody Live, Radio Ga Ga)
    expect(result.uniqueTracks.length).toBe(3);
    expect(result.duplicates.length).toBe(1);

    expect(result.duplicates[0].track.id).toBe("yt_2");
    expect(result.duplicates[0].duplicateOfTrackId).toBe("yt_1");

    // The Live variant must be preserved in uniqueTracks
    const liveTrack = result.uniqueTracks.find((t) => t.track.id === "yt_3");
    expect(liveTrack).toBeDefined();
    expect(liveTrack?.track.title).toContain("Live at Wembley");
  });

  it("respects keep_all deduplication policy when user wants full archives", () => {
    const tracks: AggregatedTrack[] = [
      {
        sourceAccountId: "acc_ytm_1",
        sourceAccountAlias: "A",
        sourcePlaylistId: "pl_1",
        sourcePlaylistTitle: "P1",
        track: { id: "1", title: "Song A", artist: "Artist B" },
      },
      {
        sourceAccountId: "acc_ytm_2",
        sourceAccountAlias: "B",
        sourcePlaylistId: "pl_2",
        sourcePlaylistTitle: "P2",
        track: { id: "2", title: "Song A", artist: "Artist B" },
      },
    ];

    const result = engine.deduplicateTracks(tracks, "keep_all");
    expect(result.uniqueTracks.length).toBe(2);
    expect(result.duplicates.length).toBe(0);
  });

  it("records and persists activity log items", () => {
    engine.logActivity({
      workflowName: "Merge A + B ➔ Car Apple Music",
      sourceAliases: ["YouTube Orang A", "YouTube Orang B"],
      destinationAlias: "Apple Mobil",
      destinationPlatform: "apple",
      totalTracks: 50,
      matchedCount: 50,
      successCount: 49,
      failedCount: 1,
      duplicatesRemoved: 5,
      status: "completed",
    });

    const logs = engine.getActivityLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].workflowName).toBe("Merge A + B ➔ Car Apple Music");
    expect(logs[0].totalTracks).toBe(50);
    expect(logs[0].duplicatesRemoved).toBe(5);

    // Verify written to disk
    expect(fs.existsSync(path.join(tmpDir, "activity.json"))).toBe(true);
  });
});
