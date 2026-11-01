import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { AccountManager } from "../src/server/account-manager.js";
import { circuitBreaker } from "../src/core/stealth.js";
import { saveDraft, loadDraft, startBackgroundMatching, isJobRunning } from "../src/server/matcher-worker.js";
import { PlaylistDraft, PlaylistSummary, TrackMetadata } from "../src/shared/types.js";

describe("Multi-Platform Architecture & Adaptability (TDD)", () => {
  let tmpDir: string;
  let accountManager: AccountManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pf-multi-test-"));
    accountManager = new AccountManager(tmpDir, "usr_multi_test");
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  describe("AccountManager Multi-Platform Querying", () => {
    it("retrieves primary account for any valid platform (youtube_video, spotify, deezer, file)", () => {
      accountManager.importSnapshotAccount(
        "My Spotify Playlist",
        [{ id: "sp_pl_1", title: "Top Tracks", trackCount: 10 }],
        "usr_multi_test",
        "spotify"
      );

      accountManager.importSnapshotAccount(
        "YouTube Video Mix",
        [{ id: "ytv_pl_1", title: "Video Mix", trackCount: 5 }],
        "usr_multi_test",
        "youtube_video"
      );

      const spAcc = accountManager.getPrimaryAccount("spotify", "usr_multi_test");
      expect(spAcc).toBeDefined();
      expect(spAcc!.platform).toBe("spotify");

      const ytvAcc = accountManager.getPrimaryAccount("youtube_video", "usr_multi_test");
      expect(ytvAcc).toBeDefined();
      expect(ytvAcc!.platform).toBe("youtube_video");
    });
  });

  describe("Stealth Circuit Breaker Universal Platform Support", () => {
    it("handles cooldown triggers and queries for any platform without typing errors", () => {
      expect(circuitBreaker.isCoolingDown("spotify")).toBe(false);
      expect(circuitBreaker.isCoolingDown("soundcloud")).toBe(false);
      expect(circuitBreaker.isCoolingDown("youtube_video")).toBe(false);

      circuitBreaker.triggerCooldown("spotify", 5000);
      expect(circuitBreaker.isCoolingDown("spotify")).toBe(true);
      expect(circuitBreaker.getRemainingCooldownMs("spotify")).toBeGreaterThan(0);

      // Other services should remain unaffected
      expect(circuitBreaker.isCoolingDown("youtube")).toBe(false);
      expect(circuitBreaker.isCoolingDown("apple")).toBe(false);
    });
  });

  describe("Draft Storage & Worker Multi-Platform Support", () => {
    it("persists and reloads drafts for non-binary platforms (e.g. spotify -> apple, file -> youtube)", () => {
      const draft: PlaylistDraft = {
        playlistId: "sp_draft_101",
        playlistTitle: "Spotify Electronic",
        sourcePlatform: "spotify",
        targetPlatform: "apple",
        items: [
          {
            source: { title: "One More Time", artist: "Daft Punk" },
            sanitizedTitle: {
              originalTitle: "One More Time",
              cleanTitle: "One More Time",
              hasNonLatin: false,
            },
            match: {
              status: "EXACT_MATCH",
              totalScore: 0.98,
              titleScore: 1,
              artistScore: 1,
              albumScore: 0.9,
            },
            excluded: false,
          },
        ],
        status: "ready",
        totalTracks: 1,
        matchedCount: 1,
        lastUpdated: Date.now(),
      };

      saveDraft(draft);
      const loaded = loadDraft("spotify", "sp_draft_101");
      expect(loaded).toBeDefined();
      expect(loaded!.sourcePlatform).toBe("spotify");
      expect(loaded!.targetPlatform).toBe("apple");
      expect(loaded!.items.length).toBe(1);
      expect(loaded!.items[0].source.title).toBe("One More Time");
    });

    it("launches background matching worker with preset tracks from any source platform", async () => {
      const playlist: PlaylistSummary = {
        id: "pl_file_ambient",
        title: "Ambient Text List",
        trackCount: 2,
        platform: "file",
      };

      const presetTracks: TrackMetadata[] = [
        { title: "Weightless", artist: "Marconi Union" },
        { title: "Electra", artist: "Airstream" },
      ];

      // Worker should accept sourcePlatform: 'file' and targetPlatform: 'youtube'
      const draft = await startBackgroundMatching(
        "file",
        "youtube",
        playlist,
        null, // No live client needed when presetTracks is supplied
        null,
        true,
        presetTracks
      );

      expect(draft).toBeDefined();
      expect(draft.sourcePlatform).toBe("file");
      expect(draft.targetPlatform).toBe("youtube");
      expect(draft.totalTracks).toBe(2);
      expect(isJobRunning("file", "pl_file_ambient")).toBe(true);
    });

    it("gracefully matches against public catalogs even when client is null", async () => {
      const playlist: PlaylistSummary = {
        id: "pl_sp_synth",
        title: "Synth Favorites",
        trackCount: 1,
        platform: "spotify",
      };

      const presetTracks: TrackMetadata[] = [
        { title: "Resonance", artist: "HOME" },
      ];

      const draft = await startBackgroundMatching(
        "spotify",
        "deezer",
        playlist,
        null,
        null,
        true,
        presetTracks
      );

      expect(draft.targetPlatform).toBe("deezer");
    });
  });
});
