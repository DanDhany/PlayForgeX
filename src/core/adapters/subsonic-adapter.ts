import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const subsonicProvider: PlatformProvider = {
  id: "subsonic",
  name: "Subsonic / Navidrome",
  brandColor: "#0080FF",
  status: "planned",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: true,
  },
  authDescription: "Enter server endpoint URL along with username and token or password.",
  authMethod: "basic",
  notes: "Self-hosted music server sync (Subsonic API v1.16+ compatible).",
};

export class SubsonicAdapter implements PlatformAdapter {
  readonly provider = subsonicProvider;

  async fetchPlaylists(_credentials?: unknown): Promise<PlaylistSummary[]> {
    throw new Error("Subsonic adapter integration is planned for an upcoming update.");
  }

  async fetchPlaylistTracks(_playlistId: string, _credentials?: unknown): Promise<TrackMetadata[]> {
    throw new Error("Subsonic adapter integration is planned for an upcoming update.");
  }

  async searchCatalog(_query: string, _credentials?: unknown): Promise<unknown[]> {
    throw new Error("Subsonic adapter integration is planned for an upcoming update.");
  }

  async createPlaylist(_title: string, _description?: string, _credentials?: unknown): Promise<string> {
    throw new Error("Subsonic adapter integration is planned for an upcoming update.");
  }

  async addTracksToPlaylist(_playlistId: string, _trackIds: string[], _credentials?: unknown): Promise<boolean> {
    throw new Error("Subsonic adapter integration is planned for an upcoming update.");
  }
}

export const subsonicAdapter = new SubsonicAdapter();
