import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformRegistry,
  PlatformId,
  AuthMethod,
  youtubeProvider,
  appleProvider,
} from "../src/core/platform-registry";
import { sanitizeVideoTitle } from "../src/core/adapters/youtube-video-adapter";
import { fileAdapter } from "../src/core/adapters/file-adapter";
import { spotifyAdapter } from "../src/core/adapters/spotify-adapter";
import { deezerAdapter } from "../src/core/adapters/deezer-adapter";

describe("PlatformRegistry & Multi-Platform Extensibility", () => {
  beforeEach(() => {
    PlatformRegistry.reset();
  });

  describe("Provider Registration and Listing", () => {
    it("returns all built-in music platforms", () => {
      const all = PlatformRegistry.list();
      expect(all.length).toBeGreaterThanOrEqual(9);

      const ids = all.map((p) => p.id);
      expect(ids).toContain("youtube");
      expect(ids).toContain("youtube_video");
      expect(ids).toContain("apple");
      expect(ids).toContain("spotify");
      expect(ids).toContain("deezer");
      expect(ids).toContain("soundcloud");
      expect(ids).toContain("file");
      expect(ids).toContain("tidal");
      expect(ids).toContain("subsonic");
    });

    it("listActive() returns active platforms", () => {
      const active = PlatformRegistry.listActive();
      const ids = active.map((p) => p.id);

      expect(ids).toContain("youtube");
      expect(ids).toContain("youtube_video");
      expect(ids).toContain("apple");
      expect(ids).toContain("spotify");
      expect(ids).toContain("deezer");
      expect(ids).toContain("soundcloud");
      expect(ids).toContain("file");

      for (const provider of active) {
        expect(provider.status).toBe("active");
      }
    });

    it("listPlanned() returns Tidal and Subsonic", () => {
      const planned = PlatformRegistry.listPlanned();
      const ids = planned.map((p) => p.id);

      expect(ids).toContain("tidal");
      expect(ids).toContain("subsonic");

      for (const provider of planned) {
        expect(provider.status).toBe("planned");
      }
    });

    it("get() returns proper capabilities for youtube and apple", () => {
      const yt = PlatformRegistry.get("youtube");
      expect(yt).toBeDefined();
      expect(yt?.id).toBe("youtube");
      expect(yt?.name).toBe("YouTube Music");
      expect(yt?.status).toBe("active");

      const apple = PlatformRegistry.get("apple");
      expect(apple).toBeDefined();
      expect(apple?.id).toBe("apple");
      expect(apple?.name).toBe("Apple Music");
      expect(apple?.status).toBe("active");
    });

    it("get() returns undefined for unregistered platforms", () => {
      const unknown = PlatformRegistry.get("nonexistent" as PlatformId);
      expect(unknown).toBeUndefined();
    });
  });

  describe("Provider Metadata Integrity & Humanized UX", () => {
    it("ensures all providers have valid brand colors in hex format", () => {
      const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

      for (const provider of PlatformRegistry.list()) {
        expect(provider.brandColor).toMatch(hexColorRegex);
      }

      expect(youtubeProvider.brandColor).toBe("#FF0000");
      expect(appleProvider.brandColor).toBe("#FA2D48");
    });

    it("ensures every provider specifies a valid auth method and humanized description", () => {
      const validAuthMethods: AuthMethod[] = ["cookie", "token", "oauth", "basic", "public", "file"];

      for (const provider of PlatformRegistry.list()) {
        expect(validAuthMethods).toContain(provider.authMethod);
        expect(provider.authDescription).toBeTruthy();
        expect(provider.authDescription.length).toBeGreaterThan(10);
        // Ensure no marketing cliches / AI slop
        expect(provider.authDescription.toLowerCase()).not.toContain("delve");
        expect(provider.authDescription.toLowerCase()).not.toContain("game-changer");
      }
    });

    it("ensures capabilities conform to boolean contract", () => {
      for (const provider of PlatformRegistry.list()) {
        const caps = provider.capabilities;
        expect(typeof caps.canReadPlaylists).toBe("boolean");
        expect(typeof caps.canReadTracks).toBe("boolean");
        expect(typeof caps.canCreatePlaylists).toBe("boolean");
        expect(typeof caps.canAddTracks).toBe("boolean");
        expect(typeof caps.searchCatalog).toBe("boolean");
        expect(typeof caps.supportsMobileSync).toBe("boolean");
      }
    });
  });

  describe("Platform Adapters Functional Unit Tests", () => {
    it("youtube_video adapter sanitizes complex video noise strings", () => {
      const s1 = sanitizeVideoTitle("Coldplay - Yellow (Official Video) [4K]");
      expect(s1.cleanArtist).toBe("Coldplay");
      expect(s1.cleanTitle).toBe("Yellow");

      const s2 = sanitizeVideoTitle("[MV] IU - Blueming (Lyric Video)");
      expect(s2.cleanArtist).toBe("IU");
      expect(s2.cleanTitle).toBe("Blueming");

      const s3 = sanitizeVideoTitle("Queen - Bohemian Rhapsody (Live at Wembley 1986)");
      expect(s3.isLive).toBe(true);
    });

    it("spotify adapter extracts playlist IDs from URLs and handles public embeds", () => {
      const id1 = spotifyAdapter.extractPlaylistId("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=123");
      expect(id1).toBe("37i9dQZF1DXcBWIGoYBM5M");

      const id2 = spotifyAdapter.extractPlaylistId("37i9dQZF1DXcBWIGoYBM5M");
      expect(id2).toBe("37i9dQZF1DXcBWIGoYBM5M");
    });

    it("deezer adapter extracts numeric playlist IDs", () => {
      const id1 = deezerAdapter.extractPlaylistId("https://www.deezer.com/en/playlist/908622995");
      expect(id1).toBe("908622995");
    });

    it("file adapter parses plain text, M3U, and CSV lists accurately", () => {
      const plainText = `Queen - Bohemian Rhapsody\nColdplay - Yellow\nSheila On 7 - Dan`;
      const parsedPlain = fileAdapter.parseContent(plainText, "My Test List");
      expect(parsedPlain.tracks).toHaveLength(3);
      expect(parsedPlain.tracks[0].artist).toBe("Queen");
      expect(parsedPlain.tracks[0].title).toBe("Bohemian Rhapsody");

      const m3u = `#EXTM3U\n#EXTINF:354,Queen - Bohemian Rhapsody\n#EXTINF:269,Coldplay - Yellow`;
      const parsedM3u = fileAdapter.parseContent(m3u, "Rock.m3u");
      expect(parsedM3u.tracks).toHaveLength(2);
      expect(parsedM3u.tracks[0].title).toBe("Bohemian Rhapsody");
      expect(parsedM3u.tracks[0].durationSeconds).toBe(354);

      const csv = `Artist,Title\nRadiohead,Creep\nOasis,Wonderwall`;
      const parsedCsv = fileAdapter.parseContent(csv, "Indie.csv");
      expect(parsedCsv.tracks).toHaveLength(2);
      expect(parsedCsv.tracks[0].artist).toBe("Radiohead");
      expect(parsedCsv.tracks[0].title).toBe("Creep");
    });
  });
});
