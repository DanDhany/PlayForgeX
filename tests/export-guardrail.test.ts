import { describe, it, expect } from "vitest";
import {
  getSelectableExportPlatforms,
  resolveTargetExportSelection,
} from "../src/renderer/utils/export-guardrails";
import { AccountConnection } from "../src/shared/types";

describe("Export Destination Guardrails & Account Selection Suite (TDD)", () => {
  const sampleAccounts: AccountConnection[] = [
    {
      id: "acc_sp_1",
      platform: "spotify",
      localAlias: "Spotify Kantor",
      status: "connected",
      createdAt: 1000,
    },
    {
      id: "acc_sp_2",
      platform: "spotify",
      localAlias: "Spotify Pribadi",
      status: "connected",
      createdAt: 2000,
    },
    {
      id: "acc_yt_1",
      platform: "youtube",
      localAlias: "YouTube Music Rumah",
      status: "connected",
      createdAt: 3000,
    },
  ];

  it("only includes platforms that have connected accounts (guardrail)", () => {
    const destinations = getSelectableExportPlatforms(sampleAccounts);

    // Only spotify and youtube should be present
    const platforms = destinations.map((d) => d.platform);
    expect(platforms).toHaveLength(2);
    expect(platforms).toContain("spotify");
    expect(platforms).toContain("youtube");

    // Platforms WITHOUT connected accounts MUST NOT appear in dropdown!
    expect(platforms).not.toContain("apple");
    expect(platforms).not.toContain("deezer");
    expect(platforms).not.toContain("soundcloud");
    expect(platforms).not.toContain("youtube_video");
    expect(platforms).not.toContain("file");
  });

  it("returns empty list if no accounts are connected", () => {
    const emptyDestinations = getSelectableExportPlatforms([]);
    expect(emptyDestinations).toEqual([]);
  });

  it("groups multiple accounts under the same platform so user can select specific account", () => {
    const destinations = getSelectableExportPlatforms(sampleAccounts);
    const spotifyDest = destinations.find((d) => d.platform === "spotify");

    expect(spotifyDest).toBeDefined();
    expect(spotifyDest?.accounts).toHaveLength(2);
    expect(spotifyDest?.accounts[0].localAlias).toBe("Spotify Kantor");
    expect(spotifyDest?.accounts[1].localAlias).toBe("Spotify Pribadi");
  });

  it("resolves target platform and account with fallback when preferred platform is not added", () => {
    // User preferred "apple", but Apple Music account was never added!
    const resolution = resolveTargetExportSelection(
      sampleAccounts,
      "apple", // Not added!
      undefined,
      "youtube" // Source is youtube
    );

    // Guardrail prevents "apple" and selects valid connected platform ("spotify")
    expect(resolution.targetPlatform).toBe("spotify");
    expect(resolution.targetAccountId).toBe("acc_sp_1");
  });

  it("resolves specific target account if requested and validates account id", () => {
    const resolution = resolveTargetExportSelection(
      sampleAccounts,
      "spotify",
      "acc_sp_2", // Explicitly picked second account
      "youtube"
    );

    expect(resolution.targetPlatform).toBe("spotify");
    expect(resolution.targetAccountId).toBe("acc_sp_2");
  });

  it("falls back to primary account of target platform if preferred account id does not exist", () => {
    const resolution = resolveTargetExportSelection(
      sampleAccounts,
      "spotify",
      "non_existent_account_id",
      "youtube"
    );

    expect(resolution.targetPlatform).toBe("spotify");
    expect(resolution.targetAccountId).toBe("acc_sp_1");
  });

  it("avoids source platform during fallback if another connected platform exists", () => {
    const resolution = resolveTargetExportSelection(
      sampleAccounts,
      "unconnected_platform",
      undefined,
      "spotify" // source is spotify
    );

    // Should choose youtube instead of spotify as export target
    expect(resolution.targetPlatform).toBe("youtube");
    expect(resolution.targetAccountId).toBe("acc_yt_1");
  });

  it("falls back gracefully when accounts list is empty", () => {
    const resolution = resolveTargetExportSelection([], "spotify");
    expect(resolution.targetPlatform).toBe("spotify");
    expect(resolution.targetAccountId).toBeUndefined();
  });
});
