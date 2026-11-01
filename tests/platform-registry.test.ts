import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformRegistry,
  PlatformProvider,
  PlatformId,
  AuthMethod,
  youtubeProvider,
  appleProvider,
} from "../src/core/platform-registry";

describe("PlatformRegistry & Multi-Platform Extensibility", () => {
  beforeEach(() => {
    PlatformRegistry.reset();
  });

  describe("Provider Registration and Listing", () => {
    it("returns all 7 built-in music platforms", () => {
      const all = PlatformRegistry.list();
      expect(all.length).toBeGreaterThanOrEqual(7);

      const ids = all.map((p) => p.id);
      expect(ids).toContain("youtube");
      expect(ids).toContain("apple");
      expect(ids).toContain("spotify");
      expect(ids).toContain("tidal");
      expect(ids).toContain("deezer");
      expect(ids).toContain("soundcloud");
      expect(ids).toContain("subsonic");
    });

    it("listActive() returns exactly YouTube Music and Apple Music", () => {
      const active = PlatformRegistry.listActive();
      const ids = active.map((p) => p.id);

      expect(ids).toHaveLength(2);
      expect(ids).toContain("youtube");
      expect(ids).toContain("apple");
      for (const provider of active) {
        expect(provider.status).toBe("active");
      }
    });

    it("listPlanned() returns Spotify, Tidal, Deezer, SoundCloud, and Subsonic", () => {
      const planned = PlatformRegistry.listPlanned();
      const ids = planned.map((p) => p.id);

      expect(ids).toContain("spotify");
      expect(ids).toContain("tidal");
      expect(ids).toContain("deezer");
      expect(ids).toContain("soundcloud");
      expect(ids).toContain("subsonic");

      for (const provider of planned) {
        expect(provider.status).toBe("planned");
      }
    });

    it("get() returns active status and proper capabilities for youtube and apple", () => {
      const yt = PlatformRegistry.get("youtube");
      expect(yt).toBeDefined();
      expect(yt?.id).toBe("youtube");
      expect(yt?.name).toBe("YouTube Music");
      expect(yt?.status).toBe("active");
      expect(yt?.capabilities).toEqual({
        canReadPlaylists: true,
        canReadTracks: true,
        canCreatePlaylists: true,
        canAddTracks: true,
        searchCatalog: true,
        supportsMobileSync: true,
      });

      const apple = PlatformRegistry.get("apple");
      expect(apple).toBeDefined();
      expect(apple?.id).toBe("apple");
      expect(apple?.name).toBe("Apple Music");
      expect(apple?.status).toBe("active");
      expect(apple?.capabilities).toEqual({
        canReadPlaylists: true,
        canReadTracks: true,
        canCreatePlaylists: true,
        canAddTracks: true,
        searchCatalog: true,
        supportsMobileSync: true,
      });
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
      const validAuthMethods: AuthMethod[] = ["cookie", "token", "oauth", "basic"];

      for (const provider of PlatformRegistry.list()) {
        expect(validAuthMethods).toContain(provider.authMethod);
        expect(provider.authDescription).toBeTruthy();
        expect(provider.authDescription.length).toBeGreaterThan(10);
        // Ensure no marketing cliches / AI slop
        expect(provider.authDescription.toLowerCase()).not.toContain("delve");
        expect(provider.authDescription.toLowerCase()).not.toContain("seamlessly");
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

  describe("Dynamic Registration & Extensibility", () => {
    it("allows registering dynamic or experimental providers", () => {
      const customProvider: PlatformProvider = {
        id: "navidrome",
        name: "Navidrome Personal Cloud",
        brandColor: "#1E88E5",
        status: "experimental",
        capabilities: {
          canReadPlaylists: true,
          canReadTracks: true,
          canCreatePlaylists: true,
          canAddTracks: false,
          searchCatalog: true,
          supportsMobileSync: true,
        },
        authDescription: "Connect with your personal Navidrome server token.",
        authMethod: "token",
        notes: "Experimental community integration.",
      };

      PlatformRegistry.register(customProvider);

      const retrieved = PlatformRegistry.get("navidrome");
      expect(retrieved).toEqual(customProvider);
      expect(PlatformRegistry.list().some((p) => p.id === "navidrome")).toBe(true);
    });

    it("retrieves adapters and handles planned adapter stubs cleanly", async () => {
      const ytAdapter = PlatformRegistry.getAdapter("youtube");
      expect(ytAdapter).toBeDefined();
      expect(ytAdapter?.provider.id).toBe("youtube");

      const appleAdapter = PlatformRegistry.getAdapter("apple");
      expect(appleAdapter).toBeDefined();
      expect(appleAdapter?.provider.id).toBe("apple");

      const spotifyAdapter = PlatformRegistry.getAdapter("spotify");
      expect(spotifyAdapter).toBeDefined();
      await expect(spotifyAdapter?.fetchPlaylists?.()).rejects.toThrow(
        /Spotify adapter integration is planned/
      );
    });
  });
});
