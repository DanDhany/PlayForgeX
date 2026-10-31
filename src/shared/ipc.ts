import {
  ServiceAuthStatus,
  PlaylistSummary,
  TrackMetadata,
  AppleMusicTrack,
  TransferTrackItem,
  TransferJob,
} from "./types";

export const IPC_CHANNELS = {
  GET_STATUS: "auth:get-status",
  LOGIN_YOUTUBE: "auth:login-youtube",
  LOGIN_APPLE: "auth:login-apple",
  LOGOUT: "auth:logout",
  FETCH_PLAYLISTS: "playlists:fetch",
  FETCH_TRACKS: "playlists:fetch-tracks",
  MATCH_TRACKS: "tracks:match",
  SEARCH_APPLE_CATALOG: "search:apple-catalog",
  EXECUTE_TRANSFER: "transfer:execute",
  ON_TRANSFER_PROGRESS: "transfer:on-progress",
} as const;

export interface IpcApi {
  getStatus: () => Promise<ServiceAuthStatus>;
  loginYouTube: () => Promise<{ success: boolean; user?: string; error?: string }>;
  loginApple: () => Promise<{ success: boolean; storefront?: string; error?: string }>;
  logout: (service: "youtube" | "apple" | "all") => Promise<void>;
  fetchPlaylists: () => Promise<PlaylistSummary[]>;
  fetchTracks: (playlistId: string) => Promise<TrackMetadata[]>;
  matchTracks: (tracks: TrackMetadata[]) => Promise<TransferTrackItem[]>;
  searchAppleCatalog: (query: string) => Promise<AppleMusicTrack[]>;
  executeTransfer: (
    playlistTitle: string,
    tracks: TransferTrackItem[],
    onProgressCallbackId?: string
  ) => Promise<{ success: boolean; createdPlaylistId?: string; error?: string }>;
  onTransferProgress: (callback: (progress: TransferJob["progress"]) => void) => () => void;
}

declare global {
  interface Window {
    api: IpcApi;
  }
}
