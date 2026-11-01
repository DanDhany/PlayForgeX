import { PlatformAdapter, PlatformProvider } from "./types";
import { PlaylistSummary, TrackMetadata } from "../../shared/types";

export const youtubeVideoProvider: PlatformProvider = {
  id: "youtube_video",
  name: "YouTube Video Playlists",
  brandColor: "#FF4500",
  status: "active",
  capabilities: {
    canReadPlaylists: true,
    canReadTracks: true,
    canCreatePlaylists: true,
    canAddTracks: true,
    searchCatalog: true,
    supportsMobileSync: true,
  },
  authDescription: "Direct YouTube video playlist link or public video IDs. Zero login required for public playlists.",
  authMethod: "public",
  notes: "Sanitizes raw video noise (MV, 4K, Lyrics, Remaster) and preserves source video IDs.",
};

export interface SanitizedVideoTrack {
  cleanTitle: string;
  cleanArtist: string;
  rawTitle: string;
  videoId?: string;
  isLive: boolean;
  isRemix: boolean;
  isCover: boolean;
}

export function sanitizeVideoTitle(raw: string, channelName?: string): SanitizedVideoTrack {
  let title = raw.trim();

  const isLive = /\b(live|concert|tour|acoustic\s+live)\b/i.test(title);
  const isRemix = /\b(remix|remixed|mix|club\s+mix|extended\s+mix|dub|bootleg)\b/i.test(title);
  const isCover = /\b(cover|tribute|performed\s+by)\b/i.test(title);

  // Common bracketed garbage in video titles
  const noisePatterns = [
    /\[\s*official\s*(music)?\s*video\s*\]/gi,
    /\(\s*official\s*(music)?\s*video\s*\)/gi,
    /\[\s*official\s*audio\s*\]/gi,
    /\(\s*official\s*audio\s*\)/gi,
    /\[\s*lyric\s*video\s*\]/gi,
    /\(\s*lyric\s*video\s*\)/gi,
    /\[\s*lyrics?\s*\]/gi,
    /\(\s*lyrics?\s*\)/gi,
    /\[\s*mv\s*\]/gi,
    /\(\s*mv\s*\)/gi,
    /\[\s*m\/v\s*\]/gi,
    /\[\s*visualizer\s*\]/gi,
    /\(\s*visualizer\s*\)/gi,
    /\[\s*4k\s*(60fps)?\s*\]/gi,
    /\(\s*4k\s*(60fps)?\s*\)/gi,
    /\[\s*hd\s*\]/gi,
    /\(\s*hd\s*\)/gi,
    /\[\s*remastered\s*(\d{4})?\s*\]/gi,
    /\(\s*remastered\s*(\d{4})?\s*\)/gi,
    /\[\s*audio\s*\]/gi,
    /\|\s*official\s*video/gi,
  ];

  for (const pat of noisePatterns) {
    title = title.replace(pat, " ");
  }

  // Remove trailing and leading quotes or extra whitespace
  title = title.replace(/^[“"']+|[”"']+$/g, "").replace(/\s{2,}/g, " ").trim();

  let artist = "";
  let songTitle = title;

  // Pattern: "Artist - Title" or "Artist – Title" or "Artist : Title"
  const splitMatch = title.match(/^(.*?)\s*[-–—:：]\s*(.*)$/);
  if (splitMatch) {
    artist = splitMatch[1].trim();
    songTitle = splitMatch[2].trim();
  } else if (channelName && channelName !== "YouTube" && !channelName.endsWith(" - Topic")) {
    // If no hyphen, use channel as artist if informative
    artist = channelName.replace(/\s*-\s*Topic$/i, "").trim();
  } else {
    artist = "Unknown Artist";
  }

  // Strip featured artists from title: "Song (feat. Drake)" -> artist: "Artist feat. Drake"
  const featMatch = songTitle.match(/\s*[\(\[]\s*(?:feat\.?|ft\.?|featuring)\s+([^\)\]]+)[\)\]]/i);
  if (featMatch) {
    artist = `${artist} feat. ${featMatch[1].trim()}`;
    songTitle = songTitle.replace(/\s*[\(\[]\s*(?:feat\.?|ft\.?|featuring)\s+([^\)\]]+)[\)\]]/i, "").trim();
  }

  return {
    cleanTitle: songTitle || raw,
    cleanArtist: artist,
    rawTitle: raw,
    isLive,
    isRemix,
    isCover,
  };
}

export class YouTubeVideoAdapter implements PlatformAdapter {
  readonly provider = youtubeVideoProvider;

  /**
   * Parse a YouTube video playlist URL or ID into a normalized playlist ID.
   */
  public normalizePlaylistId(input: string): string {
    const trimmed = input.trim();
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch) return listMatch[1];
    if (trimmed.startsWith("PL") || trimmed.startsWith("VLPL") || trimmed.startsWith("UU") || trimmed.startsWith("LL")) {
      return trimmed.replace(/^VL/, "");
    }
    return trimmed;
  }

  /**
   * Fetch tracks from a YouTube video playlist using public Innertube web endpoint.
   */
  async fetchPlaylistTracks(playlistId: string, credentials?: unknown): Promise<TrackMetadata[]> {
    const normalizedId = this.normalizePlaylistId(playlistId);
    const browseId = normalizedId.startsWith("VL") ? normalizedId : `VL${normalizedId}`;

    const cookie = typeof credentials === "string" ? credentials : "";

    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-YouTube-Client-Name": "1",
          "X-YouTube-Client-Version": "2.20240101.00.00",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240101.00.00",
              hl: "en",
              gl: "US",
            },
          },
          browseId,
        }),
      });

      if (!res.ok) {
        throw new Error(`YouTube Innertube responded with HTTP ${res.status}`);
      }

      const json = await res.json();
      return this.parseInnertubeResponse(json);
    } catch (err: any) {
      console.warn("Failed fetching YouTube video playlist via Innertube:", err.message);
      return [];
    }
  }

  /**
   * Recursively extract video items from Innertube JSON.
   */
  public parseInnertubeResponse(json: any): TrackMetadata[] {
    const tracks: TrackMetadata[] = [];
    const seen = new Set<string>();

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== "object") return;

      const renderer = obj.playlistVideoRenderer || obj.playlistVideoListRenderer;
      if (renderer) {
        const videoId = renderer.videoId;
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);

          const rawTitle = renderer.title?.runs?.map((r: any) => r.text).join("") || renderer.title?.simpleText || "Untitled";
          const channel = renderer.shortBylineText?.runs?.map((r: any) => r.text).join("") || "";
          const durSec = renderer.lengthSeconds ? parseInt(renderer.lengthSeconds, 10) : undefined;
          const thumb = renderer.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const sanitized = sanitizeVideoTitle(rawTitle, channel);

          tracks.push({
            id: videoId,
            videoId,
            title: sanitized.cleanTitle,
            artist: sanitized.cleanArtist,
            album: sanitized.cleanTitle,
            durationSeconds: durSec,
            thumbnailUrl: thumb,
          });
        }
      }

      for (const key of Object.keys(obj)) {
        traverse(obj[key]);
      }
    };

    traverse(json);
    return tracks;
  }

  async fetchPlaylists(credentials?: unknown): Promise<PlaylistSummary[]> {
    if (typeof credentials === "string" && credentials.includes("list=")) {
      const plId = this.normalizePlaylistId(credentials);
      return [
        {
          id: plId,
          title: "YouTube Video Playlist",
          trackCount: 0,
        },
      ];
    }
    return [];
  }
}

export const youtubeVideoAdapter = new YouTubeVideoAdapter();
