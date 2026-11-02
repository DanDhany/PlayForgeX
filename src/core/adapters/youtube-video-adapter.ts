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

export interface ParsedYouTubeInput {
  playlistId: string;
  videoId?: string;
  videoIds?: string[];
  isSingleVideo?: boolean;
}

export function extractVideoIdsFromText(input: string): string[] {
  if (!input) return [];
  const matches = Array.from(
    input.matchAll(/(?:v=|\/v\/|youtu\.be\/|\/shorts\/|\/embed\/|^|\s)([a-zA-Z0-9_-]{11})(?:\s|&|\?|$)/g)
  );
  const ids = new Set<string>();
  for (const m of matches) {
    const candidate = m[1];
    if (
      candidate &&
      candidate.length === 11 &&
      !candidate.startsWith("PL") &&
      !candidate.startsWith("RD") &&
      !candidate.startsWith("UU") &&
      !candidate.startsWith("LL")
    ) {
      ids.add(candidate);
    }
  }
  return Array.from(ids);
}

/**
 * Robust extractor for ytInitialData across diverse YouTube HTML variants.
 * Handles missing semicolons, newlines, window["ytInitialData"], and balanced JSON matching.
 */
export function extractYtInitialData(html: string): any {
  if (!html) return null;
  const matchIdx = html.search(/(?:var\s+ytInitialData\s*=|window\["ytInitialData"\]\s*=|ytInitialData\s*=)\s*\{/);
  if (matchIdx !== -1) {
    const startBrace = html.indexOf("{", matchIdx);
    if (startBrace !== -1) {
      const scriptClose = html.indexOf("</script>", startBrace);
      const candidate = scriptClose !== -1 ? html.slice(startBrace, scriptClose).trim().replace(/;$/, "") : "";
      if (candidate) {
        try {
          return JSON.parse(candidate);
        } catch {
          const lastBrace = candidate.lastIndexOf("}");
          if (lastBrace !== -1) {
            try {
              return JSON.parse(candidate.slice(0, lastBrace + 1));
            } catch {}
          }
        }
      }
    }
  }
  return null;
}

/**
 * Universal YouTube input parser extracting playlist ID, single video ID, or collection of video IDs.
 */
export function parseYouTubeInput(input: string): ParsedYouTubeInput {
  const trimmed = input.trim();
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const videoIds = extractVideoIdsFromText(trimmed);
  const watchMatch = trimmed.match(/(?:watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = watchMatch ? watchMatch[1] : (videoIds.length === 1 ? videoIds[0] : undefined);

  let playlistId = "";
  let isSingleVideo = false;

  if (listMatch) {
    playlistId = listMatch[1];
    isSingleVideo = false;
  } else if (
    trimmed.startsWith("PL") ||
    trimmed.startsWith("VLPL") ||
    trimmed.startsWith("UU") ||
    trimmed.startsWith("LL") ||
    trimmed.startsWith("RD") ||
    trimmed.startsWith("OLAK5uy_")
  ) {
    playlistId = trimmed.replace(/^VL/, "");
    isSingleVideo = false;
  } else if (videoId && videoIds.length <= 1) {
    playlistId = videoId;
    isSingleVideo = true;
  } else {
    playlistId = trimmed;
    isSingleVideo = false;
  }

  return { playlistId, videoId, videoIds, isSingleVideo };
}

export class YouTubeVideoAdapter implements PlatformAdapter {
  readonly provider = youtubeVideoProvider;

  /**
   * Parse a YouTube video playlist URL or ID into a normalized playlist ID.
   */
  public normalizePlaylistId(input: string): string {
    return parseYouTubeInput(input).playlistId;
  }

  /**
   * Fetch single YouTube video metadata via public oEmbed endpoint with fallback to watch HTML.
   */
  async fetchSingleVideoTrack(videoId: string, cookie?: string): Promise<TrackMetadata | null> {
    if (!videoId) return null;
    const cleanId = videoId.trim();

    // 1. Try public oEmbed
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        const sanitized = sanitizeVideoTitle(oembed.title, oembed.author_name);
        return {
          id: cleanId,
          videoId: cleanId,
          title: sanitized.cleanTitle,
          artist: sanitized.cleanArtist,
          album: sanitized.cleanTitle,
          thumbnailUrl: oembed.thumbnail_url || `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
        };
      }
    } catch (e: any) {
      console.warn(`[YouTubeVideoAdapter] oEmbed fetch failed for ${cleanId}:`, e.message);
    }

    // 2. Try HTML watch scraping
    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${cleanId}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Cookie: cookie
            ? cookie
            : "SOCS=CAESEwgDEgk2ODE4NDI5MjgacBIOCIC7tbmzBhDw1-XABhoNCAMSAggB; CONSENT=PENDING+999; PREF=hl=en&gl=US",
        },
      });
      if (res.ok) {
        const html = await res.text();
        const data = extractYtInitialData(html);
        if (data) {
          const tracks = this.parseInnertubeResponse(data);
          const found = tracks.find((t) => t.id === cleanId || t.videoId === cleanId);
          if (found) return found;
        }
      }
    } catch {}

    // Fallback: minimal track
    return {
      id: cleanId,
      videoId: cleanId,
      title: "YouTube Video",
      artist: "Unknown Artist",
      thumbnailUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
    };
  }

  /**
   * Fetch tracks from a YouTube video playlist using public page scraping with Innertube fallback.
   */
  async fetchPlaylistTracks(playlistId: string, credentials?: unknown): Promise<TrackMetadata[]> {
    const parsed = parseYouTubeInput(playlistId);
    const cleanId = parsed.playlistId;
    const cookie = typeof credentials === "string" ? credentials : "";

    // If multiple video IDs are detected and not a standard playlist:
    if (
      parsed.videoIds &&
      parsed.videoIds.length > 1 &&
      !parsed.playlistId.startsWith("PL") &&
      !parsed.playlistId.startsWith("RD") &&
      !parsed.playlistId.startsWith("OLAK5uy_")
    ) {
      const tracks = await Promise.all(
        parsed.videoIds.map(async (vid) => this.fetchSingleVideoTrack(vid, cookie))
      );
      return tracks.filter((t): t is TrackMetadata => t !== null);
    }

    // If it's a single video (watch or youtu.be link):
    if (parsed.isSingleVideo && parsed.videoId) {
      const single = await this.fetchSingleVideoTrack(parsed.videoId, cookie);
      return single ? [single] : [];
    }

    // Candidate URLs to fetch HTML from:
    const candidateUrls: string[] = [];

    // If it's a Mix (starts with RD) or user passed a watch URL, try watch URL first
    if (cleanId.startsWith("RD") || (parsed.videoId && cleanId.startsWith("PL"))) {
      if (parsed.videoId) {
        candidateUrls.push(`https://www.youtube.com/watch?v=${parsed.videoId}&list=${cleanId}`);
      } else {
        candidateUrls.push(`https://www.youtube.com/watch?list=${cleanId}`);
      }
    }

    // Standard playlist URL
    if (
      cleanId.startsWith("PL") ||
      cleanId.startsWith("UU") ||
      cleanId.startsWith("LL") ||
      cleanId.startsWith("OLAK5uy_") ||
      cleanId.length >= 10
    ) {
      candidateUrls.push(`https://www.youtube.com/playlist?list=${cleanId}`);
    }

    // Try YouTube Music public link if it's an album / music ID
    if (cleanId.startsWith("OLAK5uy_") || cleanId.startsWith("RDCLAK5uy_")) {
      candidateUrls.push(`https://music.youtube.com/playlist?list=${cleanId}`);
    }

    // 1. Try public HTML scraping with consent cookies for candidates
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            Cookie: cookie
              ? cookie
              : "SOCS=CAESEwgDEgk2ODE4NDI5MjgacBIOCIC7tbmzBhDw1-XABhoNCAMSAggB; CONSENT=PENDING+999; PREF=hl=en&gl=US",
          },
        });

        if (res.ok) {
          const html = await res.text();
          const data = extractYtInitialData(html);
          if (data) {
            const tracks = this.parseInnertubeResponse(data);
            if (tracks.length > 0) return tracks;
          }
        }
      } catch (err: any) {
        console.warn(`[YouTubeVideoAdapter] HTML scrape warning for ${url}:`, err.message);
      }
    }

    // 2. Try Innertube Web Browse endpoint
    const browseId = cleanId.startsWith("VL") ? cleanId : `VL${cleanId}`;

    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/browse?prettyPrint=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
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
    if (cleanId.length === 11 && !cleanId.startsWith("PL")) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`
        );
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          const sanitized = sanitizeVideoTitle(oembed.title, oembed.author_name);
          return [
            {
              id: cleanId,
              videoId: cleanId,
              title: sanitized.cleanTitle,
              artist: sanitized.cleanArtist,
              album: sanitized.cleanTitle,
              thumbnailUrl: oembed.thumbnail_url || `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
            },
          ];
        }
      } catch {}

      return [
        {
          id: cleanId,
          videoId: cleanId,
          title: "YouTube Video",
          artist: "Unknown Artist",
          thumbnailUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
        },
      ];
    }

    return [];
  }

  /**
   * Recursively extract video items from Innertube JSON (supports lockupViewModel, playlistVideoRenderer,
   * playlistPanelVideoRenderer for watch/mix queues, compactVideoRenderer, and musicResponsiveListItemRenderer).
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

      // playlistPanelVideoRenderer (Critical for watch mode queues and YouTube Mixes)
      const panel = obj.playlistPanelVideoRenderer;
      if (panel) {
        const videoId = panel.videoId;
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);

          const rawTitle =
            panel.title?.simpleText ||
            panel.title?.runs?.map((r: any) => r.text).join("") ||
            "Untitled";
          const channel =
            panel.longBylineText?.runs?.map((r: any) => r.text).join("") ||
            panel.shortBylineText?.runs?.map((r: any) => r.text).join("") ||
            "";
          const thumb =
            panel.thumbnail?.thumbnails?.[0]?.url ||
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

      // compactVideoRenderer or videoRenderer (Mobile / sidebar / search view)
      const compact = obj.compactVideoRenderer || obj.videoRenderer || obj.gridVideoRenderer;
      if (compact) {
        const videoId = compact.videoId;
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);

          const rawTitle =
            compact.title?.runs?.map((r: any) => r.text).join("") ||
            compact.title?.simpleText ||
            "Untitled";
          const channel =
            compact.shortBylineText?.runs?.map((r: any) => r.text).join("") ||
            compact.ownerText?.runs?.map((r: any) => r.text).join("") ||
            "";
          const thumb =
            compact.thumbnail?.thumbnails?.[0]?.url ||
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

      // musicResponsiveListItemRenderer (for YouTube Music playlists or albums)
      const musicItem = obj.musicResponsiveListItemRenderer;
      if (musicItem) {
        const flexColumns = musicItem.flexColumns || [];
        const titleRun = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0];
        const videoId =
          musicItem.playlistItemData?.videoId ||
          titleRun?.navigationEndpoint?.watchEndpoint?.videoId;

        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);
          const rawTitle =
            flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
              ?.map((r: any) => r.text)
              .join("") || "Untitled";
          const artist =
            flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
              ?.map((r: any) => r.text)
              .join("") || "Unknown Artist";
          const thumb =
            musicItem.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const sanitized = sanitizeVideoTitle(rawTitle, artist);
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

      for (const key of Object.keys(obj)) {
        traverse(obj[key]);
      }
    };

    traverse(json);
    return tracks;
  }

  async fetchPlaylists(credentials?: unknown): Promise<PlaylistSummary[]> {
    if (typeof credentials === "string" && credentials.trim().length > 0) {
      const parsed = parseYouTubeInput(credentials);
      if (parsed.isSingleVideo && parsed.videoId) {
        return [
          {
            id: parsed.videoId,
            title: `YouTube Video (${parsed.videoId})`,
            trackCount: 1,
          },
        ];
      }
      if (parsed.videoIds && parsed.videoIds.length > 1) {
        return [
          {
            id: parsed.videoId || `yt-collection-${parsed.videoIds.length}`,
            title: `YouTube Video Collection (${parsed.videoIds.length} videos)`,
            trackCount: parsed.videoIds.length,
          },
        ];
      }
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
