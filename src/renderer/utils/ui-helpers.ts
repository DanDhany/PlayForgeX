import { MatchStatus, TransferTrackItem } from "../../shared/types";

export interface StatusBadgeProps {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getStatusBadgeProps(status: MatchStatus): StatusBadgeProps {
  switch (status) {
    case "EXACT_MATCH":
      return {
        label: "Exact Match",
        bgClass: "bg-emerald-500/10",
        textClass: "text-emerald-400",
        borderClass: "border-emerald-500/30",
      };
    case "COVER_OR_ALT":
      return {
        label: "Cover / Alternative",
        bgClass: "bg-amber-500/10",
        textClass: "text-amber-400",
        borderClass: "border-amber-500/30",
      };
    case "LOW_CONFIDENCE":
      return {
        label: "Partial Match",
        bgClass: "bg-sky-500/10",
        textClass: "text-sky-400",
        borderClass: "border-sky-500/30",
      };
    case "NOT_FOUND":
    default:
      return {
        label: "Unmatched",
        bgClass: "bg-rose-500/10",
        textClass: "text-rose-400",
        borderClass: "border-rose-500/30",
      };
  }
}

export type FilterTab = "all" | "exact" | "covers" | "unmatched";

export function filterReviewTracks(tracks: TransferTrackItem[], filter: FilterTab): TransferTrackItem[] {
  switch (filter) {
    case "exact":
      return tracks.filter((t) => t.match.status === "EXACT_MATCH");
    case "covers":
      return tracks.filter((t) => t.match.status === "COVER_OR_ALT" || t.match.status === "LOW_CONFIDENCE");
    case "unmatched":
      return tracks.filter((t) => t.match.status === "NOT_FOUND");
    case "all":
    default:
      return tracks;
  }
}

export function calculateMatchStats(tracks: TransferTrackItem[]) {
  let exact = 0;
  let covers = 0;
  let unmatched = 0;
  let activeForImport = 0;

  for (const track of tracks) {
    if (track.match.status === "EXACT_MATCH") exact += 1;
    else if (track.match.status === "COVER_OR_ALT" || track.match.status === "LOW_CONFIDENCE") covers += 1;
    else unmatched += 1;

    if (!track.excluded && track.selectedCandidate) {
      activeForImport += 1;
    }
  }

  return {
    total: tracks.length,
    exact,
    covers,
    unmatched,
    activeForImport,
  };
}

export function formatSeconds(seconds?: number): string {
  if (!seconds || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function formatMillis(ms?: number): string {
  if (!ms) return "--:--";
  return formatSeconds(Math.floor(ms / 1000));
}
