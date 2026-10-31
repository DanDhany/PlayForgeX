# MirrorSong 🎵

> **YouTube Music to Apple Music Playlist Studio**  
> *Zero Developer Accounts • Native Modal Login • Original Title 1st Search • Anti-AI-Slop Audio Workstation*

---

## 🌟 Highlights & Key Features

1. **No Developer Account Required (Zero \$99 Apple Tax, Zero Google Cloud Projects)**
   - No need to sign up for the Apple Developer Program or create complex Google Cloud OAuth clients.
   - Built with an embedded Electron native modal login flow: click **Modal Login**, sign in directly through official Google / Apple interfaces (with full support for 2FA, passkeys, and Apple ID), and MirrorSong automatically captures the session cookies and MusicKit tokens in the background.

2. **Original-Title-First Cross-Platform Matching**
   - Specifically architected to solve the major flaw in tools like SongShift, TuneMyMusic, and Soundiiz: **non-Latin music matching failures** (especially Japanese Kanji, Hiragana, Katakana, and mixed Romaji/English).
   - Video noise tags (`[Official Video]`, `MV`, `【Official MV】`, `(Audio)`, `feat.`) are stripped while **preserving authentic Japanese characters**.
   - Primary catalog search queries the exact original title first rather than forcing rigid 1:1 artist strings.

3. **Cover & Alternative Version Tolerance**
   - If an original song is not indexed or only a cover version (VTuber, Utaite, acoustic, instrumental) exists, MirrorSong recognizes and accepts the cover instead of discarding the song.
   - Weighted scoring hierarchy:
     $$\text{Total Score} = 0.60 \times \text{Title} + 0.25 \times \text{Artist} + 0.15 \times \text{Album}$$
   - Clearly flags songs with distinct status chips:
     - `Exact Match` (Emerald) — High title & artist confidence.
     - `Cover / Alternative` (Amber) — Exact title matched with alternative performer.
     - `Unmatched` (Rose) — No reasonable match found in catalog.

4. **Anti-AI-Slop Migration Studio**
   - Purpose-built dark audio workstation aesthetic (Obsidian & Slate palette).
   - High information density: comparative side-by-side review of YouTube Music original tracks vs Apple Music matches.
   - Built-in 30-second audio preview player to verify matches by ear before importing.
   - **Swap / Search Alternative Dialog**: Search Apple Music catalog with custom keywords and override any match with one click.
   - Rate-limit resilient batch creator: safely creates Apple Music library playlists and injects tracks in chunks with automatic exponential backoff.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- macOS, Windows, or Linux

### Quick Start (Development Mode)

```bash
# Clone the repository
git clone https://github.com/your-username/MirrorSong.git
cd MirrorSong

# Install dependencies
npm install

# Run the desktop app
npm run dev
```

### Running Unit Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

---

## 🛠️ Architecture & Core Components

```
MirrorSong
├── electron/
│   ├── main.ts              # Main process, IPC handlers, background worker
│   ├── preload.ts           # Secure context-isolated IPC bridge
│   └── auth-modal.ts        # Native browser window cookie & token interceptor
├── src/
│   ├── core/
│   │   ├── sanitizer.ts     # Unicode NFKC & noise tag stripper (preserves non-Latin)
│   │   ├── matcher.ts       # Weighted scoring engine (60% Title / 25% Artist / 15% Album)
│   │   ├── ytmusic.ts       # SAPISIDHASH generator & YouTubei playlist extractor
│   │   └── applemusic.ts    # MusicKit Web client, catalog search & playlist creator
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── Header.tsx                 # Connection status & modal triggers
│   │   │   ├── PlaylistSidebar.tsx        # Playlist selector & search
│   │   │   ├── ReviewStudio.tsx           # Comparative matching workstation
│   │   │   ├── TrackRow.tsx               # High-density comparison row with audio preview
│   │   │   ├── AlternativePickerModal.tsx # Custom catalog search & override dialog
│   │   │   └── TransferProgressModal.tsx  # Batch transfer progress with Apple Music link
│   │   ├── utils/ui-helpers.ts            # Formatting & stats utilities
│   │   └── App.tsx                        # Root layout orchestrator
│   └── shared/
│       ├── types.ts         # Data models and interfaces
│       └── ipc.ts           # Strongly typed IPC channel contracts
└── tests/                   # 19 passing unit tests covering all modules
```

---

## 🔒 Security & Privacy

- **100% Local Execution:** All network calls go directly from your local machine to `music.youtube.com` and `amp-api.music.apple.com`.
- **Zero Third-Party Servers:** No external servers, proxy endpoints, or analytics services ever touch your tokens or playlists.
- **In-Memory Sessions:** Credentials stay exclusively on your local machine and can be cleared with the **Disconnect** button at any time.

---

## 📄 License

MIT License. Designed with care for music enthusiasts.
