# YouTube Music to Apple Music Playlist Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop application (Electron + React + TypeScript + Tailwind) that exports YouTube Music playlists and imports them into Apple Music without developer accounts, using cookie-based modal logins and a specialized matching engine prioritizing original titles (especially non-Latin/Japanese tracks), with cover tolerance and a high-density, anti-slop review studio.

**Architecture:** Electron main process handles native modal browser windows for one-click cookie/token extraction from `music.youtube.com` and `music.apple.com`. The backend engine cleans non-Latin titles, queries Apple Music catalog prioritizing original titles, calculates weighted scores (60% Title, 25% Artist, 15% Album), marks covers/alternatives, and executes batch playlist creation via MusicKit Web API. A React + Tailwind frontend presents a professional audio-workstation review matrix for full visibility and track overrides.

**Tech Stack:** Electron 35+, Node.js 22, React 19, TypeScript 5, Vite 6, Tailwind CSS 3, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-playlist-migration-design.md`

## Global Constraints

- No Apple Developer Program account ($99/year) or Google Cloud Console project required from user.
- Authentication must be automated via native Electron modal browser popups intercepting session cookies/tokens.
- Cross-platform matching priority hierarchy: Title (60%) > Artist (25%) > Album (15%).
- Original non-Latin (Japanese/Kanji/Kana) title must be prioritized in search queries before artist or romanized fallbacks.
- If original song is not found or only a cover is indexed, accept the cover/alternative and flag it clearly instead of dropping the track.
- UI must follow a clean, high-density audio workstation aesthetic (Obsidian/Slate palette, sharp contrast, anti-AI-slop).

## Review Focus

1. Japanese titles with full-width characters and bracketed English subtitles (e.g. `夜に駆ける (Racing into the Night)`) should isolate the original Kanji title as primary search term and not get polluted by noise tags.
2. Exact title match with different artist (e.g. Cover by a VTuber or indie artist) should be categorized as `COVER_OR_ALT` with high confidence instead of failing as `NOT_FOUND`.
3. Session cookies containing special characters and multiple cookies (`SAPISID`, `__Secure-3PAPISID`) must compute valid SHA-1 `SAPISIDHASH` headers.
4. Apple Music rate-limiting (HTTP 429) during batch playlist addition must automatically throttle with exponential backoff and retry without crashing.
5. In the UI, unmatched or cover songs must allow the user to open an alternative picker dialog, search Apple Music catalog with custom terms, and select a substitute track.

---

### Task 1: Project Scaffolding & Build Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.html`
- Create: `vitest.config.ts`
- Test: `tests/scaffold.test.ts`

**Interfaces:**
- Produces: Project build pipeline (`npm run build`, `npm test`, `npm run dev`).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/scaffold.test.ts
import { describe, it, expect } from "vitest";

describe("Scaffold Verification", () => {
  it("should have test environment operational", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails (before setup)**

Run: `npx vitest run tests/scaffold.test.ts`
Expected: FAIL (vitest not installed / config missing)

- [ ] **Step 3: Initialize package.json, install dependencies, and configure Vite + Tailwind + TypeScript + Vitest**

Configure dependencies:
- Dependencies: `react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`
- DevDependencies: `electron`, `vite`, `vite-plugin-electron`, `vitest`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss`, `autoprefixer`, `postcss`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scaffold.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts tailwind.config.js vitest.config.ts tests/scaffold.test.ts
git commit -m "chore: scaffold project with Vite, React, TypeScript, Tailwind, and Vitest"
```

---

### Task 2: Title Sanitizer & Weighted Matching Engine

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/core/sanitizer.ts`
- Create: `src/core/matcher.ts`
- Test: `tests/matcher.test.ts`

**Interfaces:**
- Produces:
  - `cleanTitle(rawTitle: string): { originalTitle: string; cleanTitle: string; subtitle?: string; hasNonLatin: boolean }`
  - `calculateMatchScore(source: TrackMetadata, candidate: AppleMusicTrack): MatchResult`
  - Types: `TrackMetadata`, `AppleMusicTrack`, `MatchResult`, `MatchStatus` (`EXACT_MATCH` | `COVER_OR_ALT` | `LOW_CONFIDENCE` | `NOT_FOUND`)

- [ ] **Step 1: Write the failing test for Japanese title sanitization & weighted matching**

```typescript
// tests/matcher.test.ts
import { describe, it, expect } from "vitest";
import { cleanTitle } from "../src/core/sanitizer";
import { calculateMatchScore } from "../src/core/matcher";
import { TrackMetadata, AppleMusicTrack } from "../src/shared/types";

describe("Title Sanitizer", () => {
  it("preserves Japanese Kanji and strips YouTube video tags", () => {
    const raw = "夜に駆ける (Racing into the Night) [Official Music Video]";
    const res = cleanTitle(raw);
    expect(res.originalTitle).toBe("夜に駆ける");
    expect(res.subtitle).toBe("Racing into the Night");
    expect(res.hasNonLatin).toBe(true);
  });

  it("handles Japanese brackets and MV tags", () => {
    const raw = "【Ado】 うっせぇわ (Official MV)";
    const res = cleanTitle(raw);
    expect(res.cleanTitle).toBe("うっせぇわ");
    expect(res.hasNonLatin).toBe(true);
  });
});

describe("Weighted Matcher Engine", () => {
  it("prioritizes original title and recognizes cover versions as COVER_OR_ALT", () => {
    const source: TrackMetadata = {
      title: "夜に駆ける",
      artist: "YOASOBI",
      album: "THE BOOK",
    };
    const coverCandidate: AppleMusicTrack = {
      id: "12345",
      name: "夜に駆ける",
      artistName: "Hoshimachi Suisei",
      albumName: "Cover Collection",
      durationInMillis: 260000,
    };
    const result = calculateMatchScore(source, coverCandidate);
    expect(result.status).toBe("COVER_OR_ALT");
    expect(result.titleScore).toBeGreaterThanOrEqual(0.9);
    expect(result.totalScore).toBeGreaterThanOrEqual(0.6);
  });

  it("gives high score for exact title and artist match", () => {
    const source: TrackMetadata = {
      title: "廻廻奇譚",
      artist: "Eve",
      album: "廻人",
    };
    const candidate: AppleMusicTrack = {
      id: "67890",
      name: "廻廻奇譚",
      artistName: "Eve",
      albumName: "Kaizin",
      durationInMillis: 220000,
    };
    const result = calculateMatchScore(source, candidate);
    expect(result.status).toBe("EXACT_MATCH");
    expect(result.totalScore).toBeGreaterThanOrEqual(0.85);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/matcher.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `types.ts`, `sanitizer.ts`, and `matcher.ts`**

Implement:
- `cleanTitle`: NFKC normalization, noise tag regex filter (`[MV]`, `【Official MV】`, `(Audio)`, `feat.`), subtitle separation.
- `calculateMatchScore`: Levenshtein/Dice token similarity with weights: 60% Title, 25% Artist, 15% Album.
- Cover tolerance logic: If title similarity $\ge 0.85$ and artist similarity $< 0.70$, assign status `COVER_OR_ALT`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/matcher.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/types.ts src/core/sanitizer.ts src/core/matcher.ts tests/matcher.test.ts
git commit -m "feat: implement title sanitizer and weighted matching engine with Japanese support"
```

---

### Task 3: YouTube Music Client (Session & Library Extraction)

**Files:**
- Create: `src/core/ytmusic.ts`
- Test: `tests/ytmusic.test.ts`

**Interfaces:**
- Consumes: `TrackMetadata` from `src/shared/types.ts`
- Produces:
  - `generateSapisidHash(sapisid: string, origin: string): string`
  - `parseYouTubeMusicPlaylists(browseResponse: any): PlaylistSummary[]`
  - `parseYouTubeMusicTracks(playlistResponse: any): TrackMetadata[]`
  - `class YouTubeMusicClient`

- [ ] **Step 1: Write failing test for SAPISIDHASH generation and response parsing**

```typescript
// tests/ytmusic.test.ts
import { describe, it, expect } from "vitest";
import { generateSapisidHash, parseYouTubeMusicPlaylists, parseYouTubeMusicTracks } from "../src/core/ytmusic";

describe("YouTube Music Client Helpers", () => {
  it("computes valid SAPISIDHASH format (timestamp_sha1)", () => {
    const sapisid = "test_sapisid_value";
    const origin = "https://music.youtube.com";
    const hash = generateSapisidHash(sapisid, origin);
    expect(hash).toMatch(/^\d+_[a-f0-9]{40}$/);
  });

  it("parses playlist items correctly from YouTubei browse response", () => {
    const mockResponse = {
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [{
            tabRenderer: {
              content: {
                sectionListRenderer: {
                  contents: [{
                    gridRenderer: {
                      items: [{
                        musicTwoRowItemRenderer: {
                          title: { runs: [{ text: "My J-Pop Favorites" }] },
                          navigationEndpoint: { browseEndpoint: { browseId: "VLPL123" } },
                          subtitle: { runs: [{ text: "Playlist • 45 songs" }] }
                        }
                      }]
                    }
                  }]
                }
              }
            }
          }]
        }
      }
    };
    const playlists = parseYouTubeMusicPlaylists(mockResponse);
    expect(playlists).toHaveLength(1);
    expect(playlists[0].id).toBe("VLPL123");
    expect(playlists[0].title).toBe("My J-Pop Favorites");
    expect(playlists[0].trackCount).toBe(45);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ytmusic.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/core/ytmusic.ts`**

Implement SAPISID hashing via `crypto.createHash('sha1')`, YouTubei payload parser, pagination continuation walker, and `YouTubeMusicClient`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ytmusic.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/ytmusic.ts tests/ytmusic.test.ts
git commit -m "feat: implement YouTube Music client with SAPISID auth and playlist parsing"
```

---

### Task 4: Apple Music Client (MusicKit Web API)

**Files:**
- Create: `src/core/applemusic.ts`
- Test: `tests/applemusic.test.ts`

**Interfaces:**
- Consumes: `TrackMetadata`, `AppleMusicTrack`, `MatchResult` from `src/shared/types.ts`
- Produces:
  - `extractPublicDeveloperToken(): Promise<string>`
  - `class AppleMusicClient`
    - `getUserStorefront(): Promise<string>`
    - `searchCatalog(query: string, storefront: string): Promise<AppleMusicTrack[]>`
    - `createPlaylist(name: string, description: string): Promise<string>`
    - `addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>`

- [ ] **Step 1: Write failing test for Apple Music client search query builder and response mapper**

```typescript
// tests/applemusic.test.ts
import { describe, it, expect } from "vitest";
import { formatCatalogSearchUrl, mapAppleMusicSong } from "../src/core/applemusic";

describe("Apple Music Client", () => {
  it("formats catalog search url with encoded query and storefront", () => {
    const url = formatCatalogSearchUrl("jp", "夜に駆ける");
    expect(url).toContain("/v1/catalog/jp/search");
    expect(url).toContain(encodeURIComponent("夜に駆ける"));
  });

  it("maps raw song resource to AppleMusicTrack interface", () => {
    const raw = {
      id: "987654",
      type: "songs",
      attributes: {
        name: "夜に駆ける",
        artistName: "YOASOBI",
        albumName: "THE BOOK",
        durationInMillis: 261000,
        artwork: { url: "https://example.com/{w}x{h}bb.jpg" },
        previews: [{ url: "https://audio-ssl.itunes.apple.com/preview.m4a" }]
      }
    };
    const mapped = mapAppleMusicSong(raw);
    expect(mapped.id).toBe("987654");
    expect(mapped.name).toBe("夜に駆ける");
    expect(mapped.artworkUrl).toContain("100x100bb.jpg");
    expect(mapped.previewUrl).toBe("https://audio-ssl.itunes.apple.com/preview.m4a");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/applemusic.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/core/applemusic.ts`**

Implement:
- Token extraction / fallback public developer token.
- HTTP requests with exponential backoff for 429 rate limits.
- Chunked track addition (batches of 25 tracks).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/applemusic.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/applemusic.ts tests/applemusic.test.ts
git commit -m "feat: implement Apple Music client with catalog search and playlist creation"
```

---

### Task 5: Electron Main Process & Native Modal Login Handlers

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/auth-modal.ts`
- Create: `src/shared/ipc.ts`
- Test: `tests/ipc.test.ts`

**Interfaces:**
- Produces:
  - IPC channels: `auth:login-youtube`, `auth:login-apple`, `auth:get-status`, `playlists:fetch`, `transfer:match`, `transfer:execute`
  - Preload bridge `window.api` with TypeScript definitions.

- [ ] **Step 1: Write test for IPC channel contracts and state management**

```typescript
// tests/ipc.test.ts
import { describe, it, expect } from "vitest";
import { IPC_CHANNELS } from "../src/shared/ipc";

describe("IPC Channel Definitions", () => {
  it("defines standard channel names", () => {
    expect(IPC_CHANNELS.LOGIN_YOUTUBE).toBe("auth:login-youtube");
    expect(IPC_CHANNELS.LOGIN_APPLE).toBe("auth:login-apple");
    expect(IPC_CHANNELS.FETCH_PLAYLISTS).toBe("playlists:fetch");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ipc.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `auth-modal.ts`, `main.ts`, and `preload.ts`**

Implement:
- Native modal popup `BrowserWindow` centered over parent window.
- Captures session cookies upon navigating to `music.youtube.com` and `music.apple.com`.
- Extracts `media-user-token` from `session.defaultSession.cookies` or webRequest.
- Emits success back to renderer process.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ipc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add electron/main.ts electron/preload.ts electron/auth-modal.ts src/shared/ipc.ts tests/ipc.test.ts
git commit -m "feat: implement Electron main process and native modal login interceptor"
```

---

### Task 6: High-Density Migration Studio UI (React + Tailwind)

**Files:**
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/components/Header.tsx`
- Create: `src/renderer/components/PlaylistSidebar.tsx`
- Create: `src/renderer/components/ReviewStudio.tsx`
- Create: `src/renderer/components/TrackRow.tsx`
- Create: `src/renderer/components/AlternativePickerModal.tsx`
- Create: `src/renderer/components/TransferProgressModal.tsx`
- Create: `src/renderer/index.css`
- Create: `src/renderer/main.tsx`

**Interfaces:**
- Consumes: `window.api` IPC bridge, `TrackMetadata`, `MatchResult`, `PlaylistSummary`
- Produces: Complete interactive desktop workstation UI with:
  - Service connection indicators & modal triggers.
  - Playlist multi-selection.
  - Comparative match review table with audio preview and cover/exact badges.
  - Granular track override dialog.
  - Migration progress drawer with real-time logs.

- [ ] **Step 1: Write unit test for UI state filtering and match classification badge**

```typescript
// tests/ui-helpers.test.ts
import { describe, it, expect } from "vitest";
import { getStatusBadgeProps, filterReviewTracks } from "../src/renderer/utils/ui-helpers";

describe("UI Match Helpers", () => {
  it("returns correct color tokens for match statuses", () => {
    const exact = getStatusBadgeProps("EXACT_MATCH");
    expect(exact.label).toBe("Exact Match");
    expect(exact.bgClass).toContain("emerald");

    const cover = getStatusBadgeProps("COVER_OR_ALT");
    expect(cover.label).toBe("Cover / Alternative");
    expect(cover.bgClass).toContain("amber");
  });

  it("filters tracks correctly by tab", () => {
    const tracks: any[] = [
      { status: "EXACT_MATCH" },
      { status: "COVER_OR_ALT" },
      { status: "NOT_FOUND" }
    ];
    expect(filterReviewTracks(tracks, "all")).toHaveLength(3);
    expect(filterReviewTracks(tracks, "covers")).toHaveLength(1);
    expect(filterReviewTracks(tracks, "unmatched")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui-helpers.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement UI components with audio workstation aesthetic (Obsidian/Slate, no AI slop)**

Build components:
- `Header.tsx`: Connect buttons with status pills (YTM & AM).
- `PlaylistSidebar.tsx`: Checkable playlist cards with track count & cover art.
- `ReviewStudio.tsx`: Filter tabs (`All`, `Exact`, `Covers/Alt`, `Unmatched`), action toolbar, stats counters.
- `TrackRow.tsx`: High-density side-by-side comparison, audio preview player, "Swap Track" button.
- `AlternativePickerModal.tsx`: Search catalog dialog with live results and instant replacement.
- `TransferProgressModal.tsx`: Progress bar, current item, rate limiter indicator, error log, finish banner.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui-helpers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/ tests/ui-helpers.test.ts
git commit -m "feat: implement high-density Migration Studio UI with alternative picker and review matrix"
```

---

### Task 7: Build, Verification & Documentation

**Files:**
- Modify: `README.md`
- Test: Verification build (`npm run build`)

- [ ] **Step 1: Run complete test suite**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 2: Build frontend and Electron main bundles**

Run: `npm run build`
Expected: Build succeeds without TypeScript or Vite errors.

- [ ] **Step 3: Write comprehensive README.md with usage guide**

Document:
- Prerequisites and how to launch the app (`npm run dev`).
- How modal login works without developer keys.
- Explanation of the original-title-first matching algorithm and cover tolerance.
- Manual track override guide.

- [ ] **Step 4: Commit and finalize**

```bash
git add README.md
git commit -m "docs: add comprehensive usage guide and verify production build"
```
