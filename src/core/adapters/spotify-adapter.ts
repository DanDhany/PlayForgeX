import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const spotifyProvider: PlatformProvider = {
  id: "spotify",
  name: "Spotify",
  brandColor: "#1DB954",
  status: "planned",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: true,
  },
  authDescription: "OAuth 2.0 PKCE flow with playlist read and write permissions.",
  authMethod: "oauth",
  notes: "Direct integration via Spotify Web API planned in an upcoming update.",
};

export class SpotifyAdapter implements PlatformAdapter {
  readonly provider = spotifyProvider;

  async fetchPlaylists(_credentials?: unknown): Promise<PlaylistSummary[]> {
    throw new Error("Spotify adapter integration is planned for an upcoming update.");
  }

  async fetchPlaylistTracks(_playlistId: string, _credentials?: unknown): Promise<TrackMetadata[]> {
    throw new Error("Spotify adapter integration is planned for an upcoming update.");
  }

  async searchCatalog(_query: string, _credentials?: unknown): Promise<unknown[]> {
    throw new Error("Spotify adapter integration is planned for an upcoming update.");
  }

  async createPlaylist(_title: string, _description?: string, _credentials?: unknown): Promise<string> {
    throw new Error("Spotify adapter integration is planned for an upcoming update.");
  }

  async addTracksToPlaylist(_playlistId: string, _trackIds: string[], _credentials?: unknown): Promise<boolean> {
    throw new Error("Spotify adapter integration is planned for an upcoming update.");
  }
}

export const spotifyAdapter = new SpotifyAdapter();
