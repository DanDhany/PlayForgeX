import crypto from "node:crypto";
import { TrackMetadata, PlaylistSummary, AppleMusicTrack, MatchResult } from "../shared/types";
import { cleanTitle } from "./sanitizer";
import { searchAndMatchTrack } from "./applemusic";
import { getArtistAliases } from "./artist-matcher";
import { fetchYouTubeLyrics } from "./lyrics";
import { getBrowserStealthHeaders, humanDelay, circuitBreaker } from "./stealth";

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

function findItemRenderers(obj: any, results: any[] = []): any[] {
  if (!obj || typeof obj !== "object") return results;

  if (obj.musicTwoRowItemRenderer || obj.musicResponsiveListItemRenderer) {
    results.push(obj);
    return results;
  }

  if (Array.isArray(obj)) {
    for (const element of obj) {
      findItemRenderers(element, results);
    }
  } else {
    for (const key of Object.keys(obj)) {
      if (key === "musicPlaylistShelfRenderer") continue;
      findItemRenderers(obj[key], results);
    }
  }

  return results;
}

export function parseYouTubeMusicPlaylists(response: any): PlaylistSummary[] {
  const playlists: PlaylistSummary[] = [];
  if (!response) return playlists;

  try {
    const renderers = findItemRenderers(response);
    const seenIds = new Set<string>();

    for (const item of renderers) {
      const renderer = item?.musicTwoRowItemRenderer || item?.musicResponsiveListItemRenderer;
      if (!renderer) continue;

      const browseEndpoint =
        renderer?.navigationEndpoint?.browseEndpoint ||
        renderer?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint;
      const browseId = browseEndpoint?.browseId;
      if (!browseId) continue;

      const isPlaylist =
        browseId.startsWith("VL") ||
        browseId.startsWith("PL") ||
        browseId.startsWith("RDAMPL") ||
        browseId === "FEmusic_liked_videos" ||
        browseId === "LM";

      if (!isPlaylist || seenIds.has(browseId)) continue;
      seenIds.add(browseId);

      const title =
        renderer?.title?.runs?.map((r: any) => r.text).join("") ||
        renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((r: any) => r.text).join("") ||
        "";

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
        title: title || "Untitled Playlist",
        trackCount,
        thumbnailUrl,
      });
    }
  } catch (err) {
    console.error("Error parsing YTM playlists:", err);
  }

  return playlists;
}

export function parseRawYTMTrackItems(rawItems: any[]): TrackMetadata[] {
  const tracks: TrackMetadata[] = [];
  if (!Array.isArray(rawItems)) return tracks;

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

  return tracks;
}

export function extractContinuationToken(response: any): string | null {
  if (!response || typeof response !== "object") return null;

  // 1. Check continuationContents (from continuation responses)
  const contShelf =
    response?.continuationContents?.musicPlaylistShelfContinuation ||
    response?.continuationContents?.musicShelfContinuation;
  if (Array.isArray(contShelf?.continuations) && contShelf.continuations.length > 0) {
    const c = contShelf.continuations[0];
    const tok =
      c?.nextContinuationData?.continuation ||
      c?.continuationEndpoint?.continuationCommand?.token ||
      c?.reloadContinuationData?.continuation;
    if (tok) return tok;
  }

  // 2. Check initial browse responses (singleColumnBrowseResultsRenderer or twoColumnBrowseResultsRenderer)
  const tabs = response?.contents?.singleColumnBrowseResultsRenderer?.tabs || [];
  const sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
  for (const s of sections) {
    const shelf = s?.musicPlaylistShelfRenderer || s?.musicShelfRenderer;
    if (Array.isArray(shelf?.continuations) && shelf.continuations.length > 0) {
      const c = shelf.continuations[0];
      const tok =
        c?.nextContinuationData?.continuation ||
        c?.continuationEndpoint?.continuationCommand?.token ||
        c?.reloadContinuationData?.continuation;
      if (tok) return tok;
    }
  }

  const secondary = response?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents;
  const secondarySections = secondary?.sectionListRenderer?.contents || [];
  for (const s of secondarySections) {
    const shelf = s?.musicPlaylistShelfRenderer || s?.musicShelfRenderer;
    if (Array.isArray(shelf?.continuations) && shelf.continuations.length > 0) {
      const c = shelf.continuations[0];
      const tok =
        c?.nextContinuationData?.continuation ||
        c?.continuationEndpoint?.continuationCommand?.token ||
        c?.reloadContinuationData?.continuation;
      if (tok) return tok;
    }
  }

  // 3. Fallback shallow search
  function findToken(target: any, depth = 0): string | null {
    if (!target || typeof target !== "object" || depth > 6) return null;
    if (target.nextContinuationData?.continuation) {
      return target.nextContinuationData.continuation;
    }
    if (target.continuationEndpoint?.continuationCommand?.token) {
      return target.continuationEndpoint.continuationCommand.token;
    }
    if (typeof target.continuation === "string" && target.continuation.length > 15) {
      return target.continuation;
    }
    for (const key of Object.keys(target)) {
      if (key === "trackingParams" || key === "clickTrackingParams") continue;
      const res = findToken(target[key], depth + 1);
      if (res) return res;
    }
    return null;
  }

  return findToken(response);
}

export function parseYouTubeMusicTracks(response: any): TrackMetadata[] {
  if (!response) return [];

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

    return parseRawYTMTrackItems(rawItems);
  } catch (err) {
    console.error("Error parsing YTM tracks:", err);
    return [];
  }
}

export class YouTubeMusicClient {
  private cookieString: string;
  private sapisid: string;

  constructor(cookieString: string) {
    // Deduplicate cookie pairs
    const map = new Map<string, string>();
    for (const part of cookieString.split(";")) {
      const idx = part.indexOf("=");
      if (idx !== -1) {
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (k) map.set(k, v);
      }
    }
    this.cookieString = Array.from(map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    this.sapisid = map.get("SAPISID") || map.get("__Secure-3PAPISID") || "";
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
      ...getBrowserStealthHeaders(origin),
    };
  }

  public async fetchPlaylists(): Promise<PlaylistSummary[]> {
    if (!this.hasValidAuth()) {
      throw new Error("Missing YouTube Music SAPISID session cookie");
    }

    const endpoints = ["FEmusic_liked_playlists", "FEmusic_library_playlists", "FEmusic_library_landing"];
    const allPlaylists: PlaylistSummary[] = [];
    const seenIds = new Set<string>();

    for (const browseId of endpoints) {
      try {
        const payload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20241028.01.00",
              hl: "en",
              gl: "US",
            },
          },
          browseId,
        };

        const res = await fetch("https://music.youtube.com/youtubei/v1/browse", {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json();

          // Check if YouTube Music prompts for sign-in (unauthenticated / missing __Secure-1PSID)
          const jsonStr = JSON.stringify(json);
          if (jsonStr.includes("signInEndpoint") && jsonStr.includes("Sign in")) {
            throw new Error(
              "Sesi YouTube Music tidak valid atau belum login penuh (Sign-in required). Cookie __Secure-1PSID diperlukan."
            );
          }

          const list = parseYouTubeMusicPlaylists(json);
          for (const p of list) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              allPlaylists.push(p);
            }
          }
        }
      } catch (err: any) {
        if (err?.message?.includes("Sign-in required")) {
          throw err;
        }
      }
      if (allPlaylists.length > 0) break;
    }

    return allPlaylists;
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
    const tracks: TrackMetadata[] = [];
    tracks.push(...parseYouTubeMusicTracks(json));

    // Pagination via continuation tokens
    let continuationToken = extractContinuationToken(json);
    const seenTokens = new Set<string>();
    let page = 1;
    const maxPages = 50; // Safety guard: up to 5,000 tracks

    while (continuationToken && page < maxPages && !seenTokens.has(continuationToken)) {
      seenTokens.add(continuationToken);
      page++;

      await circuitBreaker.waitIfCoolingDown("youtube");
      await humanDelay(300, 600);

      const contPayload = {
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20241028.01.00",
            hl: "en",
            gl: "US",
          },
        },
        continuation: continuationToken,
      };

      try {
        const contRes = await fetch(
          `https://music.youtube.com/youtubei/v1/browse?continuation=${encodeURIComponent(continuationToken)}`,
          {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(contPayload),
          }
        );

        if (!contRes.ok) {
          if (contRes.status === 429) {
            circuitBreaker.triggerCooldown("youtube", 20000);
          }
          break;
        }

        const contJson = await contRes.json();
        const contShelf =
          contJson?.continuationContents?.musicPlaylistShelfContinuation ||
          contJson?.continuationContents?.musicShelfContinuation;

        const contRawItems = contShelf?.contents || [];
        if (contRawItems.length === 0) break;

        const newTracks = parseRawYTMTrackItems(contRawItems);
        tracks.push(...newTracks);

        continuationToken = extractContinuationToken(contJson);
      } catch (err) {
        console.warn("Error fetching YouTube Music continuation tracks:", err);
        break;
      }
    }

    return tracks;
  }

  public async searchCatalog(query: string): Promise<AppleMusicTrack[]> {
    await circuitBreaker.waitIfCoolingDown("youtube");

    const payload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20241028.01.00",
          hl: "ja",
          gl: "JP",
        },
      },
      query,
    };

    try {
      const res = await fetch("https://music.youtube.com/youtubei/v1/search", {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 429) {
          circuitBreaker.triggerCooldown("youtube", 25000);
        }
        return [];
      }

      const json = await res.json();
      const results: AppleMusicTrack[] = [];
      const seenIds = new Set<string>();

      function findRenderers(obj: any, targetKey: string, out: any[] = []): any[] {
        if (!obj || typeof obj !== "object") return out;
        if (obj[targetKey]) {
          out.push(obj[targetKey]);
        }
        if (Array.isArray(obj)) {
          for (const el of obj) findRenderers(el, targetKey, out);
        } else {
          for (const k of Object.keys(obj)) findRenderers(obj[k], targetKey, out);
        }
        return out;
      }

      const items = findRenderers(json, "musicResponsiveListItemRenderer");

      for (const renderer of items) {
        const flexColumns = renderer.flexColumns || [];
        if (flexColumns.length === 0) continue;

        const titleRuns = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        const title = titleRuns.map((r: any) => r.text).join("").trim();

        const videoId =
          renderer.playlistItemData?.videoId ||
          titleRuns[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
          renderer.navigationEndpoint?.watchEndpoint?.videoId;

        // Skip non-song items (artists, playlists, albums without videoId)
        if (!videoId || seenIds.has(videoId)) continue;
        seenIds.add(videoId);

        const subRuns: any[] = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];

        // 1. Try to find artist from navigationEndpoint with MUSIC_PAGE_TYPE_ARTIST
        let artist = "";
        let album = "";
        let durationSeconds: number | undefined;

        const artistRun = subRuns.find(
          (r: any) =>
            r.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
              ?.browseEndpointContextMusicConfig?.pageType === "MUSIC_PAGE_TYPE_ARTIST" ||
            r.navigationEndpoint?.browseEndpoint?.browseId?.startsWith("UC")
        );
        if (artistRun) {
          artist = artistRun.text.trim();
        }

        const albumRun = subRuns.find(
          (r: any) =>
            r.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
              ?.browseEndpointContextMusicConfig?.pageType === "MUSIC_PAGE_TYPE_ALBUM"
        );
        if (albumRun) {
          album = albumRun.text.trim();
        }

        // 2. Fallback: Parse runs text and split by " • "
        const textRuns = subRuns.map((r: any) => r.text).join("");
        const rawParts = textRuns.split(" • ").map((s: string) => s.trim()).filter(Boolean);

        // Filter out item type badges
        const TYPE_BADGES = new Set(["曲", "動画", "Song", "Video", "Single", "EP", "Album", "エピソード", "Track"]);
        const cleanParts = rawParts.filter((p: string) => !TYPE_BADGES.has(p));

        if (!artist && cleanParts.length > 0) {
          artist = cleanParts[0];
        }
        if (!album && cleanParts.length > 1) {
          if (!/^\d+:\d+$/.test(cleanParts[1]) && !cleanParts[1].includes("回") && !cleanParts[1].includes("view")) {
            album = cleanParts[1];
          }
        }

        // Find duration if present
        for (const part of rawParts) {
          const durMatch = part.match(/^(\d+):(\d+)$/);
          if (durMatch) {
            durationSeconds = parseInt(durMatch[1], 10) * 60 + parseInt(durMatch[2], 10);
            break;
          }
        }

        const thumbnails = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
        const artworkUrl = thumbnails[thumbnails.length - 1]?.url;

        results.push({
          id: videoId,
          name: title,
          artistName: artist,
          albumName: album || undefined,
          durationInMillis: durationSeconds ? durationSeconds * 1000 : undefined,
          artworkUrl,
        });
      }

      return results;
    } catch (err) {
      console.error("YouTube Music searchCatalog error:", err);
      return [];
    }
  }

  public async searchWithOriginalPriority(
    track: TrackMetadata
  ): Promise<{
    candidate?: AppleMusicTrack;
    match: MatchResult;
    allResults: AppleMusicTrack[];
  }> {
    const sanitized = cleanTitle(track.title);
    const candidateMap = new Map<string, AppleMusicTrack>();

    // 1. Primary Query (PRIORITY #1): Always search Title + Artist
    const primaryQuery = `${sanitized.originalTitle} ${track.artist}`.trim();
    const primaryResults = await this.searchCatalog(primaryQuery);
    for (const item of primaryResults) {
      candidateMap.set(item.id, item);
    }

    let bestMatch = searchAndMatchTrack(track, Array.from(candidateMap.values()));

    // 2. Secondary Query: Try known aliases for artist (Kanji <-> Romaji / English)
    if (bestMatch.status !== "EXACT_MATCH") {
      const aliases = getArtistAliases(track.artist);
      for (const alias of aliases.slice(0, 2)) {
        const aliasQuery = `${sanitized.originalTitle} ${alias}`.trim();
        const aliasResults = await this.searchCatalog(aliasQuery);
        for (const item of aliasResults) {
          candidateMap.set(item.id, item);
        }
      }
      bestMatch = searchAndMatchTrack(track, Array.from(candidateMap.values()));
    }

    // 3. Tertiary Query: Subtitle + Artist if available
    if (bestMatch.status !== "EXACT_MATCH" && sanitized.subtitle) {
      const subQuery = `${sanitized.subtitle} ${track.artist}`.trim();
      const subResults = await this.searchCatalog(subQuery);
      for (const item of subResults) {
        candidateMap.set(item.id, item);
      }
      bestMatch = searchAndMatchTrack(track, Array.from(candidateMap.values()));
    }

    // 4. Quaternary Query: Title alone (fallback only if candidates list is still empty)
    if (candidateMap.size === 0) {
      const titleOnlyResults = await this.searchCatalog(sanitized.originalTitle);
      for (const item of titleOnlyResults) {
        candidateMap.set(item.id, item);
      }
      bestMatch = searchAndMatchTrack(track, Array.from(candidateMap.values()));
    }

    const allResults = Array.from(candidateMap.values());
    return {
      candidate: bestMatch.candidate,
      match: bestMatch,
      allResults,
    };
  }

  public async fetchTrackLyrics(videoId: string): Promise<string | null> {
    return fetchYouTubeLyrics(videoId, this.cookieString);
  }

  public async createPlaylist(
    title: string,
    description = "Imported from Apple Music via TuneBridge",
    videoIds: string[] = []
  ): Promise<string> {
    if (!this.hasValidAuth()) {
      throw new Error("Missing YouTube Music authentication");
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
      title,
      description,
      privacyStatus: "PRIVATE",
      videoIds,
    };

    const res = await fetch("https://music.youtube.com/youtubei/v1/playlist/create", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create YouTube Music playlist (${res.status}): ${await res.text()}`);
    }

    const json = await res.json();
    const createdId = json?.playlistId;
    if (!createdId) {
      throw new Error("YouTube Music API did not return created playlist ID");
    }

    return createdId;
  }

  public async addTracksToPlaylist(
    playlistId: string,
    videoIds: string[]
  ): Promise<{ added: number; failed: number }> {
    if (!this.hasValidAuth()) {
      throw new Error("Missing YouTube Music authentication");
    }

    let added = 0;
    let failed = 0;
    const chunkSize = 25;
    const rawPlaylistId = playlistId.startsWith("VL") ? playlistId.slice(2) : playlistId;

    for (let i = 0; i < videoIds.length; i += chunkSize) {
      const chunk = videoIds.slice(i, i + chunkSize);
      const payload = {
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20241028.01.00",
            hl: "en",
            gl: "US",
          },
        },
        playlistId: rawPlaylistId,
        actions: chunk.map((videoId) => ({
          action: "ACTION_ADD_VIDEO",
          addedVideoId: videoId,
        })),
      };

      try {
        const res = await fetch("https://music.youtube.com/youtubei/v1/browse/edit_playlist", {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          added += chunk.length;
        } else {
          failed += chunk.length;
        }
      } catch (err) {
        failed += chunk.length;
      }

      if (i + chunkSize < videoIds.length) {
        if ((i + chunkSize) % 100 === 0) {
          // Breather every 100 tracks to avoid bulk manipulation trigger
          await humanDelay(3500, 5000);
        } else {
          await humanDelay(1200, 2400);
        }
      }
    }

    return { added, failed };
  }
}
