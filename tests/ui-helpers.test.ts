import { describe, it, expect } from "vitest";
import {
  getStatusBadgeProps,
  filterReviewTracks,
  calculateMatchStats,
  copyToClipboard,
} from "../src/renderer/utils/ui-helpers";
import { TransferTrackItem } from "../src/shared/types";

describe("UI Match Helpers", () => {
  it("returns correct color tokens for match statuses", () => {
    const exact = getStatusBadgeProps("EXACT_MATCH");
    expect(exact.label).toBe("Exact Match");
    expect(exact.bgClass).toContain("emerald");

    const cover = getStatusBadgeProps("COVER_OR_ALT");
    expect(cover.label).toBe("Cover / Alternative");
    expect(cover.bgClass).toContain("amber");

    const unmatched = getStatusBadgeProps("NOT_FOUND");
    expect(unmatched.label).toBe("Unmatched");
    expect(unmatched.bgClass).toContain("rose");
  });

  it("filters tracks correctly by tab", () => {
    const tracks: Partial<TransferTrackItem>[] = [
      { match: { status: "EXACT_MATCH", totalScore: 0.9, titleScore: 0.9, artistScore: 0.9, albumScore: 0.9 } },
      { match: { status: "COVER_OR_ALT", totalScore: 0.6, titleScore: 0.9, artistScore: 0.2, albumScore: 0.2 } },
      { match: { status: "NOT_FOUND", totalScore: 0.1, titleScore: 0.1, artistScore: 0.1, albumScore: 0.1 } },
    ];
    expect(filterReviewTracks(tracks as TransferTrackItem[], "all")).toHaveLength(3);
    expect(filterReviewTracks(tracks as TransferTrackItem[], "covers")).toHaveLength(1);
    expect(filterReviewTracks(tracks as TransferTrackItem[], "unmatched")).toHaveLength(1);
    expect(filterReviewTracks(tracks as TransferTrackItem[], "exact")).toHaveLength(1);
  });

  it("calculates match statistics accurately", () => {
    const tracks: Partial<TransferTrackItem>[] = [
      { match: { status: "EXACT_MATCH", totalScore: 0.9, titleScore: 0.9, artistScore: 0.9, albumScore: 0.9 }, excluded: false, selectedCandidate: { id: "c1" } as any },
      { match: { status: "COVER_OR_ALT", totalScore: 0.6, titleScore: 0.9, artistScore: 0.2, albumScore: 0.2 }, excluded: false, selectedCandidate: { id: "c2" } as any },
      { match: { status: "NOT_FOUND", totalScore: 0.1, titleScore: 0.1, artistScore: 0.1, albumScore: 0.1 }, excluded: true },
    ];
    const stats = calculateMatchStats(tracks as TransferTrackItem[]);
    expect(stats.total).toBe(3);
    expect(stats.exact).toBe(1);
    expect(stats.covers).toBe(1);
    expect(stats.unmatched).toBe(1);
    expect(stats.activeForImport).toBe(2);
  });

  it("handles copyToClipboard fallback gracefully without throwing errors", async () => {
    // Test in environment where navigator.clipboard might be missing or mocked
    const result = await copyToClipboard("javascript:alert(1)");
    // Should return a boolean without crashing
    expect(typeof result).toBe("boolean");
  });
});
