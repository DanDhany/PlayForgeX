import fs from "node:fs";
import path from "node:path";
import { PlaylistDraft, TransferTrackItem, PlaylistSummary, TrackMetadata } from "../shared/types";
import { YouTubeMusicClient } from "../core/ytmusic";
import { AppleMusicClient } from "../core/applemusic";
import { cleanTitle } from "../core/sanitizer";
import { compareLyrics } from "../core/lyrics";
import { humanDelay, circuitBreaker } from "../core/stealth";

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
const DRAFTS_DIR = path.resolve(DATA_DIR, "drafts");

if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

function getDraftPath(sourcePlatform: string, playlistId: string): string {
  // Sanitize playlistId for filename
  const safeId = playlistId.replace(/[^a-zA-Z0-9_\-]/g, "_");
  return path.join(DRAFTS_DIR, `${sourcePlatform}_${safeId}.json`);
}

export function loadDraft(sourcePlatform: string, playlistId: string): PlaylistDraft | null {
  const file = getDraftPath(sourcePlatform, playlistId);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (e) {
      console.error(`Error loading draft from ${file}:`, e);
    }
  }
  return null;
}

export function saveDraft(draft: PlaylistDraft): void {
  const file = getDraftPath(draft.sourcePlatform, draft.playlistId);
  draft.lastUpdated = Date.now();
  try {
    fs.writeFileSync(file, JSON.stringify(draft, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error saving draft to ${file}:`, e);
  }
}

export function updateDraftItem(
  sourcePlatform: string,
  playlistId: string,
  updatedItem: TransferTrackItem
): boolean {
  const draft = loadDraft(sourcePlatform, playlistId);
  if (!draft) return false;

  const idx = draft.items.findIndex(
    (item) =>
      (item.source.videoId && item.source.videoId === updatedItem.source.videoId) ||
      item.source.title === updatedItem.source.title
  );

  if (idx !== -1) {
    draft.items[idx] = updatedItem;
  } else {
    draft.items.push(updatedItem);
  }

  saveDraft(draft);
  return true;
}

// Active background jobs tracker
const activeJobs = new Map<string, { abortController: AbortController }>();

export function isJobRunning(sourcePlatform: string, playlistId: string): boolean {
  const key = `${sourcePlatform}_${playlistId}`;
  return activeJobs.has(key);
}

export async function startBackgroundMatching(
  sourcePlatform: "youtube" | "apple",
  targetPlatform: "apple" | "youtube",
  playlist: PlaylistSummary,
  ytClient: YouTubeMusicClient | null,
  appleClient: AppleMusicClient | null,
  force: boolean = false
): Promise<PlaylistDraft> {
  const key = `${sourcePlatform}_${playlist.id}`;

  // If force is requested, abort any currently running job and clear items
  if (force && activeJobs.has(key)) {
    activeJobs.get(key)!.abortController.abort();
    activeJobs.delete(key);
  }

  // If a job is already actively matching this playlist in background, return the latest draft
  if (!force && activeJobs.has(key)) {
    const existing = loadDraft(sourcePlatform, playlist.id);
    if (existing) return existing;
  }

  // 1. Load or initialize draft
  let draft = loadDraft(sourcePlatform, playlist.id);
  if (!draft || force) {
    draft = {
      playlistId: playlist.id,
      playlistTitle: playlist.title,
      sourcePlatform,
      targetPlatform,
      items: [],
      status: "matching",
      totalTracks: playlist.trackCount || 0,
      matchedCount: 0,
      lastUpdated: Date.now(),
    };
    saveDraft(draft);
  } else {
    // If target platform changed, re-run matching
    if (draft.targetPlatform !== targetPlatform) {
      draft.targetPlatform = targetPlatform;
      draft.items = [];
      draft.status = "matching";
      draft.matchedCount = 0;
      saveDraft(draft);
    }
  }

  // If already completed and not force, return immediately
  if (!force && draft.status === "ready" && draft.items.length >= draft.totalTracks && draft.totalTracks > 0) {
    return draft;
  }

  // 2. Spawn background worker without blocking
  const abortController = new AbortController();
  activeJobs.set(key, { abortController });

  (async () => {
    try {
      console.log(`[Worker] Started background matching for ${playlist.title} (${sourcePlatform} ➔ ${targetPlatform})`);

      // A. Fetch tracks from source playlist if needed
      let sourceTracks: TrackMetadata[] = [];
      if (sourcePlatform === "youtube") {
        if (!ytClient || !ytClient.hasValidAuth()) {
          throw new Error("YouTube Music client not authenticated");
        }
        sourceTracks = await ytClient.fetchPlaylistTracks(playlist.id);
      } else {
        if (!appleClient) {
          throw new Error("Apple Music client not authenticated");
        }
        sourceTracks = await appleClient.getPlaylistTracks(playlist.id);
      }

      draft!.totalTracks = sourceTracks.length;
      draft!.status = "matching";
      saveDraft(draft!);

      // B. Determine storefront if targeting Apple Music
      let sf = "us";
      if (targetPlatform === "apple" && appleClient) {
        sf = await appleClient.getUserStorefront();
      }

      // C. Match each track incrementally
      for (let i = 0; i < sourceTracks.length; i++) {
        if (abortController.signal.aborted) {
          console.log(`[Worker] Matching aborted for ${playlist.title}`);
          break;
        }

        // Stealth Guard: Wait if service triggered a rate-limit cooldown
        await circuitBreaker.waitIfCoolingDown(targetPlatform);

        const track = sourceTracks[i];
        const existingIdx = draft!.items.findIndex(
          (it) =>
            (it.source.videoId && it.source.videoId === track.videoId) ||
            it.source.title === track.title
        );

        // If already matched, skip search
        if (existingIdx !== -1 && draft!.items[existingIdx].match) {
          continue;
        }

        const sanitized = cleanTitle(track.title);
        try {
          let candidate: any;
          let match: any;

          if (targetPlatform === "apple") {
            const resMatch = await appleClient!.searchWithOriginalPriority(track, sf);
            candidate = resMatch.candidate;
            match = resMatch.match;
          } else {
            const resMatch = await ytClient!.searchWithOriginalPriority(track);
            candidate = resMatch.candidate;
            match = resMatch.match;
          }

          // Lyrics cross-verification when both clients are available
          if (candidate && ytClient && appleClient) {
            try {
              const ytId = sourcePlatform === "youtube" ? track.videoId : candidate.id;
              const appleId = sourcePlatform === "apple" ? track.videoId : candidate.id;

              if (ytId && appleId) {
                const [ytLyr, appleLyr] = await Promise.all([
                  ytClient.fetchTrackLyrics(ytId).catch(() => null),
                  appleClient.fetchTrackLyrics(appleId, sf).catch(() => null),
                ]);

                if (ytLyr && appleLyr) {
                  const lyrSim = compareLyrics(ytLyr, appleLyr);
                  if (lyrSim >= 0.50) {
                    match.lyricsVerified = true;
                    match.status = "EXACT_MATCH";
                    match.totalScore = Math.max(match.totalScore, 0.95);
                    match.reason = "Judul, artis & lirik terverifikasi identik";
                  } else if (lyrSim < 0.15 && ytLyr.length > 50 && appleLyr.length > 50) {
                    // Both have substantial lyrics, but they do NOT match -> completely different song!
                    match.status = "NOT_FOUND";
                    match.totalScore = 0.20;
                    match.reason = "Lirik berbeda (bukan lagu yang sama)";
                  }
                }
              }
            } catch {
              // Ignore network lyric check errors and keep metadata match
            }
          }

          // Strict inclusion: exclude if not EXACT_MATCH or if artist mismatch
          const shouldExclude = match.status !== "EXACT_MATCH" || match.artistScore < 0.45;

          const matchedItem: TransferTrackItem = {
            source: track,
            sanitizedTitle: sanitized,
            match,
            selectedCandidate: candidate,
            excluded: shouldExclude,
          };

          if (existingIdx !== -1) {
            draft!.items[existingIdx] = matchedItem;
          } else {
            draft!.items.push(matchedItem);
          }
        } catch (err) {
          console.error(`[Worker] Failed matching track "${track.title}":`, err);
          const fallbackItem: TransferTrackItem = {
            source: track,
            sanitizedTitle: sanitized,
            match: {
              status: "NOT_FOUND",
              totalScore: 0,
              titleScore: 0,
              artistScore: 0,
              albumScore: 0,
              reason: "Search error",
            },
            excluded: true,
          };
          if (existingIdx !== -1) {
            draft!.items[existingIdx] = fallbackItem;
          } else {
            draft!.items.push(fallbackItem);
          }
        }

        // Incrementally save to disk after every single song!
        draft!.matchedCount = draft!.items.length;
        saveDraft(draft!);

        // Stealth pacing with randomized jitter (anti-machine cadence)
        await humanDelay(450, 950);
      }

      draft!.status = "ready";
      draft!.matchedCount = draft!.items.length;
      saveDraft(draft!);
      console.log(`[Worker] Finished matching ${playlist.title} (${draft!.items.length}/${draft!.totalTracks} tracks saved to draft)`);
    } catch (err: any) {
      console.error(`[Worker] Error in background matching for ${playlist.title}:`, err);
      if (draft) {
        draft.status = "idle";
        saveDraft(draft);
      }
    } finally {
      activeJobs.delete(key);
    }
  })();

  return draft;
}
