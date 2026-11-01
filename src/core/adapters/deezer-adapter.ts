import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const deezerProvider: PlatformProvider = {
  id: "deezer",
  name: "Deezer",
  brandColor: "#A238FF",
  status: "active",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: false,
    canAddTracks: false,
    searchCatalog: true,
    supportsMobileSync: false,
  },
  authDescription: "Direct Deezer Playlist URL or numeric ID. Zero authentication required via open REST API.",
  authMethod: "public",
  notes: "Full lossless metadata, ISRC extraction, and audio preview clips via official open Deezer API.",
};

export class DeezerAdapter implements PlatformAdapter {
  readonly provider = deezerProvider;

  /**
   * Extract numeric Deezer playlist ID from URL or raw ID string.
   */
  public extractPlaylistId(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/playlist\/(\d+)/);
    if (match) return match[1];
    const numMatch = trimmed.match(/^\d+$/);
    if (numMatch) return trimmed;
    return trimmed;
  }

  async fetchPlaylistTracks(playlistId: string, _credentials?: unknown): Promise<TrackMetadata[]> {
    const cleanId = this.extractPlaylistId(playlistId);
    const tracks: TrackMetadata[] = [];
    let nextUrl: string | null = `https://api.deezer.com/playlist/${cleanId}/tracks?limit=100`;

    try {
      while (nextUrl) {
        const res = await fetch(nextUrl);
        if (!res.ok) {
          throw new Error(`Deezer API responded with HTTP ${res.status}`);
        }

        const data: any = await res.json();
        if (data.error) {
          throw new Error(data.error.message || "Deezer API Error");
        }

        const items = data.data || [];
        for (const item of items) {
          tracks.push({
            id: String(item.id),
            title: item.title,
            artist: item.artist?.name || "Unknown Artist",
            album: item.album?.title,
            durationSeconds: item.duration,
            thumbnailUrl: item.album?.cover_medium || item.album?.cover,
          });
        }

        nextUrl = data.next || null;
      }
    } catch (err: any) {
      console.warn("Failed fetching Deezer playlist tracks:", err.message);
    }

    return tracks;
  }

  async fetchPlaylists(credentials?: unknown): Promise<PlaylistSummary[]> {
    if (typeof credentials === "string") {
      const cleanId = this.extractPlaylistId(credentials);
      try {
        const res = await fetch(`https://api.deezer.com/playlist/${cleanId}`);
        if (res.ok) {
          const data: any = await res.json();
          if (!data.error) {
            return [
              {
                id: String(data.id),
                title: data.title || "Deezer Playlist",
                description: data.description,
                trackCount: data.nb_tracks || 0,
                thumbnailUrl: data.picture_medium || data.picture,
              },
            ];
          }
        }
      } catch {}
    }
    return [];
  }

  async searchCatalog(query: string, _credentials?: unknown): Promise<unknown[]> {
    try {
      const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`);
      if (res.ok) {
        const data: any = await res.json();
        return data.data || [];
      }
    } catch {}
    return [];
  }
}

export const deezerAdapter = new DeezerAdapter();
