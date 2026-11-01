import { PlatformAdapter, PlatformProvider } from "./types";
import { AppleMusicClient } from "../applemusic";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const appleProvider: PlatformProvider = {
  id: "apple",
  name: "Apple Music",
  brandColor: "#FA2D48",
  status: "active",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: true,
  },
  authDescription: "Developer Bearer token and user music token via MusicKit Web.",
  authMethod: "token",
  notes: "Native Apple MusicKit Web API with catalog search and library mutations.",
};

export interface AppleCredentials {
  developerToken?: string;
  musicUserToken?: string;
  storefront?: string;
}

export class AppleAdapter implements PlatformAdapter {
  readonly provider = appleProvider;

  createClient(credentials?: AppleCredentials): AppleMusicClient {
    return new AppleMusicClient(credentials?.musicUserToken || "", credentials?.developerToken);
  }

  async fetchPlaylists(credentials?: AppleCredentials): Promise<PlaylistSummary[]> {
    const client = this.createClient(credentials);
    const playlists = await client.getUserPlaylists();
    return playlists.map((p: any) => ({
      id: p.id,
      title: p.attributes?.name || "Untitled Playlist",
      description: p.attributes?.description?.standard,
      trackCount: p.relationships?.tracks?.data?.length || 0,
      thumbnailUrl: p.attributes?.artwork?.url
        ?.replace("{w}", "300")
        ?.replace("{h}", "300")
        ?.replace("{f}", "jpg"),
    }));
  }

  async fetchPlaylistTracks(playlistId: string, credentials?: AppleCredentials): Promise<TrackMetadata[]> {
    const client = this.createClient(credentials);
    return client.getPlaylistTracks(playlistId);
  }

  async searchCatalog(query: string, credentials?: AppleCredentials) {
    const client = this.createClient(credentials);
    return client.searchCatalog(query, credentials?.storefront);
  }

  async createPlaylist(title: string, description?: string, credentials?: AppleCredentials): Promise<string> {
    const client = this.createClient(credentials);
    return client.createPlaylist(title, description);
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[], credentials?: AppleCredentials): Promise<{ added: number; failed: number }> {
    const client = this.createClient(credentials);
    return client.addTracksToPlaylist(playlistId, trackIds);
  }
}

export const appleAdapter = new AppleAdapter();
