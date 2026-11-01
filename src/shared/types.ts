export interface User {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: number;
  lastLoginAt?: number | null;
}

export interface AuthSession {
  user: User;
  token: string;
}

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
  platform?: PlatformType | string;
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
  targetPlatform?: PlatformType | string;
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
  sourcePlatform: PlatformType | string;
  targetPlatform: PlatformType | string;
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
  targetPlatform: PlatformType | string;
  targetAccountId?: string;
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

export type PlatformType =
  | "youtube"
  | "youtube_video"
  | "apple"
  | "spotify"
  | "soundcloud"
  | "deezer"
  | "file"
  | "tidal"
  | "subsonic"
  | "navidrome";

export interface AccountConnection {
  id: string;
  platform: PlatformType | string;
  localAlias: string;
  status: ConnectionStatus;
  createdAt: number;
  lastVerifiedAt?: number;
  playlistCount?: number;
  storefront?: string;
  errorMessage?: string;
  syncType?: "live" | "snapshot";
  userId?: string;
}

export type MergeStrategy = "preserve" | "merge_one" | "append_existing";
export type DeduplicationPolicy = "keep_all" | "remove_exact" | "review_possible";

export interface SourcePlaylistSelection {
  accountId: string;
  accountAlias: string;
  platform: PlatformType | string;
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
  destinationPlatform: PlatformType | string;
  strategy: MergeStrategy;
  targetPlaylistTitle?: string;
  targetExistingPlaylistId?: string;
  deduplicationPolicy: DeduplicationPolicy;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  userId?: string;
  username?: string;
  workflowName: string;
  sourceAliases: string[];
  destinationAlias: string;
  destinationPlatform: PlatformType | string;
  totalTracks: number;
  matchedCount: number;
  successCount: number;
  failedCount: number;
  duplicatesRemoved: number;
  status: "completed" | "failed" | "partial";
  details?: string;
}

export interface ManagedUser {
  id: string;
  username: string;
  role: "admin" | "user";
  createdAt: number;
  lastLoginAt?: number | null;
  accountCount: number;
}
