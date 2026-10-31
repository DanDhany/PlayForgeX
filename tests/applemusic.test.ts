import { describe, it, expect } from "vitest";
import { formatCatalogSearchUrl, mapAppleMusicSong, searchAndMatchTrack } from "../src/core/applemusic";
import { TrackMetadata, AppleMusicTrack } from "../src/shared/types";

describe("Apple Music Client Helpers", () => {
  it("formats catalog search url with encoded query and storefront", () => {
    const url = formatCatalogSearchUrl("jp", "夜に駆ける");
    expect(url).toContain("/v1/catalog/jp/search");
    expect(url).toContain(encodeURIComponent("夜に駆ける"));
  });

  it("maps raw song resource to AppleMusicTrack interface", () => {
    const raw = {
      id: "987654",
      type: "songs",
      attributes: {
        name: "夜に駆ける",
        artistName: "YOASOBI",
        albumName: "THE BOOK",
        durationInMillis: 261000,
        artwork: { url: "https://example.com/{w}x{h}bb.jpg" },
        previews: [{ url: "https://audio-ssl.itunes.apple.com/preview.m4a" }]
      }
    };
    const mapped = mapAppleMusicSong(raw);
    expect(mapped.id).toBe("987654");
    expect(mapped.name).toBe("夜に駆ける");
    expect(mapped.artworkUrl).toContain("120x120bb.jpg");
    expect(mapped.previewUrl).toBe("https://audio-ssl.itunes.apple.com/preview.m4a");
  });

  it("prioritizes original title and selects cover if original is not available", () => {
    const source: TrackMetadata = {
      title: "夜に駆ける (Racing into the Night) [Official Music Video]",
      artist: "YOASOBI",
    };
    const candidates: AppleMusicTrack[] = [
      {
        id: "cover1",
        name: "夜に駆ける",
        artistName: "VTuber Cover",
        albumName: "Covers Vol.1",
        durationInMillis: 260000,
      },
      {
        id: "other2",
        name: "Racing into the Sunset",
        artistName: "Unknown",
        albumName: "Unknown",
        durationInMillis: 180000,
      }
    ];

    const match = searchAndMatchTrack(source, candidates);
    expect(match.candidate).toBeDefined();
    expect(match.candidate?.id).toBe("cover1");
    expect(match.status).toBe("COVER_OR_ALT");
  });
});
