import type { PlaylistSummary, TrackMetadata } from "../../shared/types";

export type PlatformId =
  | "youtube"
  | "youtube_video"
  | "apple"
  | "spotify"
  | "tidal"
  | "deezer"
  | "soundcloud"
  | "subsonic"
  | "navidrome"
  | "file";

export type PlatformStatus = "active" | "experimental" | "planned";

export type AuthMethod = "cookie" | "token" | "oauth" | "basic" | "public" | "file";

export interface PlatformCapabilities {
  canReadPlaylists: boolean;
  canReadTracks: boolean;
  canCreatePlaylists: boolean;
  canAddTracks: boolean;
  searchCatalog: boolean;
  supportsMobileSync: boolean;
}

export interface PlatformProvider {
  id: PlatformId;
  name: string;
  brandColor: string;
  status: PlatformStatus;
  capabilities: PlatformCapabilities;
  authDescription: string;
  authMethod: AuthMethod;
  notes?: string;
}

export interface PlatformAdapter {
  readonly provider: PlatformProvider;
  fetchPlaylists?(credentials?: unknown): Promise<PlaylistSummary[]>;
  fetchPlaylistTracks?(playlistId: string, credentials?: unknown): Promise<TrackMetadata[]>;
  searchCatalog?(query: string, credentials?: unknown): Promise<unknown[]>;
  createPlaylist?(title: string, description?: string, credentials?: unknown): Promise<string>;
  addTracksToPlaylist?(playlistId: string, trackIds: string[], credentials?: unknown): Promise<boolean | number | { added: number; failed: number }>;
}
