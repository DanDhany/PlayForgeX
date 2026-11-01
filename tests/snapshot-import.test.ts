import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { AccountManager } from "../src/server/account-manager.js";

describe("AccountManager Snapshot-based Mobile Client Import", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "playforgex-snapshot-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("imports mobile snapshot playlists and tracks without requiring live cookies", async () => {
    const mgr = new AccountManager(tmpDir);

    const snapshotData = [
      {
        id: "VLPL_mixed_august",
        title: "Random mixed August",
        trackCount: 2,
        thumbnailUrl: "https://example.com/thumb.jpg",
        tracks: [
          {
            title: "Night Dancer",
            artist: "imase",
            album: "POP CUBE",
            durationSeconds: 210,
            videoId: "v_imase_1",
          },
          {
            title: "Idol",
            artist: "YOASOBI",
            album: "THE BOOK 3",
            durationSeconds: 215,
            videoId: "v_yoasobi_1",
          },
        ],
      },
    ];

    const acc = mgr.importSnapshotAccount("YouTube Music (HP Orang B)", snapshotData);

    expect(acc.platform).toBe("youtube");
    expect(acc.localAlias).toBe("YouTube Music (HP Orang B)");
    expect(acc.syncType).toBe("snapshot");
    expect(acc.status).toBe("connected");
    expect(acc.playlistCount).toBe(1);

    // Verify playlists retrieved correctly
    const playlists = await mgr.getPlaylists(acc.id);
    expect(playlists).toHaveLength(1);
    expect(playlists[0].id).toBe("VLPL_mixed_august");
    expect(playlists[0].title).toBe("Random mixed August");
    expect(playlists[0].trackCount).toBe(2);

    // Verify snapshot tracks checking
    expect(mgr.hasSnapshotTracks(acc.id, "VLPL_mixed_august")).toBe(true);
    expect(mgr.hasSnapshotTracks(acc.id, "PL_mixed_august")).toBe(true);
    expect(mgr.hasSnapshotTracks(acc.id, "nonexistent")).toBe(false);

    const tracks = mgr.getPlaylistTracks(acc.id, "VLPL_mixed_august");
    expect(tracks).toHaveLength(2);
    expect(tracks[0].title).toBe("Night Dancer");
    expect(tracks[0].artist).toBe("imase");
    expect(tracks[1].title).toBe("Idol");

    // Verify reload from disk
    const reloadedMgr = new AccountManager(tmpDir);
    const reloadedAcc = reloadedMgr.getAccount(acc.id);
    expect(reloadedAcc).toBeDefined();
    expect(reloadedAcc?.syncType).toBe("snapshot");

    const reloadedPlaylists = await reloadedMgr.getPlaylists(acc.id);
    expect(reloadedPlaylists).toHaveLength(1);
    expect(reloadedMgr.hasSnapshotTracks(acc.id, "VLPL_mixed_august")).toBe(true);
    expect(reloadedMgr.getPlaylistTracks(acc.id, "VLPL_mixed_august")).toHaveLength(2);

    // Verify testConnection returns connected
    const testResult = await reloadedMgr.testConnection(acc.id);
    expect(testResult.status).toBe("connected");
    expect(testResult.playlistCount).toBe(1);

    // Verify deletion removes snapshot file
    const removed = reloadedMgr.removeAccount(acc.id);
    expect(removed).toBe(true);
    expect(reloadedMgr.getAccount(acc.id)).toBeUndefined();
    expect(reloadedMgr.hasSnapshotTracks(acc.id, "VLPL_mixed_august")).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, "snapshots", `${acc.id}.json`))).toBe(false);
  });
});
