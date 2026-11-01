import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  TrackMetadata,
  SourcePlaylistSelection,
  ActivityLogItem,
} from "../shared/types.js";
import { cleanTitle } from "../core/sanitizer.js";
import { AccountManager } from "./account-manager.js";

export interface AggregatedTrack {
  sourceAccountId: string;
  sourceAccountAlias: string;
  sourcePlaylistId: string;
  sourcePlaylistTitle: string;
  track: TrackMetadata;
  isDuplicate?: boolean;
  duplicateOfTrackId?: string;
  isVariant?: boolean; // Live, Remix, Instrumental
}

export class MergeEngine {
  private activityFile: string;
  private accountManager: AccountManager;

  constructor(dataDir: string, accountManager: AccountManager) {
    this.activityFile = path.join(dataDir, "activity.json");
    this.accountManager = accountManager;
  }

  public async fetchDiscoveredTracks(
    sourceSelections: SourcePlaylistSelection[]
  ): Promise<AggregatedTrack[]> {
    const aggregated: AggregatedTrack[] = [];

    for (const sel of sourceSelections) {
      const acc = this.accountManager.getAccount(sel.accountId);
      if (!acc) continue;

      let tracks: TrackMetadata[] = [];
      if (acc.platform === "youtube") {
        const client = this.accountManager.getYTMClient(sel.accountId);
        if (client && client.hasValidAuth()) {
          tracks = await client.fetchPlaylistTracks(sel.playlistId);
        }
      } else {
        const client = this.accountManager.getAppleClient(sel.accountId);
        if (client) {
          tracks = await client.getPlaylistTracks(sel.playlistId);
        }
      }

      for (const t of tracks) {
        aggregated.push({
          sourceAccountId: sel.accountId,
          sourceAccountAlias: sel.accountAlias,
          sourcePlaylistId: sel.playlistId,
          sourcePlaylistTitle: sel.playlistTitle,
          track: t,
        });
      }
    }

    return aggregated;
  }

  public deduplicateTracks(
    tracks: AggregatedTrack[],
    policy: "remove_exact" | "keep_all" | "review_possible" = "remove_exact"
  ): {
    uniqueTracks: AggregatedTrack[];
    duplicates: AggregatedTrack[];
  } {
    if (policy === "keep_all") {
      return { uniqueTracks: [...tracks], duplicates: [] };
    }

    const uniqueTracks: AggregatedTrack[] = [];
    const duplicates: AggregatedTrack[] = [];
    const seenMap = new Map<string, string>(); // fingerprint -> trackId

    for (const item of tracks) {
      const sanitized = cleanTitle(item.track.title);
      const isVariant = /live|remix|acoustic|instrumental|cover|karaoke|ver\./i.test(
        item.track.title
      );

      // Distinct live/remix variants are NOT exact duplicates!
      const fingerprint = `${sanitized.cleanTitle.toLowerCase()}|${item.track.artist.toLowerCase()}${
        isVariant ? `|variant_${item.track.title.toLowerCase()}` : ""
      }`;

      if (seenMap.has(fingerprint)) {
        item.isDuplicate = true;
        item.duplicateOfTrackId = seenMap.get(fingerprint);
        item.isVariant = isVariant;
        duplicates.push(item);
      } else {
        seenMap.set(fingerprint, item.track.videoId || item.track.id || item.track.title);
        item.isVariant = isVariant;
        uniqueTracks.push(item);
      }
    }

    return { uniqueTracks, duplicates };
  }

  public logActivity(item: Omit<ActivityLogItem, "id" | "timestamp">): ActivityLogItem {
    const fullItem: ActivityLogItem = {
      id: `act_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      timestamp: Date.now(),
      ...item,
    };

    try {
      let list: ActivityLogItem[] = [];
      if (fs.existsSync(this.activityFile)) {
        const raw = fs.readFileSync(this.activityFile, "utf-8");
        list = JSON.parse(raw);
      }
      list.unshift(fullItem);
      // Cap log history to 100 entries
      if (list.length > 100) list = list.slice(0, 100);
      fs.writeFileSync(this.activityFile, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.warn("[MergeEngine] Failed saving activity log:", err);
    }

    return fullItem;
  }

  public recordActivity(item: Omit<ActivityLogItem, "id" | "timestamp">): ActivityLogItem {
    return this.logActivity(item);
  }

  public getActivityLogs(): ActivityLogItem[] {
    if (!fs.existsSync(this.activityFile)) return [];
    try {
      const raw = fs.readFileSync(this.activityFile, "utf-8");
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getActivityLog(): ActivityLogItem[] {
    return this.getActivityLogs();
  }
}
