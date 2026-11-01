import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const spotifyProvider: PlatformProvider = {
  id: "spotify",
  name: "Spotify",
  brandColor: "#1DB954",
  status: "active",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: true,
  },
  authDescription: "Direct Spotify playlist link, Public Web Embed, or Spotify Web API Access Token.",
  authMethod: "oauth",
  notes: "Supports public playlist extraction without login, as well as full Web API token integration.",
};

export class SpotifyAdapter implements PlatformAdapter {
  readonly provider = spotifyProvider;

  /**
   * Extract playlist ID from a Spotify URL or raw ID.
   */
  public extractPlaylistId(input: string): string {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
    if (urlMatch) return urlMatch[1];
    return trimmed;
  }

  /**
   * Fetch tracks from Spotify public embed HTML without needing developer keys.
   */
  public async fetchViaPublicEmbed(playlistId: string): Promise<{ title: string; tracks: TrackMetadata[] }> {
    const cleanId = this.extractPlaylistId(playlistId);
    const embedUrl = `https://open.spotify.com/embed/playlist/${cleanId}`;

    const res = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Spotify embed returned HTTP ${res.status}`);
    }

    const html = await res.text();
    const scriptMatch = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/);

    if (!scriptMatch) {
      // Fallback: regex search for tracks in entity
      return { title: "Spotify Playlist", tracks: this.parseFallbackHtml(html) };
    }

    try {
      const parsed = JSON.parse(scriptMatch[1]);
      const entity = parsed.props?.pageProps?.state?.data?.entity;
      const playlistTitle = entity?.title || entity?.name || "Spotify Playlist";
      const rawTrackList = entity?.trackList || [];

      const tracks: TrackMetadata[] = rawTrackList.map((item: any, idx: number) => {
        const title = item.title || item.name || `Track ${idx + 1}`;
        const artist = item.subtitle || item.artists?.[0]?.name || "Unknown Artist";
        const durSec = item.duration ? Math.round(item.duration / 1000) : undefined;
        const thumb = item.displayArtworkUri || item.album?.images?.[0]?.url;

        return {
          id: item.uri || item.id || `spotify-track-${idx}`,
          title,
          artist,
          album: item.album?.name,
          durationSeconds: durSec,
          thumbnailUrl: thumb,
        };
      });

      return { title: playlistTitle, tracks };
    } catch {
      return { title: "Spotify Playlist", tracks: this.parseFallbackHtml(html) };
    }
  }

  private parseFallbackHtml(html: string): TrackMetadata[] {
    const tracks: TrackMetadata[] = [];
    const trackPattern = /"name":"([^"]+)","artists":\[\{"name":"([^"]+)"/g;
    let match;
    let idx = 0;
    while ((match = trackPattern.exec(html)) !== null && idx < 200) {
      tracks.push({
        id: `sp-${idx}`,
        title: match[1],
        artist: match[2],
      });
      idx++;
    }
    return tracks;
  }

  /**
   * Fetch tracks from Spotify Web API using an access token.
   */
  public async fetchViaApi(playlistId: string, accessToken: string): Promise<TrackMetadata[]> {
    const cleanId = this.extractPlaylistId(playlistId);
    const tracks: TrackMetadata[] = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${cleanId}/tracks?limit=100`;

    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Spotify API returned HTTP ${res.status}`);
      }

      const json: any = await res.json();
      const items = json.items || [];

      for (const item of items) {
        const track = item.track;
        if (!track) continue;

        const artists = (track.artists || []).map((a: any) => a.name).join(", ") || "Unknown Artist";
        const durSec = track.duration_ms ? Math.round(track.duration_ms / 1000) : undefined;
        const thumb = track.album?.images?.[0]?.url;

        tracks.push({
          id: track.id || track.uri,
          title: track.name,
          artist: artists,
          album: track.album?.name,
          durationSeconds: durSec,
          thumbnailUrl: thumb,
        });
      }

      nextUrl = json.next;
    }

    return tracks;
  }

  async fetchPlaylistTracks(playlistId: string, credentials?: unknown): Promise<TrackMetadata[]> {
    const token = typeof credentials === "object" && credentials !== null && "accessToken" in credentials
      ? (credentials as any).accessToken
      : typeof credentials === "string" && !credentials.includes("http") && credentials.length > 50
      ? credentials
      : null;

    if (token) {
      try {
        return await this.fetchViaApi(playlistId, token);
      } catch (err) {
        console.warn("Spotify API token failed, falling back to public embed:", err);
      }
    }

    const result = await this.fetchViaPublicEmbed(playlistId);
    return result.tracks;
  }

  async fetchPlaylists(credentials?: unknown): Promise<PlaylistSummary[]> {
    const token = typeof credentials === "object" && credentials !== null && "accessToken" in credentials
      ? (credentials as any).accessToken
      : typeof credentials === "string" && !credentials.includes("http") && credentials.length > 50
      ? credentials
      : null;

    if (token) {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json: any = await res.json();
          return (json.items || []).map((p: any) => ({
            id: p.id,
            title: p.name,
            description: p.description,
            trackCount: p.tracks?.total || 0,
            thumbnailUrl: p.images?.[0]?.url,
          }));
        }
      } catch (err: any) {
        console.warn("Failed fetching Spotify user playlists:", err.message);
      }
    }

    // If input is a playlist URL/ID, treat it as a single playlist entry
    if (typeof credentials === "string" && (credentials.includes("spotify.com") || credentials.length > 15)) {
      const id = this.extractPlaylistId(credentials);
      try {
        const details = await this.fetchViaPublicEmbed(id);
        return [
          {
            id,
            title: details.title,
            trackCount: details.tracks.length,
          },
        ];
      } catch {
        return [{ id, title: "Spotify Playlist", trackCount: 0 }];
      }
    }

    return [];
  }

  async searchCatalog(query: string, credentials?: unknown): Promise<unknown[]> {
    const token = typeof credentials === "string" ? credentials : null;
    if (!token) return [];

    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json: any = await res.json();
        return json.tracks?.items || [];
      }
    } catch {}
    return [];
  }

  async createPlaylist(title: string, description?: string, credentials?: unknown): Promise<string> {
    const token = typeof credentials === "string" ? credentials : null;
    if (!token) throw new Error("Spotify token required to create playlist");

    const meRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) throw new Error("Failed to get current Spotify user ID");
    const me = await meRes.json();

    const createRes = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        description: description || "Imported via PlayForgeX",
        public: false,
      }),
    });

    if (!createRes.ok) throw new Error("Failed creating Spotify playlist");
    const pl = await createRes.json();
    return pl.id;
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[], credentials?: unknown): Promise<boolean> {
    const token = typeof credentials === "string" ? credentials : null;
    if (!token) return false;

    const uris = trackUris.map((u) => (u.startsWith("spotify:track:") ? u : `spotify:track:${u}`));

    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
    });

    return res.ok;
  }
}

export const spotifyAdapter = new SpotifyAdapter();
