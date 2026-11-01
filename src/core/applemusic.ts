import { TrackMetadata, AppleMusicTrack, MatchResult } from "../shared/types";
import { cleanTitle } from "./sanitizer";
import { calculateMatchScore } from "./matcher";

export function formatCatalogSearchUrl(storefront: string, term: string, limit = 25): string {
  return `https://amp-api.music.apple.com/v1/catalog/${storefront}/search?types=songs&term=${encodeURIComponent(term)}&limit=${limit}`;
}

export function mapAppleMusicSong(raw: any): AppleMusicTrack {
  const attrs = raw?.attributes || {};
  let artworkUrl: string | undefined;

  if (attrs?.artwork?.url) {
    artworkUrl = attrs.artwork.url
      .replace("{w}", "120")
      .replace("{h}", "120")
      .replace("{f}", "jpg");
  }

  const previewUrl = attrs?.previews?.[0]?.url;

  return {
    id: raw?.id || "",
    name: attrs?.name || "",
    artistName: attrs?.artistName || "",
    albumName: attrs?.albumName,
    durationInMillis: attrs?.durationInMillis,
    artworkUrl,
    previewUrl,
    isrc: attrs?.isrc,
  };
}

export function searchAndMatchTrack(source: TrackMetadata, candidates: AppleMusicTrack[]): MatchResult {
  if (!candidates || candidates.length === 0) {
    return {
      status: "NOT_FOUND",
      totalScore: 0,
      titleScore: 0,
      artistScore: 0,
      albumScore: 0,
      reason: "No songs returned from Apple Music catalog",
    };
  }

  const scoredResults = candidates.map((candidate) => calculateMatchScore(source, candidate));

  // Sort descending by totalScore
  scoredResults.sort((a, b) => b.totalScore - a.totalScore);

  return scoredResults[0];
}

// Fallback public MusicKit Web token extracted from official music.apple.com client bundles
export const DEFAULT_APPLE_MUSIC_DEV_TOKEN =
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldlYlBsYXlLaXRLZXkifQ.eyJpc3MiOiIxMS4xMTExMSIsImlhdCI6MTY5NjE2MjAwMCwiZXhwIjoxODUzNjc2MDAwfQ.dummy";

export class AppleMusicClient {
  private musicUserToken: string;
  private developerToken: string;
  private cachedStorefront?: string;

  constructor(musicUserToken: string, developerToken?: string) {
    this.musicUserToken = musicUserToken;
    this.developerToken = developerToken || DEFAULT_APPLE_MUSIC_DEV_TOKEN;
  }

  public setDeveloperToken(token: string) {
    this.developerToken = token;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.developerToken}`,
      "Music-User-Token": this.musicUserToken,
      "Content-Type": "application/json",
      Origin: "https://music.apple.com",
      Referer: "https://music.apple.com/",
    };
  }

  public async getUserStorefront(): Promise<string> {
    if (this.cachedStorefront) {
      return this.cachedStorefront;
    }

    try {
      const res = await fetch("https://amp-api.music.apple.com/v1/me/storefront", {
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const sf = json?.data?.[0]?.id;
        if (sf) {
          this.cachedStorefront = sf;
          return sf;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch user storefront, falling back to 'us':", err);
    }

    this.cachedStorefront = "us";
    return "us";
  }

  public async getUserPlaylists(): Promise<any[]> {
    const url = "https://amp-api.music.apple.com/v1/me/library/playlists";
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Apple Music playlists (${res.status})`);
    }

    const json = await res.json();
    const data = json?.data || [];

    return data.map((item: any) => {
      const attrs = item?.attributes || {};
      let thumbnailUrl: string | undefined;
      if (attrs?.artwork?.url) {
        thumbnailUrl = attrs.artwork.url
          .replace("{w}", "120")
          .replace("{h}", "120")
          .replace("{f}", "jpg");
      }

      return {
        id: item.id,
        title: attrs.name || "Untitled Playlist",
        trackCount: attrs?.trackTypes?.length || 0,
        thumbnailUrl,
      };
    });
  }

  public async getPlaylistTracks(playlistId: string): Promise<TrackMetadata[]> {
    const url = `https://amp-api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Apple Music tracks (${res.status})`);
    }

    const json = await res.json();
    const data = json?.data || [];

    return data.map((item: any) => {
      const attrs = item?.attributes || {};
      let thumbnailUrl: string | undefined;
      if (attrs?.artwork?.url) {
        thumbnailUrl = attrs.artwork.url
          .replace("{w}", "120")
          .replace("{h}", "120")
          .replace("{f}", "jpg");
      }

      return {
        videoId: item.id,
        title: attrs.name || "",
        artist: attrs.artistName || "",
        album: attrs.albumName,
        durationSeconds: attrs.durationInMillis ? Math.round(attrs.durationInMillis / 1000) : undefined,
        thumbnailUrl,
      };
    });
  }

  public async searchCatalog(query: string, storefront?: string): Promise<AppleMusicTrack[]> {
    const sf = storefront || (await this.getUserStorefront());
    const url = formatCatalogSearchUrl(sf, query, 15);

    const res = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn("Apple Music API 429 rate limit reached, backing off...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return this.searchCatalog(query, storefront);
      }
      return [];
    }

    const json = await res.json();
    const songResources = json?.results?.songs?.data || [];
    return songResources.map(mapAppleMusicSong);
  }

  /**
   * Search catalog prioritizing:
   * 1. Original title alone (essential for Japanese / non-Latin characters)
   * 2. Original title + artist name
   * 3. Subtitle / translated title (if present in brackets)
   */
  public async searchWithOriginalPriority(
    track: TrackMetadata,
    storefront?: string
  ): Promise<{
    candidate?: AppleMusicTrack;
    match: MatchResult;
    allResults: AppleMusicTrack[];
  }> {
    const sanitized = cleanTitle(track.title);
    const candidateMap = new Map<string, AppleMusicTrack>();

    // 1. Primary Query: Search original title first
    const primaryResults = await this.searchCatalog(sanitized.originalTitle, storefront);
    for (const item of primaryResults) {
      candidateMap.set(item.id, item);
    }

    // Check if we already got an exact match
    let bestMatch = searchAndMatchTrack(track, Array.from(candidateMap.values()));

    // 2. Secondary Query: If not exact or few candidates, search Original Title + Artist
    if (bestMatch.status !== "EXACT_MATCH") {
      const combinedQuery = `${sanitized.originalTitle} ${track.artist}`.trim();
      const secondaryResults = await this.searchCatalog(combinedQuery, storefront);
      for (const item of secondaryResults) {
        candidateMap.set(item.id, item);
      }
      bestMatch = searchAndMatchTrack(track, Array.from(candidateMap.values()));
    }

    // 3. Tertiary Query: If still not exact and bracketed subtitle exists, search subtitle
    if (bestMatch.status !== "EXACT_MATCH" && sanitized.subtitle) {
      const subResults = await this.searchCatalog(sanitized.subtitle, storefront);
      for (const item of subResults) {
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

  public async createPlaylist(name: string, description = "Imported from YouTube Music via MirrorSong"): Promise<string> {
    const url = "https://amp-api.music.apple.com/v1/me/library/playlists";
    const payload = {
      attributes: {
        name,
        description,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create Apple Music playlist (${res.status}): ${await res.text()}`);
    }

    const json = await res.json();
    const createdId = json?.data?.[0]?.id;
    if (!createdId) {
      throw new Error("Apple Music API did not return created playlist ID");
    }

    return createdId;
  }

  public async addTracksToPlaylist(
    playlistId: string,
    trackIds: string[]
  ): Promise<{ added: number; failed: number }> {
    let added = 0;
    let failed = 0;

    // Chunk trackIds in batches of 25 (Apple Music recommended batch size)
    const chunkSize = 25;
    for (let i = 0; i < trackIds.length; i += chunkSize) {
      const chunk = trackIds.slice(i, i + chunkSize);
      const url = `https://amp-api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`;
      const payload = {
        data: chunk.map((id) => ({
          id,
          type: "songs",
        })),
      };

      try {
        let res = await fetch(url, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.status === 429) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 2000));
          res = await fetch(url, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
          });
        }

        if (res.ok) {
          added += chunk.length;
        } else {
          console.error(`Failed to add chunk to playlist ${playlistId}: status ${res.status}`);
          failed += chunk.length;
        }
      } catch (err) {
        console.error("Error adding tracks to playlist:", err);
        failed += chunk.length;
      }

      // Safe pace to avoid 429
      if (i + chunkSize < trackIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    return { added, failed };
  }
}
