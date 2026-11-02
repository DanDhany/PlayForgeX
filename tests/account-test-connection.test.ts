import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { AccountManager } from "../src/server/account-manager";

describe("Account Test Connection Suite Across All Platforms (TDD)", () => {
  let tmpDir: string;
  let mgr: AccountManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "playforgex-test-conn-"));
    mgr = new AccountManager(tmpDir, "test_user");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("tests YouTube Music connection and reports valid status or missing auth cleanly", async () => {
    const acc = await mgr.addYouTubeAccount("SAPISID=fake_cookie; HSID=test", "YouTube Music Kantor");
    expect(acc.localAlias).toBe("YouTube Music Kantor");

    // In a test environment without real network, testConnection handles auth check
    const tested = await mgr.testConnection(acc.id);
    expect(tested).toBeDefined();
    expect(tested.id).toBe(acc.id);
    expect(tested.localAlias).toBe("YouTube Music Kantor");
    expect(tested.platform).toBe("youtube");
  });

  it("tests Apple Music connection and does not confuse with other platforms", async () => {
    const acc = await mgr.addAppleAccount("test_user_token", "test_dev_token", "Apple Music Main");
    expect(acc.localAlias).toBe("Apple Music Main");

    const tested = await mgr.testConnection(acc.id);
    expect(tested).toBeDefined();
    expect(tested.id).toBe(acc.id);
    expect(tested.localAlias).toBe("Apple Music Main");
    expect(tested.platform).toBe("apple");
  });

  it("tests Spotify account without requiring Apple Music token", async () => {
    const acc = mgr.importSnapshotAccount(
      "Spotify Daily Mix",
      [
        {
          id: "sp_pl_1",
          title: "Daily Mix 1",
          trackCount: 15,
          tracks: [
            { id: "sp_trk_1", title: "Midnight City", artist: "M83", album: "Hurry Up" },
          ],
        },
      ],
      "test_user",
      "spotify"
    );

    const tested = await mgr.testConnection(acc.id);
    expect(tested).toBeDefined();
    expect(tested.localAlias).toBe("Spotify Daily Mix");
    expect(tested.platform).toBe("spotify");
    expect(tested.status).toBe("connected");
    expect(tested.playlistCount).toBe(1);
    expect(tested.errorMessage).toBeUndefined();
  });

  it("tests YouTube Video account without requiring Apple Music token", async () => {
    const acc = mgr.importSnapshotAccount(
      "YouTube Video Playlist",
      [
        {
          id: "dQw4w9WgXcQ",
          title: "Never Gonna Give You Up",
          trackCount: 1,
          tracks: [
            { id: "dQw4w9WgXcQ", title: "Never Gonna Give You Up", artist: "Rick Astley" },
          ],
        },
      ],
      "test_user",
      "youtube_video"
    );

    const tested = await mgr.testConnection(acc.id);
    expect(tested.localAlias).toBe("YouTube Video Playlist");
    expect(tested.platform).toBe("youtube_video");
    expect(tested.status).toBe("connected");
    expect(tested.playlistCount).toBe(1);
    expect(tested.errorMessage).toBeUndefined();
  });

  it("tests Deezer account and verifies connection successfully", async () => {
    const acc = mgr.importSnapshotAccount(
      "Deezer Favorites",
      [
        {
          id: "dz_pl_123",
          title: "Deezer Top Hits",
          trackCount: 20,
          tracks: [{ id: "dz_1", title: "Levitating", artist: "Dua Lipa" }],
        },
      ],
      "test_user",
      "deezer"
    );

    const tested = await mgr.testConnection(acc.id);
    expect(tested.localAlias).toBe("Deezer Favorites");
    expect(tested.platform).toBe("deezer");
    expect(tested.status).toBe("connected");
    expect(tested.playlistCount).toBe(1);
  });

  it("tests SoundCloud account and verifies connection successfully", async () => {
    const acc = mgr.importSnapshotAccount(
      "SoundCloud Underground",
      [
        {
          id: "sc_set_456",
          title: "Deep House Mix",
          trackCount: 12,
          tracks: [{ id: "sc_1", title: "Sunset Vibe", artist: "DJ Solar" }],
        },
      ],
      "test_user",
      "soundcloud"
    );

    const tested = await mgr.testConnection(acc.id);
    expect(tested.localAlias).toBe("SoundCloud Underground");
    expect(tested.platform).toBe("soundcloud");
    expect(tested.status).toBe("connected");
  });

  it("tests File / Offline Snapshot account and verifies connection successfully", async () => {
    const acc = mgr.importSnapshotAccount(
      "Backup M3U Playlist",
      [
        {
          id: "file_snap_1",
          title: "My Roadtrip Tracks",
          trackCount: 50,
          tracks: [{ id: "f_1", title: "Drive", artist: "The Cars" }],
        },
      ],
      "test_user",
      "file"
    );

    const tested = await mgr.testConnection(acc.id);
    expect(tested.localAlias).toBe("Backup M3U Playlist");
    expect(tested.platform).toBe("file");
    expect(tested.status).toBe("connected");
  });

  it("tests snapshot-backed account loaded from fresh AccountManager instance without falling into Apple error", async () => {
    // 1. Create a Spotify account in mgr 1
    const acc = mgr.importSnapshotAccount(
      "Spotify Saved",
      [{ id: "sp_snap_99", title: "Saved Songs", trackCount: 5 }],
      "test_user",
      "spotify"
    );

    // 2. Instantiate a fresh mgr2 pointing to same tmpDir
    const mgr2 = new AccountManager(tmpDir, "test_user");
    const reloaded = mgr2.getAccount(acc.id);
    expect(reloaded).toBeDefined();

    // 3. Test connection on fresh mgr2
    const tested = await mgr2.testConnection(acc.id);
    expect(tested.status).toBe("connected");
    expect(tested.platform).toBe("spotify");
    expect(tested.errorMessage).toBeUndefined();
  });
});
