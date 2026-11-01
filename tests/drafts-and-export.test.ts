import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { loadDraft, saveDraft, updateDraftItem } from "../src/server/matcher-worker";
import { PlaylistDraft, TransferTrackItem } from "../src/shared/types";

describe("Drafts and Background Matching Persistence", () => {
  const testPlaylistId = "test_pl_12345";
  const sourcePlatform = "youtube";

  const sampleDraft: PlaylistDraft = {
    playlistId: testPlaylistId,
    playlistTitle: "Test Playlist",
    sourcePlatform: "youtube",
    targetPlatform: "apple",
    items: [
      {
        source: {
          videoId: "vid_1",
          title: "Stellar Stellar",
          artist: "Hoshimachi Suisei",
          album: "Still Still Stellar",
          durationSeconds: 300,
        },
        sanitizedTitle: {
          originalTitle: "Stellar Stellar",
          cleanTitle: "Stellar Stellar",
          hasNonLatin: false,
        },
        match: {
          status: "EXACT_MATCH",
          totalScore: 0.98,
          titleScore: 1.0,
          artistScore: 0.95,
          albumScore: 0.95,
        },
        selectedCandidate: {
          id: "am_1",
          name: "Stellar Stellar",
          artistName: "Hoshimachi Suisei",
          albumName: "Still Still Stellar",
          durationInMillis: 300000,
        },
        excluded: false,
      },
    ],
    status: "matching",
    totalTracks: 1,
    matchedCount: 1,
    lastUpdated: Date.now(),
  };

  afterEach(() => {
    // Clean up test draft file if created
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
    const testFile = path.join(dataDir, "drafts", `${sourcePlatform}_${testPlaylistId}.json`);
    if (fs.existsSync(testFile)) {
      try {
        fs.unlinkSync(testFile);
      } catch {}
    }
  });

  it("should save and load a playlist draft correctly", () => {
    saveDraft(sampleDraft);
    const loaded = loadDraft(sourcePlatform, testPlaylistId);

    expect(loaded).not.toBeNull();
    expect(loaded?.playlistId).toBe(testPlaylistId);
    expect(loaded?.playlistTitle).toBe("Test Playlist");
    expect(loaded?.items).toHaveLength(1);
    expect(loaded?.items[0].source.title).toBe("Stellar Stellar");
  });

  it("should update draft item when candidate or exclusion is changed", () => {
    saveDraft(sampleDraft);

    const updatedItem: TransferTrackItem = {
      ...sampleDraft.items[0],
      excluded: true,
    };

    const success = updateDraftItem(sourcePlatform, testPlaylistId, updatedItem);
    expect(success).toBe(true);

    const loaded = loadDraft(sourcePlatform, testPlaylistId);
    expect(loaded?.items[0].excluded).toBe(true);
  });
});
