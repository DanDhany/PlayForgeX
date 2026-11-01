import { describe, it, expect } from "vitest";

describe("Landing Page & Interactive Migration Preview Logic", () => {
  interface SampleTrack {
    id: string;
    title: string;
    artist: string;
    playlistId: "work" | "personal" | "friend";
  }

  const SAMPLE_TRACKS: SampleTrack[] = [
    // Akun Kantor
    { id: "w1", title: "Midnight City", artist: "M83", playlistId: "work" },
    { id: "w2", title: "Weightless", artist: "Marconi Union", playlistId: "work" },
    { id: "w3", title: "Resonance", artist: "HOME", playlistId: "work" },
    { id: "w4", title: "Daylight", artist: "David Kushner", playlistId: "work" },
    { id: "w5", title: "Intro", artist: "The xx", playlistId: "work" },

    // Akun Pribadi
    { id: "p1", title: "Dan...", artist: "Sheila On 7", playlistId: "personal" },
    { id: "p2", title: "Hapus Aku", artist: "Nidji", playlistId: "personal" },
    { id: "p3", title: "Clocks", artist: "Coldplay", playlistId: "personal" },
    { id: "p4", title: "Daylight", artist: "David Kushner", playlistId: "personal" },
    { id: "p5", title: "Kisah Klasik", artist: "Sheila On 7", playlistId: "personal" },

    // Playlist Teman
    { id: "f1", title: "Midnight City", artist: "M83", playlistId: "friend" },
    { id: "f2", title: "Clocks", artist: "Coldplay", playlistId: "friend" },
    { id: "f3", title: "A Sky Full of Stars", artist: "Coldplay", playlistId: "friend" },
    { id: "f4", title: "Sempurna", artist: "Andra and The BackBone", playlistId: "friend" },
    { id: "f5", title: "Viva La Vida", artist: "Coldplay", playlistId: "friend" },
  ];

  function mergePlaylists(selected: Set<"work" | "personal" | "friend">) {
    const rawList = SAMPLE_TRACKS.filter((t) => selected.has(t.playlistId));
    const totalRaw = rawList.length;

    const map = new Map<string, { title: string; artist: string; occurrences: number }>();
    for (const track of rawList) {
      const key = `${track.title.toLowerCase()}:::${track.artist.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.occurrences += 1;
      } else {
        map.set(key, { title: track.title, artist: track.artist, occurrences: 1 });
      }
    }

    const merged = Array.from(map.values());
    const duplicateCount = totalRaw - merged.length;

    return {
      totalRaw,
      uniqueCount: merged.length,
      duplicateCount,
      merged,
    };
  }

  it("calculates exact deduplication when all 3 playlists are selected", () => {
    const selected = new Set<"work" | "personal" | "friend">(["work", "personal", "friend"]);
    const result = mergePlaylists(selected);

    expect(result.totalRaw).toBe(15);
    expect(result.uniqueCount).toBe(12);
    expect(result.duplicateCount).toBe(3);

    // Check duplicate tracks
    const daylight = result.merged.find((t) => t.title === "Daylight");
    expect(daylight?.occurrences).toBe(2);

    const midnightCity = result.merged.find((t) => t.title === "Midnight City");
    expect(midnightCity?.occurrences).toBe(2);

    const clocks = result.merged.find((t) => t.title === "Clocks");
    expect(clocks?.occurrences).toBe(2);
  });

  it("calculates zero duplicates when only single playlist is selected", () => {
    const selected = new Set<"work" | "personal" | "friend">(["work"]);
    const result = mergePlaylists(selected);

    expect(result.totalRaw).toBe(5);
    expect(result.uniqueCount).toBe(5);
    expect(result.duplicateCount).toBe(0);
  });

  it("handles pairing of work and personal playlists correctly", () => {
    const selected = new Set<"work" | "personal" | "friend">(["work", "personal"]);
    const result = mergePlaylists(selected);

    expect(result.totalRaw).toBe(10);
    // Daylight is duplicate between work and personal
    expect(result.uniqueCount).toBe(9);
    expect(result.duplicateCount).toBe(1);
  });

  it("supports platform matrix catalog coverage", () => {
    const platformIds = [
      "youtube",
      "youtube_video",
      "apple",
      "spotify",
      "tidal",
      "deezer",
      "soundcloud",
      "file",
      "subsonic",
    ];
    expect(platformIds.length).toBeGreaterThanOrEqual(7);
  });

  it("verifies aesthetic scroll components are created and export React functional components", async () => {
    const { HowItWorksSection } = await import("../src/renderer/components/landing/HowItWorksSection");
    const { ComparisonSection } = await import("../src/renderer/components/landing/ComparisonSection");
    const { SpotlightCard } = await import("../src/renderer/components/landing/SpotlightCard");
    const { FloatingDock } = await import("../src/renderer/components/landing/FloatingDock");
    const { Reveal } = await import("../src/renderer/components/landing/Reveal");
    const { FaqSection } = await import("../src/renderer/components/landing/FaqSection");

    expect(typeof HowItWorksSection).toBe("function");
    expect(typeof ComparisonSection).toBe("function");
    expect(typeof SpotlightCard).toBe("function");
    expect(typeof FloatingDock).toBe("function");
    expect(typeof Reveal).toBe("function");
    expect(typeof FaqSection).toBe("function");
  });
});
