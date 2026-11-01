import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const fileProvider: PlatformProvider = {
  id: "file",
  name: "File / Text Import",
  brandColor: "#64748B",
  status: "active",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: false,
    canAddTracks: false,
    searchCatalog: false,
    supportsMobileSync: true,
  },
  authDescription: "Paste song list text, upload M3U, CSV, or Soundiiz/PlayForgeX JSON snapshot.",
  authMethod: "file",
  notes: "Universal file parser supporting M3U, M3U8, CSV, plain text, and JSON playlist exports.",
};

export class FileAdapter implements PlatformAdapter {
  readonly provider = fileProvider;

  /**
   * Parse plain text, M3U, CSV, or JSON string into structured TrackMetadata array.
   */
  public parseContent(content: string, filename = "Custom Playlist"): { title: string; tracks: TrackMetadata[] } {
    const trimmed = content.trim();

    // Check if JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return this.parseJson(parsed, filename);
      } catch {}
    }

    // Check if M3U / M3U8
    if (trimmed.startsWith("#EXTM3U") || trimmed.includes("#EXTINF:")) {
      return this.parseM3U(trimmed, filename);
    }

    // Check if CSV (comma-separated with headers)
    if (this.looksLikeCsv(trimmed)) {
      return this.parseCsv(trimmed, filename);
    }

    // Default to plain text line-by-line
    return this.parsePlainText(trimmed, filename);
  }

  private looksLikeCsv(text: string): boolean {
    const firstLine = text.split(/\r?\n/)[0].toLowerCase();
    return (
      firstLine.includes(",") &&
      (firstLine.includes("title") || firstLine.includes("track") || firstLine.includes("artist") || firstLine.includes("song"))
    );
  }

  private parseJson(json: any, defaultTitle: string): { title: string; tracks: TrackMetadata[] } {
    let title = defaultTitle;
    let rawList: any[] = [];

    if (Array.isArray(json)) {
      rawList = json;
    } else if (json && typeof json === "object") {
      title = json.title || json.name || json.playlistName || defaultTitle;
      rawList = json.tracks || json.items || json.trackList || json.songs || [];
    }

    const tracks: TrackMetadata[] = rawList.map((item, idx) => {
      const trackTitle = item.title || item.name || item.trackName || `Track ${idx + 1}`;
      const artist = item.artist || item.artistName || item.artists?.[0]?.name || "Unknown Artist";
      const album = item.album || item.albumName;
      const durSec = item.durationSeconds || (item.duration_ms ? Math.round(item.duration_ms / 1000) : undefined);

      return {
        id: String(item.id || item.videoId || `file-${idx}`),
        videoId: item.videoId,
        title: trackTitle,
        artist,
        album,
        durationSeconds: durSec,
        thumbnailUrl: item.thumbnailUrl || item.artworkUrl,
      };
    });

    return { title, tracks };
  }

  private parseM3U(m3u: string, filename: string): { title: string; tracks: TrackMetadata[] } {
    const tracks: TrackMetadata[] = [];
    const lines = m3u.split(/\r?\n/);
    let idx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXTINF:")) {
        // Format: #EXTINF:123,Artist - Title
        const info = line.substring(8);
        const commaIdx = info.indexOf(",");
        const durSec = commaIdx !== -1 ? parseInt(info.substring(0, commaIdx), 10) : undefined;
        const entry = commaIdx !== -1 ? info.substring(commaIdx + 1).trim() : info.trim();

        const dashMatch = entry.match(/^(.*?)\s*[-–—]\s*(.*)$/);
        const artist = dashMatch ? dashMatch[1].trim() : "Unknown Artist";
        const title = dashMatch ? dashMatch[2].trim() : entry;

        tracks.push({
          id: `m3u-${idx++}`,
          title,
          artist,
          durationSeconds: isNaN(durSec as number) ? undefined : durSec,
        });
      }
    }

    return { title: filename.replace(/\.(m3u8?|txt)$/i, ""), tracks };
  }

  private parseCsv(csv: string, filename: string): { title: string; tracks: TrackMetadata[] } {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { title: filename, tracks: [] };

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
    const titleIdx = header.findIndex((h) => h === "title" || h === "track name" || h === "song title" || h === "name");
    const artistIdx = header.findIndex((h) => h === "artist" || h === "artist name" || h === "singer");
    const albumIdx = header.findIndex((h) => h === "album" || h === "album name");

    const tracks: TrackMetadata[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length === 0 || !cols.some((c) => c)) continue;

      const trackTitle = titleIdx !== -1 && cols[titleIdx] ? cols[titleIdx] : cols[0];
      const artist = artistIdx !== -1 && cols[artistIdx] ? cols[artistIdx] : cols[1] || "Unknown Artist";
      const album = albumIdx !== -1 && cols[albumIdx] ? cols[albumIdx] : undefined;

      tracks.push({
        id: `csv-${i}`,
        title: trackTitle,
        artist,
        album,
      });
    }

    return { title: filename.replace(/\.csv$/i, ""), tracks };
  }

  private parsePlainText(text: string, filename: string): { title: string; tracks: TrackMetadata[] } {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const tracks: TrackMetadata[] = [];

    lines.forEach((line, idx) => {
      // Strip leading numbering: "1. ", "01 - "
      const cleanLine = line.replace(/^\d+[\.\-\)]\s*/, "").trim();
      const splitMatch = cleanLine.match(/^(.*?)\s*[-–—:]\s*(.*)$/);

      if (splitMatch) {
        tracks.push({
          id: `txt-${idx}`,
          artist: splitMatch[1].trim(),
          title: splitMatch[2].trim(),
        });
      } else {
        tracks.push({
          id: `txt-${idx}`,
          artist: "Unknown Artist",
          title: cleanLine,
        });
      }
    });

    return { title: filename.replace(/\.(txt|text)$/i, ""), tracks };
  }

  async fetchPlaylistTracks(playlistId: string, credentials?: unknown): Promise<TrackMetadata[]> {
    if (typeof credentials === "string") {
      const parsed = this.parseContent(credentials, playlistId);
      return parsed.tracks;
    }
    return [];
  }

  async fetchPlaylists(credentials?: unknown): Promise<PlaylistSummary[]> {
    if (typeof credentials === "string") {
      const parsed = this.parseContent(credentials);
      return [
        {
          id: "file-import-pl",
          title: parsed.title,
          trackCount: parsed.tracks.length,
        },
      ];
    }
    return [];
  }
}

export const fileAdapter = new FileAdapter();
