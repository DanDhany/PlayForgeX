import { TrackMetadata, AppleMusicTrack, MatchResult, MatchStatus } from "../shared/types";
import { cleanTitle } from "./sanitizer";

// Convert Hiragana to Katakana for Japanese character equivalence
function normalizeKana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    const code = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(code);
  });
}

// Compute normalized similarity between two strings (0.0 to 1.0)
export function computeStringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;

  const n1 = normalizeKana(s1.normalize("NFKC").toLowerCase().replace(/[\s\-_.,/\\'"`!?()\[\]【】「」]/g, ""));
  const n2 = normalizeKana(s2.normalize("NFKC").toLowerCase().replace(/[\s\-_.,/\\'"`!?()\[\]【】「」]/g, ""));

  if (n1 === n2) return 1.0;
  if (n1.length === 0 || n2.length === 0) return 0;

  // Check if one contains the other
  if (n1.includes(n2) || n2.includes(n1)) {
    const minLen = Math.min(n1.length, n2.length);
    const maxLen = Math.max(n1.length, n2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  // Levenshtein distance
  const track = Array(n2.length + 1)
    .fill(null)
    .map(() => Array(n1.length + 1).fill(null));

  for (let i = 0; i <= n1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= n2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= n2.length; j += 1) {
    for (let i = 1; i <= n1.length; i += 1) {
      const indicator = n1[i - 1] === n2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[n2.length][n1.length];
  const maxLen = Math.max(n1.length, n2.length);
  return Math.max(0, 1 - distance / maxLen);
}

// Matching priorities:
// 1. Title match (60%)
// 2. Artist match (25%)
// 3. Album match (15%)
const WEIGHT_TITLE = 0.60;
const WEIGHT_ARTIST = 0.25;
const WEIGHT_ALBUM = 0.15;

export function calculateMatchScore(source: TrackMetadata, candidate: AppleMusicTrack): MatchResult {
  const sanitized = cleanTitle(source.title);

  // Compare original title first, then subtitle/translated title if available
  let titleScore = computeStringSimilarity(sanitized.originalTitle, candidate.name);
  if (sanitized.subtitle) {
    const subScore = computeStringSimilarity(sanitized.subtitle, candidate.name);
    titleScore = Math.max(titleScore, subScore);
  }

  // Artist score (2nd priority)
  const artistScore = computeStringSimilarity(source.artist, candidate.artistName);

  // Album score (3rd priority)
  let albumScore = 0;
  if (source.album && candidate.albumName) {
    albumScore = computeStringSimilarity(source.album, candidate.albumName);
  } else if (!source.album) {
    // If source didn't have album metadata, don't penalize harshly: give neutral baseline
    albumScore = 0.7;
  }

  // Calculate weighted total score
  const totalScore = (titleScore * WEIGHT_TITLE) + (artistScore * WEIGHT_ARTIST) + (albumScore * WEIGHT_ALBUM);

  // Status classification
  let status: MatchStatus = "NOT_FOUND";
  let reason = "No match found";

  if (titleScore >= 0.85) {
    if (artistScore >= 0.65) {
      status = "EXACT_MATCH";
      reason = "Exact match on title and artist";
    } else {
      // High title match but different artist -> Cover or alternative performance!
      status = "COVER_OR_ALT";
      reason = `Cover or alternative version by ${candidate.artistName}`;
    }
  } else if (totalScore >= 0.50) {
    status = "LOW_CONFIDENCE";
    reason = "Partial match (review recommended)";
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
    candidate,
    reason,
  };
}
