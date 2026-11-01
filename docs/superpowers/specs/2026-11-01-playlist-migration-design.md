# PlayForgeX: YouTube Music to Apple Music Playlist Exporter & Importer

**Author:** Antigravity  
**Date:** 2026-11-01  
**Status:** Approved by User  
**Target:** macOS / Desktop Electron App  

---

## 1. Intent & The Why

Users who want to migrate playlists from YouTube Music to Apple Music face two critical roadblocks:
1. **Developer Program Gatekeeping:** Apple Music API requires a paid Apple Developer Program membership (\$99/year) to generate MusicKit keys. Google Cloud Console requires creating projects, OAuth client credentials, and managing strict quota limitations.
2. **Non-Latin / Japanese Song Matching Failures:** Standard migration services (TuneMyMusic, SongShift, Soundiiz) perform naive 1:1 artist/album matching. In Japanese music (J-Pop, Anime OSTs, Vocaloid, Doujin, VTuber tracks), YouTube Music titles frequently use native Kanji/Kana (e.g. `夜に駆ける`, `廻廻奇譚`, `群青`), while Apple Music regional storefronts might list Romanized titles, or YouTube Music video titles include artist names and noise tags while the artist field is messy. Traditional tools fail to match these songs or discard them entirely.

**PlayForgeX** solves both problems:
- **Zero Developer Accounts:** Authenticates via real session cookies and tokens captured via a built-in Electron native modal window. Users log in directly on official Google / Apple pages.
- **Original-Title-First Matching Engine:** Prioritizes matching the original native title above artist and album.
- **Tolerant Cover Matching:** Accepts cover versions or alternative recordings if the original is not indexed, rather than dropping the track.
- **Weighted Hierarchy:** Title Match (Weight 60%) > Artist Match (Weight 25%) > Album Match (Weight 15%).
- **Anti-AI-Slop Review Studio:** Clean, dense, audio-workstation aesthetic interface that gives users complete visibility and manual override control before finalizing the import into Apple Music.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
- Provide seamless "One-Click Modal Login" for both YouTube Music and Apple Music using Electron's native browser window session interception (no manual cookie string copying).
- Fetch all user playlists and track listings directly from YouTube Music web client API.
- Intelligent title sanitizer: strips video noise tags (`[MV]`, `【Official Video】`, `(Audio)`, `feat.`) while preserving native non-Latin characters (Kanji, Hiragana, Katakana, Hangul, Cyrillic).
- Multi-query Apple Music Catalog search (original title first, fallback to original title + artist, fallback to Romanized transliteration if bracketed).
- Multi-tier matching scoring algorithm adhering strictly to the user's priority rule:
  - Title match: 60%
  - Artist match: 25% (allows covers/alternatives to match with positive confidence)
  - Album match: 15%
- Interactive Migration Review Studio:
  - High-density visual table showing Source (YTM) vs Target (AM).
  - Clear status chips: `Exact Match` (Emerald), `Cover / Alt Version` (Amber), `Not Found` (Rose).
  - Inline "Change Track" dialog to pick alternative catalog search results or type a custom search.
- Batch creation of Apple Music library playlists and track injection with progress, speed throttling (rate-limit safe), and error recovery.

### Non-Goals
- Background daemon or 24/7 continuous syncing (this is an on-demand migration tool).
- Full local audio downloader / MP3 converter (streaming service migration only).
- Reverse migration (Apple Music -> YouTube Music) in v1, though modular architecture will allow it later.

### Anti-Goals
- Requiring the user to open Chrome DevTools, inspect network requests, and paste `Cookie:` or `Authorization:` headers.
- Generic AI-slop UI: purple/blue generic landing page cards, huge low-density padding, lack of real status indicators, missing retry logic, lack of audio previews or track review.
- Silently skipping or discarding non-Latin songs when artist names don't match 1:1.

---

## 3. Approaches Considered & Selected

### Approach 1: Electron Desktop App (Selected)
- **Architecture:** Electron main process handles session interception, YouTubei & MusicKit API orchestration, while a Vite + React + Tailwind frontend renders the migration workspace.
- **Login Flow:** Opens native `BrowserWindow` to `music.youtube.com` and `music.apple.com`. Intercepts `session.defaultSession.cookies` and request headers (`media-user-token`, MusicKit developer token).
- **Pros:** True modal login (bypasses browser iframe CSP/X-Frame-Options), 100% automated cookie capture, safe desktop file persistence, smooth performance.
- **Cons:** Requires Electron runtime.

### Approach 2: Local Web Server (Node.js/Express) + Puppeteer Browser Popup
- **Architecture:** Local web app that spawns an external Chromium instance for login.
- **Pros:** Pure web UI.
- **Cons:** Clunky detached window UX; requires downloading headless Chromium (~200MB); fragile across OS environments.

### Approach 3: Browser Extension (Chrome/Edge Extension)
- **Architecture:** Sidepanel extension reading cookies via `chrome.cookies`.
- **Pros:** Lightweight.
- **Cons:** Requires Developer Mode installation; cramped UI space; MusicKit web API calls blocked by strict extension CSP rules.

**Decision:** Approach 1 was approved by the user for its seamless modal login and dedicated desktop workstation interface.

---

## 4. Technical Architecture & Component Design

### 4.1 System Diagram
```
+-------------------------------------------------------------+
|                     PlayForgeX (Electron)                   |
|                                                             |
| +-------------------------+     +-------------------------+ |
| |    Login Modal Window   |     |    Login Modal Window   | |
| |   (music.youtube.com)   |     |    (music.apple.com)    | |
| +------------+------------+     +------------+------------+ |
|              | Cookie / Auth Interceptor     |              |
|              v                               v              |
| +-------------------------+     +-------------------------+ |
| |    YouTube Music Client |     |    Apple Music Client   | |
| |    - Fetch Playlists    |     |    - Catalog Search     | |
| |    - Fetch Tracks       |     |    - Create Playlist    | |
| |    - Metadata Extractor |     |    - Add Tracks         | |
| +------------+------------+     +------------+------------+ |
|              |                               ^              |
|              +--------------+ +--------------+              |
|                             | |                             |
|                             v v                             |
|              +-------------------------------+              |
|              |   Matching & Scoring Engine   |              |
|              |   - Title Sanitizer           |              |
|              |   - Original Title 1st Search |              |
|              |   - Weighted Score (60/25/15) |              |
|              |   - Cover / Alt Detection     |              |
|              +---------------+---------------+              |
|                              |                              |
|                              v                              |
|              +-------------------------------+              |
|              |   Review Studio UI (React)    |              |
|              |   - Playlist Selector         |              |
|              |   - Track Comparison Matrix   |              |
|              |   - Match Status & Filter     |              |
|              |   - Alternative Picker Dialog |              |
|              |   - Batch Migration Engine    |              |
|              +-------------------------------+              |
+-------------------------------------------------------------+
```

### 4.2 YouTube Music Client (`ytmusic.ts`)
- Authenticates using captured cookies (`SAPISID`, `__Secure-3PAPISID`, `HSID`, `SSID`, `SID`, etc.).
- Computes `SAPISIDHASH` header: `SHA1(timestamp + " " + SAPISID + " " + "https://music.youtube.com")`.
- Queries YouTubei internal endpoint `https://music.youtube.com/youtubei/v1/browse` to list library playlists (`FEmusic_liked_playlists` and user playlists).
- Recursively paginates continuation tokens to get all tracks with videoId, original title, artists, album, and thumbnail.

### 4.3 Apple Music Client (`applemusic.ts`)
- Automatically retrieves public MusicKit Web developer token from `music.apple.com` frontend assets.
- Captures `media-user-token` (Music-User-Token) when user logs in via the native modal window.
- Detects user storefront via `GET https://amp-api.music.apple.com/v1/me/storefront` (e.g. `jp`, `id`, `us`).
- Catalog Search: `GET https://amp-api.music.apple.com/v1/catalog/{storefront}/search?types=songs&term={encodeURIComponent(term)}&limit=15`.
- Playlist Management:
  - Create Playlist: `POST https://amp-api.music.apple.com/v1/me/library/playlists` with `{ attributes: { name, description } }`.
  - Add Tracks: `POST https://amp-api.music.apple.com/v1/me/library/playlists/{playlistId}/tracks` with `{ data: [{ id: songId, type: "songs" }] }`.

### 4.4 Title Sanitizer & Matching Engine (`matcher.ts`)
- **Sanitizer Pipeline:**
  1. Unicode NFKC normalization.
  2. Extract bracketed romanization/English subtitles if present: e.g. `夜に駆ける (Racing into the Night)` $\rightarrow$ Primary: `夜に駆ける`, Secondary: `Racing into the Night`.
  3. Clean noise regex: removes `(Official Video|Music Video|MV|Audio|Lyric Video|HD|4K|Remastered|Official Audio|Visualizer|Live)`.
  4. Preserve original title exactly without stripping Kanji/Kana.
- **Search Queries:**
  - Query 1 (Primary): Exact original title.
  - Query 2 (Secondary, if < 2 results): `Original Title + Artist`.
  - Query 3 (Tertiary, if bracketed translation exists): `Translated Title`.
- **Scoring Function:**
  $$Score = 0.60 \times Sim_{Title}(S_1, S_2) + 0.25 \times Sim_{Artist}(A_1, A_2) + 0.15 \times Sim_{Album}(Al_1, Al_2)$$
  - Similarity uses Levenshtein / Dice coefficient with token overlap and Kana normalization.
  - Classification:
    - `EXACT_MATCH`: Score $\ge 0.75$ and $Sim_{Title} \ge 0.80$ and $Sim_{Artist} \ge 0.65$.
    - `COVER_OR_ALT`: $Sim_{Title} \ge 0.85$ but $Sim_{Artist} < 0.65$ (User requirement: covers acceptable if original not found or alternative found).
    - `LOW_CONFIDENCE`: Score between $0.45$ and $0.75$.
    - `NOT_FOUND`: No candidates or best score $< 0.45$.

### 4.5 UI/UX Design System (Anti-AI-Slop)
- Theme: Dark Obsidian / Vinyl Studio (`#0B0E14` base, `#151922` cards, `#1E2433` borders).
- Typography: Inter / SF Pro / Noto Sans JP for crisp Japanese Kanji/Kana rendering.
- Layout:
  1. **Top Bar**: Service connection indicators (`YouTube Music: Connected (32 playlists)`, `Apple Music: Connected (Storefront: JP)`), Login Modal triggers.
  2. **Playlist Sidebar / Grid**: Multi-select playlists or select all, track count badges, cover art collage.
  3. **Migration Review Studio (Main View)**:
     - Stat summary cards: Total Tracks, Exact Matches, Covers/Alternatives, Unmatched.
     - Filter tabs: All, Needs Review, Covers Only, Unmatched Only.
     - High-density comparative rows:
       - Left: YouTube Music original track (Thumbnail, Title, Artist, Album).
       - Middle: Confidence Badge + Match Reason ("Exact Title & Artist", "Cover Version by ...", "Title Match Only").
       - Right: Apple Music candidate (Artwork, Title, Artist, Album, Preview audio player if available).
       - Actions: Swap / Search Alternative button, Exclude checkbox.
  4. **Execution Drawer / Modal**:
     - Real-time progress bar, transfer rate, retry button for failed tracks, direct link to Apple Music web playlist upon completion.

---

## 5. Security & Privacy
- Zero credential storage on external servers: all cookies and tokens live in memory or local encrypted Electron store on the user's machine.
- Direct HTTPS communication from Electron to `music.youtube.com` and `amp-api.music.apple.com`.
- No telemetry or third-party tracking.
