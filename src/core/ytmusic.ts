import crypto from "node:crypto";
import { TrackMetadata, PlaylistSummary } from "../shared/types";

export function generateSapisidHash(sapisid: string, origin = "https://music.youtube.com"): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${timestamp} ${sapisid} ${origin}`;
  const sha1 = crypto.createHash("sha1").update(data).digest("hex");
  return `${timestamp}_${sha1}`;
}

export function parseDuration(durationStr?: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map((p) => parseInt(p.trim(), 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function parseYouTubeMusicPlaylists(response: any): PlaylistSummary[] {
  const playlists: PlaylistSummary[] = [];
  if (!response) return playlists;

  try {
    const tabs = response?.contents?.singleColumnBrowseResultsRenderer?.tabs || [];
    for (const tab of tabs) {
      const sections = tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
      for (const section of sections) {
        // Items can be in gridRenderer or musicCarouselShelfRenderer
        const items =
          section?.gridRenderer?.items ||
          section?.musicCarouselShelfRenderer?.contents ||
          [];

        for (const item of items) {
          const renderer =
            item?.musicTwoRowItemRenderer ||
            item?.musicResponsiveListItemRenderer;

          if (!renderer) continue;

          const title =
            renderer?.title?.runs?.map((r: any) => r.text).join("") ||
            renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((r: any) => r.text).join("") ||
            "";

          const browseEndpoint =
            renderer?.navigationEndpoint?.browseEndpoint ||
            renderer?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint;

          const browseId = browseEndpoint?.browseId;
          if (!browseId || (!browseId.startsWith("VL") && !browseId.startsWith("PL") && !browseId.startsWith("FEmusic_liked_videos"))) {
            continue;
          }

          const subtitleRuns =
            renderer?.subtitle?.runs ||
            renderer?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ||
            [];

          const subtitleText = subtitleRuns.map((r: any) => r.text).join("");
          const trackCountMatch = subtitleText.match(/(\d+)\s+(?:songs?|tracks?|lagu)/i);
          const trackCount = trackCountMatch ? parseInt(trackCountMatch[1], 10) : 0;

          const thumbnails =
            renderer?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
            renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
            [];
          const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url;

          playlists.push({
            id: browseId,
            title,
            trackCount,
            thumbnailUrl,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error parsing YTM playlists:", err);
  }

  return playlists;
}

export function parseYouTubeMusicTracks(response: any): TrackMetadata[] {
  const tracks: TrackMetadata[] = [];
  if (!response) return tracks;

  try {
    // Traverse standard YouTubei playlist shelf response
    const tabs = response?.contents?.singleColumnBrowseResultsRenderer?.tabs || [];
    const sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    let rawItems: any[] = [];
    for (const section of sections) {
      if (section?.musicPlaylistShelfRenderer?.contents) {
        rawItems = section.musicPlaylistShelfRenderer.contents;
        break;
      }
    }

    if (rawItems.length === 0 && response?.contents?.twoColumnBrowseResultsRenderer) {
      // Alternate desktop layout
      const secondary = response.contents.twoColumnBrowseResultsRenderer.secondaryContents;
      rawItems = secondary?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer?.contents || [];
    }

    for (const item of rawItems) {
      const renderer = item?.musicResponsiveListItemRenderer;
      if (!renderer) continue;

      const videoId =
        renderer?.playlistItemData?.videoId ||
        renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;

      const flexColumns = renderer?.flexColumns || [];
      const titleRuns = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      const title = titleRuns.map((r: any) => r.text).join("").trim();

      const subtitleRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      const subtitleParts = subtitleRuns.map((r: any) => r.text);

      let artist = "";
      let album = "";
      let durationStr = "";

      // Format is usually [Artist, " • ", Album, " • ", Duration]
      const bulletSeparated = subtitleParts.join("").split(" • ");
      if (bulletSeparated.length >= 1) {
        artist = bulletSeparated[0].trim();
      }
      if (bulletSeparated.length >= 2) {
        // If the second part has digits and colon, it's duration; otherwise album
        if (/^\d+:\d+$/.test(bulletSeparated[1].trim())) {
          durationStr = bulletSeparated[1].trim();
        } else {
          album = bulletSeparated[1].trim();
        }
      }
      if (bulletSeparated.length >= 3) {
        durationStr = bulletSeparated[bulletSeparated.length - 1].trim();
      }

      const thumbnails = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url;

      if (title) {
        tracks.push({
          videoId,
          title,
          artist,
          album: album || undefined,
          durationSeconds: parseDuration(durationStr),
          thumbnailUrl,
        });
      }
    }
  } catch (err) {
    console.error("Error parsing YTM tracks:", err);
  }

  return tracks;
}

export class YouTubeMusicClient {
  private cookieString: string;
  private sapisid: string;

  constructor(cookieString: string) {
    this.cookieString = cookieString;
    const match =
      cookieString.match(/SAPISID=([^;]+)/) ||
      cookieString.match(/__Secure-3PAPISID=([^;]+)/);
    this.sapisid = match ? match[1].trim() : "";
  }

  public hasValidAuth(): boolean {
    return !!this.sapisid;
  }

  private getAuthHeaders(): Record<string, string> {
    const origin = "https://music.youtube.com";
    return {
      "Content-Type": "application/json",
      Cookie: this.cookieString,
      Origin: origin,
      Referer: `${origin}/`,
      Authorization: `SAPISIDHASH ${generateSapisidHash(this.sapisid, origin)}`,
      "X-Origin": origin,
      "X-YouTube-Client-Name": "67", // WEB_REMIX
      "X-YouTube-Client-Version": "1.20241028.01.00",
    };
  }

  public async fetchPlaylists(): Promise<PlaylistSummary[]> {
    if (!this.hasValidAuth()) {
      throw new Error("Missing YouTube Music SAPISID session cookie");
    }

    const payload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20241028.01.00",
          hl: "en",
          gl: "US",
        },
      },
      browseId: "FEmusic_liked_playlists",
    };

    const res = await fetch("https://music.youtube.com/youtubei/v1/browse", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`YouTube Music browse failed with status ${res.status}`);
    }

    const json = await res.json();
    return parseYouTubeMusicPlaylists(json);
  }

  public async fetchPlaylistTracks(browseId: string): Promise<TrackMetadata[]> {
    if (!this.hasValidAuth()) {
      throw new Error("Missing YouTube Music SAPISID session cookie");
    }

    // Ensure browseId has VL prefix for playlist endpoint if needed
    const normalizedBrowseId = browseId.startsWith("PL") ? `VL${browseId}` : browseId;

    const payload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20241028.01.00",
          hl: "en",
          gl: "US",
        },
      },
      browseId: normalizedBrowseId,
    };

    const res = await fetch("https://music.youtube.com/youtubei/v1/browse", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch tracks for playlist ${browseId}: status ${res.status}`);
    }

    const json = await res.json();
    return parseYouTubeMusicTracks(json);
  }
}
