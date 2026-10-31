import { describe, it, expect } from "vitest";
import { cleanTitle } from "../src/core/sanitizer";
import { calculateMatchScore } from "../src/core/matcher";
import { TrackMetadata, AppleMusicTrack } from "../src/shared/types";

describe("Title Sanitizer", () => {
  it("preserves Japanese Kanji and strips YouTube video tags", () => {
    const raw = "夜に駆ける (Racing into the Night) [Official Music Video]";
    const res = cleanTitle(raw);
    expect(res.originalTitle).toBe("夜に駆ける");
    expect(res.subtitle).toBe("Racing into the Night");
    expect(res.hasNonLatin).toBe(true);
  });

  it("handles Japanese brackets and MV tags", () => {
    const raw = "【Ado】 うっせぇわ (Official MV)";
    const res = cleanTitle(raw);
    expect(res.cleanTitle).toBe("うっせぇわ");
    expect(res.hasNonLatin).toBe(true);
  });

  it("handles Japanese song with kana and romaji / feat annotations", () => {
    const raw = "怪物 (Monster) - YOASOBI feat. Ayase / 「BEASTARS」OP [Official Video]";
    const res = cleanTitle(raw);
    expect(res.originalTitle).toBe("怪物");
    expect(res.hasNonLatin).toBe(true);
  });

  it("handles Latin tracks gracefully", () => {
    const raw = "Blinding Lights (Official Audio)";
    const res = cleanTitle(raw);
    expect(res.cleanTitle).toBe("Blinding Lights");
    expect(res.hasNonLatin).toBe(false);
  });
});

describe("Weighted Matcher Engine", () => {
  it("prioritizes original title and recognizes cover versions as COVER_OR_ALT", () => {
    const source: TrackMetadata = {
      title: "夜に駆ける",
      artist: "YOASOBI",
      album: "THE BOOK",
    };
    const coverCandidate: AppleMusicTrack = {
      id: "12345",
      name: "夜に駆ける",
      artistName: "Hoshimachi Suisei",
      albumName: "Cover Collection",
      durationInMillis: 260000,
    };
    const result = calculateMatchScore(source, coverCandidate);
    expect(result.status).toBe("COVER_OR_ALT");
    expect(result.titleScore).toBeGreaterThanOrEqual(0.9);
    expect(result.totalScore).toBeGreaterThanOrEqual(0.55);
  });

  it("gives high score for exact title and artist match", () => {
    const source: TrackMetadata = {
      title: "廻廻奇譚",
      artist: "Eve",
      album: "廻人",
    };
    const candidate: AppleMusicTrack = {
      id: "67890",
      name: "廻廻奇譚",
      artistName: "Eve",
      albumName: "Kaizin",
      durationInMillis: 220000,
    };
    const result = calculateMatchScore(source, candidate);
    expect(result.status).toBe("EXACT_MATCH");
    expect(result.totalScore).toBeGreaterThanOrEqual(0.85);
  });

  it("calculates weighted score according to 60/25/15 ratio", () => {
    const source: TrackMetadata = {
      title: "群青",
      artist: "YOASOBI",
      album: "THE BOOK",
    };
    const candidate: AppleMusicTrack = {
      id: "111",
      name: "群青",
      artistName: "YOASOBI",
      albumName: "THE BOOK",
      durationInMillis: 240000,
    };
    const result = calculateMatchScore(source, candidate);
    expect(result.totalScore).toBeCloseTo(1.0, 1);
    expect(result.status).toBe("EXACT_MATCH");
  });

  it("returns NOT_FOUND for completely unrelated song", () => {
    const source: TrackMetadata = {
      title: "夜に駆ける",
      artist: "YOASOBI",
    };
    const candidate: AppleMusicTrack = {
      id: "999",
      name: "Shape of You",
      artistName: "Ed Sheeran",
    };
    const result = calculateMatchScore(source, candidate);
    expect(result.status).toBe("NOT_FOUND");
    expect(result.totalScore).toBeLessThan(0.4);
  });
});
