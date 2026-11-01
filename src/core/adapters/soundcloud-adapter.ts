import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const soundCloudProvider: PlatformProvider = {
  id: "soundcloud",
  name: "SoundCloud",
  brandColor: "#FF5500",
  status: "active",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: false,
    canAddTracks: false,
    searchCatalog: true,
    supportsMobileSync: false,
  },
  authDescription: "Direct SoundCloud Set / Playlist URL. Zero authentication needed for public sets.",
  authMethod: "public",
  notes: "Ingests indie releases, underground DJ sets, and live mixes directly.",
};

export class SoundCloudAdapter implements PlatformAdapter {
  readonly provider = soundCloudProvider;

  /**
   * Parse a SoundCloud URL or Set ID into a normalized URL.
   */
  public normalizeSetUrl(input: string): string {
    const trimmed = input.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed.split("?")[0];
    }
    return `https://soundcloud.com/${trimmed}`;
  }

  /**
   * Ingest tracks from a public SoundCloud set/playlist page.
   */
  async fetchPlaylistTracks(playlistId: string, _credentials?: unknown): Promise<TrackMetadata[]> {
    const url = this.normalizeSetUrl(playlistId);

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        throw new Error(`SoundCloud page returned HTTP ${res.status}`);
      }

      const html = await res.text();
      return this.parseTracksFromHtml(html);
    } catch (err: any) {
      console.warn("Failed fetching SoundCloud set:", err.message);
      return [];
    }
  }

  public parseTracksFromHtml(html: string): TrackMetadata[] {
    const tracks: TrackMetadata[] = [];

    // Approach 1: Look for __sc_hydration JSON blocks
    const hydrationMatch = html.match(/window\.__sc_hydration\s*=\s*(\[\{[\s\S]*?\}\]);/);
    if (hydrationMatch) {
      try {
        const parsed = JSON.parse(hydrationMatch[1]);
        for (const item of parsed) {
          if (item?.data?.tracks && Array.isArray(item.data.tracks)) {
            for (const t of item.data.tracks) {
              const durSec = t.duration ? Math.round(t.duration / 1000) : undefined;
              tracks.push({
                id: String(t.id || t.urn || tracks.length),
                title: t.title || "Untitled",
                artist: t.user?.username || "SoundCloud Artist",
                durationSeconds: durSec,
                thumbnailUrl: t.artwork_url || t.user?.avatar_url,
              });
            }
          }
        }
        if (tracks.length > 0) return tracks;
      } catch {}
    }

    // Approach 2: Look for itemprops or schema.org metadata in HTML
    const trackPattern = /<article itemprop="track"[^>]*>[\s\S]*?<a itemprop="url"[^>]*>([^<]+)<\/a>[\s\S]*?by\s*<a[^>]*>([^<]+)<\/a>/g;
    let match;
    let idx = 0;
    while ((match = trackPattern.exec(html)) !== null && idx < 200) {
      tracks.push({
        id: `sc-${idx}`,
        title: match[1].trim(),
        artist: match[2].trim(),
      });
      idx++;
    }

    return tracks;
  }

  async fetchPlaylists(credentials?: unknown): Promise<PlaylistSummary[]> {
    if (typeof credentials === "string" && credentials.includes("soundcloud.com")) {
      const url = this.normalizeSetUrl(credentials);
      const slug = url.split("/").pop() || "SoundCloud Set";
      return [
        {
          id: url,
          title: slug.replace(/-/g, " "),
          trackCount: 0,
        },
      ];
    }
    return [];
  }
}

export const soundCloudAdapter = new SoundCloudAdapter();
