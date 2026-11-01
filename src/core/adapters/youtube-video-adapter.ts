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
    /\[\s*official\s*(music)?\s*video[^\]]*\]/gi,
    /\(\s*official\s*(music)?\s*video[^\)]*\)/gi,
    /\[\s*official\s*audio[^\]]*\]/gi,
    /\(\s*official\s*audio[^\)]*\)/gi,
    /\[\s*lyric\s*video[^\]]*\]/gi,
    /\(\s*lyric\s*video[^\)]*\)/gi,
    /\[\s*lyrics?[^\]]*\]/gi,
    /\(\s*lyrics?[^\)]*\)/gi,
    /\[\s*mv[^\]]*\]/gi,
    /\(\s*mv[^\)]*\)/gi,
    /\[\s*m\/v[^\]]*\]/gi,
    /\[\s*visualizer[^\]]*\]/gi,
    /\(\s*visualizer[^\)]*\)/gi,
    /\[\s*4k[^\]]*\]/gi,
    /\(\s*4k[^\)]*\)/gi,
    /\[\s*hd[^\]]*\]/gi,
    /\(\s*hd[^\)]*\)/gi,
    /\[\s*remastered[^\]]*\]/gi,
    /\(\s*remastered[^\)]*\)/gi,
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
    // Single watch URL fallback: extract videoId
    const watchMatch = trimmed.match(/(?:watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    return trimmed;
  }

  /**
   * Fetch tracks from a YouTube video playlist using public page scraping with Innertube fallback.
   */
  async fetchPlaylistTracks(playlistId: string, credentials?: unknown): Promise<TrackMetadata[]> {
    const normalizedId = this.normalizePlaylistId(playlistId);

    // 1. Try public HTML playlist scraping first (most reliable, zero 400 errors)
    if (normalizedId.startsWith("PL") || normalizedId.startsWith("UU") || normalizedId.startsWith("LL") || normalizedId.length > 15) {
      try {
        const url = `https://www.youtube.com/playlist?list=${normalizedId}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        if (res.ok) {
          const html = await res.text();
          if (html.includes("var ytInitialData =")) {
            const jsonStr = html.split("var ytInitialData =")[1].split(";</script>")[0];
            const data = JSON.parse(jsonStr);
            const tracks = this.parseInnertubeResponse(data);
            if (tracks.length > 0) return tracks;
          }
        }
      } catch (err: any) {
        console.warn("[YouTubeVideoAdapter] Public HTML scrape warning:", err.message);
      }
    }

    // 2. Try Innertube Web Browse endpoint
    const browseId = normalizedId.startsWith("VL") ? normalizedId : `VL${normalizedId}`;
    const cookie = typeof credentials === "string" ? credentials : "";

    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

      if (res.ok) {
        const json = await res.json();
        const tracks = this.parseInnertubeResponse(json);
        if (tracks.length > 0) return tracks;
      }
    } catch (err: any) {
      console.warn("Failed fetching YouTube video playlist via Innertube:", err.message);
    }

    // 3. Fallback: If it was a single video ID (11 chars), synthesize 1 track
    if (normalizedId.length === 11 && !normalizedId.startsWith("PL")) {
      return [
        {
          id: normalizedId,
          videoId: normalizedId,
          title: "YouTube Video",
          artist: "Unknown Artist",
          thumbnailUrl: `https://i.ytimg.com/vi/${normalizedId}/hqdefault.jpg`,
        },
      ];
    }

    return [];
  }

  /**
   * Recursively extract video items from Innertube JSON (supports legacy renderers & modern lockupViewModel).
   */
  public parseInnertubeResponse(json: any): TrackMetadata[] {
    const tracks: TrackMetadata[] = [];
    const seen = new Set<string>();

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== "object") return;

      // Modern desktop lockupViewModel
      const lockup = obj.lockupViewModel;
      if (lockup && (lockup.contentType === "LOCKUP_CONTENT_TYPE_VIDEO" || lockup.contentId)) {
        const videoId = lockup.contentId;
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);
          const rawTitle =
            lockup.metadata?.lockupMetadataViewModel?.title?.content ||
            lockup.rendererContext?.accessibilityContext?.label ||
            "Untitled";
          const rows =
            lockup.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
          const channel = rows[0]?.metadataParts?.[0]?.text?.content || "";
          const thumb =
            lockup.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          const sanitized = sanitizeVideoTitle(rawTitle, channel);

          tracks.push({
            id: videoId,
            videoId,
            title: sanitized.cleanTitle,
            artist: sanitized.cleanArtist,
            album: sanitized.cleanTitle,
            thumbnailUrl: thumb,
          });
        }
      }

      // Legacy playlistVideoRenderer or playlistVideoListRenderer
      const renderer = obj.playlistVideoRenderer || obj.playlistVideoListRenderer;
      if (renderer) {
        const videoId = renderer.videoId;
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);

          const rawTitle =
            renderer.title?.runs?.map((r: any) => r.text).join("") ||
            renderer.title?.simpleText ||
            "Untitled";
          const channel = renderer.shortBylineText?.runs?.map((r: any) => r.text).join("") || "";
          const durSec = renderer.lengthSeconds ? parseInt(renderer.lengthSeconds, 10) : undefined;
          const thumb =
            renderer.thumbnail?.thumbnails?.[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

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
