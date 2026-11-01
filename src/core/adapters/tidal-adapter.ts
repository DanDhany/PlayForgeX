import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const tidalProvider: PlatformProvider = {
  id: "tidal",
  name: "Tidal",
  brandColor: "#000000",
  status: "planned",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: false,
  },
  authDescription: "OAuth 2.0 authorization code flow or session token.",
  authMethod: "oauth",
  notes: "High-fidelity lossless streaming support planned.",
};

export class TidalAdapter implements PlatformAdapter {
  readonly provider = tidalProvider;

  async fetchPlaylists(_credentials?: unknown): Promise<PlaylistSummary[]> {
    throw new Error("Tidal adapter integration is planned for an upcoming update.");
  }

  async fetchPlaylistTracks(_playlistId: string, _credentials?: unknown): Promise<TrackMetadata[]> {
    throw new Error("Tidal adapter integration is planned for an upcoming update.");
  }

  async searchCatalog(_query: string, _credentials?: unknown): Promise<unknown[]> {
    throw new Error("Tidal adapter integration is planned for an upcoming update.");
  }

  async createPlaylist(_title: string, _description?: string, _credentials?: unknown): Promise<string> {
    throw new Error("Tidal adapter integration is planned for an upcoming update.");
  }

  async addTracksToPlaylist(_playlistId: string, _trackIds: string[], _credentials?: unknown): Promise<boolean> {
    throw new Error("Tidal adapter integration is planned for an upcoming update.");
  }
}

export const tidalAdapter = new TidalAdapter();
