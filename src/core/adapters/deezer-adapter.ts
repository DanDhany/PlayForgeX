import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const deezerProvider: PlatformProvider = {
  id: "deezer",
  name: "Deezer",
  brandColor: "#A238FF",
  status: "planned",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: false,
  },
  authDescription: "ARL session cookie or Deezer Web API application token.",
  authMethod: "cookie",
  notes: "Deezer Web API integration planned in an upcoming update.",
};

export class DeezerAdapter implements PlatformAdapter {
  readonly provider = deezerProvider;

  async fetchPlaylists(_credentials?: unknown): Promise<PlaylistSummary[]> {
    throw new Error("Deezer adapter integration is planned for an upcoming update.");
  }

  async fetchPlaylistTracks(_playlistId: string, _credentials?: unknown): Promise<TrackMetadata[]> {
    throw new Error("Deezer adapter integration is planned for an upcoming update.");
  }

  async searchCatalog(_query: string, _credentials?: unknown): Promise<unknown[]> {
    throw new Error("Deezer adapter integration is planned for an upcoming update.");
  }

  async createPlaylist(_title: string, _description?: string, _credentials?: unknown): Promise<string> {
    throw new Error("Deezer adapter integration is planned for an upcoming update.");
  }

  async addTracksToPlaylist(_playlistId: string, _trackIds: string[], _credentials?: unknown): Promise<boolean> {
    throw new Error("Deezer adapter integration is planned for an upcoming update.");
  }
}

export const deezerAdapter = new DeezerAdapter();
