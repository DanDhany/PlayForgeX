import { TrackMetadata, AppleMusicTrack, MatchResult, MatchStatus } from "../shared/types";
import { cleanTitle } from "./sanitizer";
import { computeArtistSimilarity, computeLevenshteinSimilarity } from "./artist-matcher";
import { compareLyrics } from "./lyrics";

// Matching priorities:
// 1. Title match (45%)
// 2. Artist match (40%) - strict cross-script & alias matching
// 3. Album match (10%)
// 4. Duration match (5%)
const WEIGHT_TITLE = 0.45;
const WEIGHT_ARTIST = 0.40;
const WEIGHT_ALBUM = 0.10;
const WEIGHT_DURATION = 0.05;

export interface CalculateMatchOptions {
  sourceLyrics?: string;
  candidateLyrics?: string;
}

export function calculateMatchScore(
  source: TrackMetadata,
  candidate: AppleMusicTrack,
  options?: CalculateMatchOptions
): MatchResult {
  const sanitized = cleanTitle(source.title);

  // 1. Title Score
  let titleScore = computeLevenshteinSimilarity(sanitized.originalTitle, candidate.name);
  if (sanitized.subtitle) {
    const subScore = computeLevenshteinSimilarity(sanitized.subtitle, candidate.name);
    titleScore = Math.max(titleScore, subScore);
  }
  if (sanitized.cleanTitle && sanitized.cleanTitle !== sanitized.originalTitle) {
    const cleanScore = computeLevenshteinSimilarity(sanitized.cleanTitle, candidate.name);
    titleScore = Math.max(titleScore, cleanScore);
  }

  // 2. Artist Score (High priority: cross-script, kanji/romaji alias, name inversion)
  const artistScore = computeArtistSimilarity(source.artist, candidate.artistName);

  // 3. Album Score
  let albumScore = 0.7; // Neutral baseline if album missing
  if (source.album && candidate.albumName) {
    albumScore = computeLevenshteinSimilarity(source.album, candidate.albumName);
  }

  // 4. Duration Score
  let durationScore = 0.8;
  const sourceDuration = source.durationSeconds;
  const candidateDuration = candidate.durationInMillis ? Math.round(candidate.durationInMillis / 1000) : undefined;

  if (sourceDuration && candidateDuration) {
    const diff = Math.abs(sourceDuration - candidateDuration);
    if (diff <= 3) {
      durationScore = 1.0;
    } else if (diff <= 8) {
      durationScore = 0.90;
    } else if (diff <= 20) {
      durationScore = 0.65;
    } else if (diff <= 45) {
      durationScore = 0.35;
    } else {
      durationScore = 0.05;
    }
  }

  // 5. Lyrics Verification Score (if lyrics provided)
  let lyricsScore: number | undefined;
  let lyricsVerified = false;
  let lyricsSnippet: string | undefined;

  if (options?.sourceLyrics && options?.candidateLyrics) {
    lyricsScore = compareLyrics(options.sourceLyrics, options.candidateLyrics);
    if (lyricsScore >= 0.60) {
      lyricsVerified = true;
      lyricsSnippet = options.candidateLyrics.slice(0, 100);
    }
  }

  // Calculate weighted base score
  let totalScore =
    titleScore * WEIGHT_TITLE +
    artistScore * WEIGHT_ARTIST +
    albumScore * WEIGHT_ALBUM +
    durationScore * WEIGHT_DURATION;

  // Boost if lyrics are verified identical
  if (lyricsVerified) {
    totalScore = Math.min(1.0, totalScore + 0.15);
  }

  // Classification & Disqualification Logic
  let status: MatchStatus = "NOT_FOUND";
  let reason = "No match found";

  // Critical rule 1: If artist does not match at all (artistScore < 0.40)
  if (artistScore < 0.40) {
    // If lyrics are verified, the artist might just be credited under a different alias or collaborative group
    if (lyricsVerified) {
      status = "EXACT_MATCH";
      reason = "Verified identical song via lyrics";
    } else if (titleScore >= 0.80 && durationScore >= 0.30) {
      // Title matches and duration is comparable -> Cover or alternative version
      status = "COVER_OR_ALT";
      reason = `Cover or alternative version by ${candidate.artistName}`;
    } else {
      // Completely unrelated song with coincidental title (different artist and/or duration mismatch)
      status = "NOT_FOUND";
      reason = `Different song & artist: ${candidate.artistName} (Original: ${source.artist})`;
      totalScore = Math.min(totalScore, 0.35);
    }
  } else if (titleScore >= 0.82 && artistScore >= 0.65) {
    // Exact match on both title and artist
    status = "EXACT_MATCH";
    reason = lyricsVerified
      ? "Exact match on title, artist, and verified lyrics"
      : "Exact match on title and artist";
  } else if (totalScore >= 0.60 && titleScore >= 0.70 && artistScore >= 0.50) {
    status = "EXACT_MATCH";
    reason = "High confidence match on title and artist";
  } else if (totalScore >= 0.45 && titleScore >= 0.60) {
    status = "LOW_CONFIDENCE";
    reason = "Partial match (title or artist variation)";
  } else {
    status = "NOT_FOUND";
    reason = "Low similarity score";
  }

  return {
    status,
    totalScore,
    titleScore,
    artistScore,
    albumScore,
    durationScore,
    lyricsVerified,
    lyricsSnippet,
    candidate,
    reason,
  };
}

// Retain computeStringSimilarity export for backwards compatibility
export function computeStringSimilarity(s1: string, s2: string): number {
  return computeLevenshteinSimilarity(s1, s2);
}
