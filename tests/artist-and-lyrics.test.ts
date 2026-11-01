import { describe, it, expect } from "vitest";
import {
  computeArtistSimilarity,
  kanaToRomaji,
} from "../src/core/artist-matcher";
import { compareLyrics, cleanLyrics } from "../src/core/lyrics";
import { calculateMatchScore } from "../src/core/matcher";
import { TrackMetadata, AppleMusicTrack } from "../src/shared/types";

describe("Cross-Script Artist Matcher", () => {
  it("translates Japanese Hiragana and Katakana to Romaji correctly", () => {
    expect(kanaToRomaji("ほしまちすいせい")).toBe("hoshimachisuisei");
    expect(kanaToRomaji("ホシマチスイセイ")).toBe("hoshimachisuisei");
    expect(kanaToRomaji("ヨルシカ")).toBe("yorushika");
    expect(kanaToRomaji("あど")).toBe("ado");
  });

  it("matches Kanji artist to Romaji artist via alias table", () => {
    const sim = computeArtistSimilarity("星街すいせい", "Hoshimachi Suisei");
    expect(sim).toBe(1.0);

    const simInv = computeArtistSimilarity("Hoshimachi Suisei", "Suisei Hoshimachi");
    expect(simInv).toBe(1.0);

    const simKaf = computeArtistSimilarity("花譜", "KAF");
    expect(simKaf).toBe(1.0);

    const simZuto = computeArtistSimilarity("ずっと真夜中でいいのに。", "ZUTOMAYO");
    expect(simZuto).toBe(1.0);
  });

  it("scores 0 or very low for completely different artists", () => {
    const sim = computeArtistSimilarity("Midnight Grand Orchestra", "Tokyo Metropolitan Symphony Orchestra");
    expect(sim).toBeLessThan(0.40);

    const sim2 = computeArtistSimilarity("YOASOBI", "Ed Sheeran");
    expect(sim2).toBe(0);
  });
});

describe("Lyrics Comparison Engine", () => {
  it("cleans lyrics formatting and removes TTML/HTML tags", () => {
    const raw = "<tt><span>Hello World!</span></tt>\n\n[00:12.34] Testing lyrics...";
    expect(cleanLyrics(raw)).toBe("hello world testing lyrics");
  });

  it("detects high similarity for identical songs across platforms", () => {
    const ymLyrics = "ハローハローハロー 幕はもう開いてるんだずっと いま 真空さえ揺らして響かせる そんな音楽を！";
    const amLyrics = "星街すいせい TAKU INOUE ハローハローハロー 幕はもう開いてるんだずっと いま 真空さえ揺らして響かせる そんな音楽を！ さあ 切り裂く静寂";

    const sim = compareLyrics(ymLyrics, amLyrics);
    expect(sim).toBeGreaterThanOrEqual(0.6);
  });

  it("detects low similarity for different lyrics", () => {
    const lyr1 = "ハローハローハロー 幕はもう開いてるんだずっと";
    const lyr2 = "I found a love for me Oh darling just dive right in";

    const sim = compareLyrics(lyr1, lyr2);
    expect(sim).toBeLessThan(0.1);
  });
});

describe("Strict Song Disqualification Logic", () => {
  it("does not match a song with the same title if artist is completely different", () => {
    const source: TrackMetadata = {
      title: "Allegro",
      artist: "Midnight Grand Orchestra",
      album: "Overture",
      durationSeconds: 207,
    };

    const wrongCandidate: AppleMusicTrack = {
      id: "classical_1",
      name: "Allegro",
      artistName: "Tokyo Metropolitan Symphony Orchestra",
      albumName: "Beethoven Symphonies",
      durationInMillis: 600000, // 10 minutes vs 3.5 minutes
    };

    const result = calculateMatchScore(source, wrongCandidate);
    expect(result.status).not.toBe("EXACT_MATCH");
    expect(result.artistScore).toBeLessThan(0.40);
    expect(result.totalScore).toBeLessThan(0.5);
  });

  it("matches the exact song with same title and artist with high score", () => {
    const source: TrackMetadata = {
      title: "Allegro",
      artist: "Midnight Grand Orchestra",
      album: "Overture",
      durationSeconds: 207,
    };

    const correctCandidate: AppleMusicTrack = {
      id: "mgo_1",
      name: "Allegro",
      artistName: "Midnight Grand Orchestra",
      albumName: "Overture",
      durationInMillis: 207000,
    };

    const result = calculateMatchScore(source, correctCandidate);
    expect(result.status).toBe("EXACT_MATCH");
    expect(result.artistScore).toBe(1.0);
    expect(result.totalScore).toBeGreaterThanOrEqual(0.95);
  });
});
