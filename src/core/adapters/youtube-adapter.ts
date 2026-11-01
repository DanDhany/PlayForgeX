import { PlatformAdapter, PlatformProvider } from "./types";
import { YouTubeMusicClient } from "../ytmusic";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const youtubeProvider: PlatformProvider = {
  id: "youtube",
  name: "YouTube Music",
  brandColor: "#FF0000",
  status: "active",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: true,
  },
  authDescription: "Browser session cookie (SAPISID) extracted automatically or entered manually.",
  authMethod: "cookie",
  notes: "Full bidirectional playlist sync and stealth session support.",
};

export class YouTubeAdapter implements PlatformAdapter {
  readonly provider = youtubeProvider;

  createClient(cookieString: string): YouTubeMusicClient {
    return new YouTubeMusicClient(cookieString);
  }

  async fetchPlaylists(cookieString?: string): Promise<PlaylistSummary[]> {
    const client = this.createClient(cookieString || "");
    return client.fetchPlaylists();
  }

  async fetchPlaylistTracks(playlistId: string, cookieString?: string): Promise<TrackMetadata[]> {
    const client = this.createClient(cookieString || "");
    return client.fetchPlaylistTracks(playlistId);
  }

  async searchCatalog(query: string, cookieString?: string) {
    const client = this.createClient(cookieString || "");
    return client.searchCatalog(query);
  }

  async createPlaylist(title: string, description?: string, cookieString?: string): Promise<string> {
    const client = this.createClient(cookieString || "");
    return client.createPlaylist(title, description);
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[], cookieString?: string): Promise<{ added: number; failed: number }> {
    const client = this.createClient(cookieString || "");
    return client.addTracksToPlaylist(playlistId, trackIds);
  }
}

export const youtubeAdapter = new YouTubeAdapter();
