import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const soundCloudProvider: PlatformProvider = {
  id: "soundcloud",
  name: "SoundCloud",
  brandColor: "#FF5500",
  status: "planned",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: false,
    canAddTracks: false,
    searchCatalog: true,
    supportsMobileSync: false,
  },
  authDescription: "SoundCloud OAuth 2.0 authorization or client credentials.",
  authMethod: "oauth",
  notes: "Independent artist and remix catalog search planned.",
};

export class SoundCloudAdapter implements PlatformAdapter {
  readonly provider = soundCloudProvider;

  async fetchPlaylists(_credentials?: unknown): Promise<PlaylistSummary[]> {
    throw new Error("SoundCloud adapter integration is planned for an upcoming update.");
  }

  async fetchPlaylistTracks(_playlistId: string, _credentials?: unknown): Promise<TrackMetadata[]> {
    throw new Error("SoundCloud adapter integration is planned for an upcoming update.");
  }

  async searchCatalog(_query: string, _credentials?: unknown): Promise<unknown[]> {
    throw new Error("SoundCloud adapter integration is planned for an upcoming update.");
  }

  async createPlaylist(_title: string, _description?: string, _credentials?: unknown): Promise<string> {
    throw new Error("SoundCloud does not support playlist creation via this adapter.");
  }

  async addTracksToPlaylist(_playlistId: string, _trackIds: string[], _credentials?: unknown): Promise<boolean> {
    throw new Error("SoundCloud does not support adding tracks via this adapter.");
  }
}

export const soundCloudAdapter = new SoundCloudAdapter();
