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
  durationScore?: number;
  lyricsVerified?: boolean;
  lyricsSnippet?: string;
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
    rawTitle?: string;
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
  targetPlatform?: "apple" | "youtube";
  mode?: "create" | "existing";
  existingPlaylistTitle?: string;
  tracks: TransferTrackItem[];
  appleMusicPlaylistId?: string;
  youtubePlaylistId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: {
    current: number;
    total: number;
    success: number;
    failed: number;
  };
}

export interface PlaylistDraft {
  playlistId: string;
  playlistTitle: string;
  sourcePlatform: "youtube" | "apple";
  targetPlatform: "apple" | "youtube";
  items: TransferTrackItem[];
  status: "idle" | "matching" | "ready" | "transferring" | "transferred";
  totalTracks: number;
  matchedCount: number;
  lastUpdated: number;
}

export interface ExportOptions {
  mode: "create" | "existing";
  playlistTitle: string;
  existingPlaylistId?: string;
  targetPlatform: "apple" | "youtube";
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
    playlistCount?: number;
  };
}

export type ConnectionStatus = "connected" | "checking" | "reauth_required" | "unavailable" | "error";

export interface AccountConnection {
  id: string;
  platform: "youtube" | "apple";
  localAlias: string;
  status: ConnectionStatus;
  createdAt: number;
  lastVerifiedAt?: number;
  playlistCount?: number;
  storefront?: string;
  errorMessage?: string;
  syncType?: "live" | "snapshot";
}

export type MergeStrategy = "preserve" | "merge_one" | "append_existing";
export type DeduplicationPolicy = "keep_all" | "remove_exact" | "review_possible";

export interface SourcePlaylistSelection {
  accountId: string;
  accountAlias: string;
  platform: "youtube" | "apple";
  playlistId: string;
  playlistTitle: string;
  trackCount: number;
  thumbnailUrl?: string;
}

export interface MergeWorkflowConfig {
  id: string;
  name: string;
  sourceSelections: SourcePlaylistSelection[];
  destinationAccountId: string;
  destinationAccountAlias: string;
  destinationPlatform: "youtube" | "apple";
  strategy: MergeStrategy;
  targetPlaylistTitle?: string;
  targetExistingPlaylistId?: string;
  deduplicationPolicy: DeduplicationPolicy;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  workflowName: string;
  sourceAliases: string[];
  destinationAlias: string;
  destinationPlatform: "youtube" | "apple";
  totalTracks: number;
  matchedCount: number;
  successCount: number;
  failedCount: number;
  duplicatesRemoved: number;
  status: "completed" | "failed" | "partial";
  details?: string;
}
