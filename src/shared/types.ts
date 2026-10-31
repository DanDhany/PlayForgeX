export interface TrackMetadata {
  id?: string;
  videoId?: string;
  title: string;
  artist: string;
  album?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
}

export interface AppleMusicTrack {
  id: string;
  name: string;
  artistName: string;
  albumName?: string;
  durationInMillis?: number;
  artworkUrl?: string;
  previewUrl?: string;
  isrc?: string;
}

export type MatchStatus = "EXACT_MATCH" | "COVER_OR_ALT" | "LOW_CONFIDENCE" | "NOT_FOUND";

export interface MatchResult {
  status: MatchStatus;
  totalScore: number;
  titleScore: number;
  artistScore: number;
  albumScore: number;
  candidate?: AppleMusicTrack;
  reason?: string;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  description?: string;
  trackCount: number;
  thumbnailUrl?: string;
}

export interface TransferTrackItem {
  source: TrackMetadata;
  sanitizedTitle: {
    originalTitle: string;
    cleanTitle: string;
    subtitle?: string;
    hasNonLatin: boolean;
  };
  match: MatchResult;
  selectedCandidate?: AppleMusicTrack;
  excluded: boolean;
}

export interface TransferJob {
  playlistId: string;
  playlistTitle: string;
  tracks: TransferTrackItem[];
  appleMusicPlaylistId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: {
    current: number;
    total: number;
    success: number;
    failed: number;
  };
}

export interface ServiceAuthStatus {
  youtube: {
    connected: boolean;
    user?: string;
    playlistCount?: number;
  };
  apple: {
    connected: boolean;
    storefront?: string;
    user?: string;
  };
}
