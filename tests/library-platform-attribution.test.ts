import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { AccountManager } from "../src/server/account-manager.js";

describe("Library Platform Attribution & Multi-Platform Snapshot Retention (TDD)", () => {
  let tmpDir: string;
  let accountManager: AccountManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pf-attr-test-"));
    accountManager = new AccountManager(tmpDir, "usr_test_123");
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it("retains explicit platform 'youtube_video' on imported snapshot account and returned playlists", async () => {
    const acc = accountManager.importSnapshotAccount(
      "My YouTube Video Mix",
      [
        {
          id: "PL_ytv_test",
          title: "My YouTube Video Mix",
          trackCount: 3,
          tracks: [
            { id: "v1", title: "Song 1", artist: "Artist 1" },
            { id: "v2", title: "Song 2", artist: "Artist 2" },
            { id: "v3", title: "Song 3", artist: "Artist 3" },
          ],
        },
      ],
      "usr_test_123",
      "youtube_video"
    );

    expect(acc.platform).toBe("youtube_video");

    const playlists = await accountManager.getPlaylists(acc.id);
    expect(playlists.length).toBe(1);
    expect(playlists[0].id).toBe("PL_ytv_test");
    expect(playlists[0].title).toBe("My YouTube Video Mix");
    // Platform MUST be explicitly populated on PlaylistSummary
    expect(playlists[0].platform).toBe("youtube_video");
  });

  it("retains explicit platform 'spotify' on imported snapshot account and returned playlists", async () => {
    const acc = accountManager.importSnapshotAccount(
      "Spotify Daily Mix",
      [
        {
          id: "37i9dQZF1DXcBWIGoYBM5M",
          title: "Today Top Hits",
          trackCount: 50,
          tracks: [{ id: "sp1", title: "Espresso", artist: "Sabrina Carpenter" }],
        },
      ],
      "usr_test_123",
      "spotify"
    );

    expect(acc.platform).toBe("spotify");

    const playlists = await accountManager.getPlaylists(acc.id);
    expect(playlists.length).toBe(1);
    expect(playlists[0].platform).toBe("spotify");
    expect(playlists[0].trackCount).toBe(1);
  });

  it("retains explicit platform 'soundcloud', 'deezer', and 'file' across all snapshot accounts", async () => {
    const scAcc = accountManager.importSnapshotAccount(
      "SoundCloud Live Sets",
      [{ id: "sc_set_1", title: "Sunset Chill", trackCount: 5 }],
      "usr_test_123",
      "soundcloud"
    );
    const deezerAcc = accountManager.importSnapshotAccount(
      "Deezer Top Hits",
      [{ id: "dz_pl_1", title: "Deezer Hits", trackCount: 20 }],
      "usr_test_123",
      "deezer"
    );
    const fileAcc = accountManager.importSnapshotAccount(
      "Imported M3U Backup",
      [{ id: "file_m3u_1", title: "Backup List", trackCount: 15 }],
      "usr_test_123",
      "file"
    );

    const scPlaylists = await accountManager.getPlaylists(scAcc.id);
    expect(scPlaylists[0].platform).toBe("soundcloud");

    const dzPlaylists = await accountManager.getPlaylists(deezerAcc.id);
    expect(dzPlaylists[0].platform).toBe("deezer");

    const filePlaylists = await accountManager.getPlaylists(fileAcc.id);
    expect(filePlaylists[0].platform).toBe("file");
  });

  it("correctly retrieves snapshot tracks using getPlaylistTracks without losing platform info", () => {
    const acc = accountManager.importSnapshotAccount(
      "Indie Gems",
      [
        {
          id: "PL_indie_gems",
          title: "Indie Gems",
          trackCount: 1,
          tracks: [{ id: "trk_1", title: "Motion Sickness", artist: "Phoebe Bridgers" }],
        },
      ],
      "usr_test_123",
      "youtube_video"
    );

    const tracks = accountManager.getPlaylistTracks(acc.id, "PL_indie_gems");
    expect(tracks.length).toBe(1);
    expect(tracks[0].title).toBe("Motion Sickness");
    expect(tracks[0].artist).toBe("Phoebe Bridgers");

    expect(accountManager.hasSnapshotTracks(acc.id, "PL_indie_gems")).toBe(true);
    expect(accountManager.hasSnapshotTracks(acc.id, "VLPL_indie_gems")).toBe(true);
  });
});
