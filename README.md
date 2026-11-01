# TuneBridge 🎵

> **Your Music, Woven Together**  
> *Multi-Account Music Migration & Merge Studio • Zero Developer Fees • Self-Hosted • Anti-AI-Slop Audio Workstation*

---

## 🌟 Highlights & Key Capabilities

1. **Multi-Account Music Collection Manager**
   - Connect multiple accounts from YouTube Music and Apple Music locally (e.g. YouTube A + YouTube B + YouTube C ➔ Apple Music D "Mobil").
   - Merge multiple playlists from different accounts into a single destination account without paying for extra subscriptions.
   - Separate metadata (`accounts.json`) and secure credentials (`secrets.json`) locally.

2. **Smart Deduplication with Variant Protection**
   - Eliminates exact duplicate songs across aggregated sources.
   - Intelligently recognizes and preserves **Live, Remix, Acoustic, and Instrumental** variants rather than falsely deduplicating them.

3. **Original-Title-First Cross-Platform Matching**
   - Specifically architected to solve the major flaw in migration tools: **non-Latin music matching failures** (Japanese Kanji, Hiragana, Katakana, Korean Hangul, Arabic, Romaji).
   - Video noise tags (`[Official Video]`, `MV`, `【Official MV】`, `(Audio)`, `feat.`) are stripped while **preserving authentic characters**.
   - Primary catalog search queries the exact original title first rather than forcing rigid 1:1 artist strings.

4. **Apple Music × Linear Design System**
   - Crafted with Emil Kowalski micro-interactions (`active:scale-[0.98]`, responsive tactile feedback).
   - High information density with refined borders (`#292D37`), periwinkle accent (`#A99BFF`), and dark surface palette (`#0B0C0F` / `#12141A`).
   - 6 Core Modules: Overview, Transfer Studio, Library, Connected Accounts, Activity Audit Log, Settings.
   - Fully responsive for desktop and mobile devices.

5. **Anti-Ban Stealth Guard**
   - Protects sessions with automatic circuit breaker cooldowns on rate-limit responses (HTTP 429).
   - Natural human jitter delays between requests to keep session health intact.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- macOS, Windows, Linux, or Docker

### Quick Start (Web & Self-Hosted LAN)

```bash
# Clone the repository
git clone https://github.com/your-username/MirrorSong.git
cd MirrorSong

# Install dependencies
npm install

# Run self-hosted server
npm run server
# Access at http://localhost:3080 or http://192.168.1.42:3080
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

---

## 🛠️ Architecture

```
TuneBridge
├── src/
│   ├── core/
│   │   ├── sanitizer.ts        # Unicode NFKC & noise tag stripper (preserves non-Latin)
│   │   ├── matcher.ts          # Weighted scoring engine (60% Title / 25% Artist / 15% Album)
│   │   ├── ytmusic.ts          # SAPISIDHASH generator & YouTube Music API client
│   │   ├── applemusic.ts       # MusicKit Web client, catalog search & playlist creator
│   │   ├── stealth.ts          # Circuit breaker cooldown & human jitter anti-ban guard
│   │   └── lyric-validator.ts  # Secondary lyric verification for disambiguation
│   ├── server/
│   │   ├── account-manager.ts  # Multi-account local connection and secrets manager
│   │   ├── merge-engine.ts     # Cross-account aggregation, deduplication & audit trail
│   │   ├── matcher-worker.ts   # Background matching engine & persistent draft store
│   │   └── index.ts            # REST API router & self-hosted server
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── NavigationRail.tsx         # Linear-style left rail (desktop) & bottom bar (mobile)
│   │   │   ├── views/
│   │   │   │   ├── OverviewView.tsx       # System health, metrics & quick start
│   │   │   │   ├── TransferStudioView.tsx # 1:1 Transfer & Multi-Source Merge Studio
│   │   │   │   ├── LibraryView.tsx        # Cross-account playlist explorer
│   │   │   │   ├── AccountsView.tsx       # Dedicated connection manager (Add, Rename, Test)
│   │   │   │   ├── ActivityView.tsx       # Audit trail of completed and past transfers
│   │   │   │   └── SettingsView.tsx       # Algorithm weights, anti-ban status & LAN config
│   │   │   ├── AddAccountModal.tsx        # 1-Click bookmarklet & token input
│   │   │   ├── ReviewStudio.tsx           # High-density comparative matching review
│   │   │   ├── TrackRow.tsx               # Track comparison row with 30s audio preview
│   │   │   ├── AlternativePickerModal.tsx # Interactive catalog search & alternative picker
│   │   │   ├── ExportModal.tsx            # New playlist creation vs append to existing
│   │   │   └── TransferProgressModal.tsx  # Live progress modal with backoff guard
│   │   └── App.tsx                        # Root layout orchestrator
│   └── shared/
│       ├── types.ts            # Shared domain types & multi-account models
│       └── ipc.ts              # Electron IPC channel contracts
└── tests/                      # 41 passing unit tests across 11 test suites
```

---

## 🔒 Security & Privacy

- **100% Local Execution:** All network calls go directly from your local machine to `music.youtube.com` and `amp-api.music.apple.com`.
- **Zero Third-Party Servers:** No external servers, proxy endpoints, or analytics services ever touch your tokens or playlists.
- **Segregated Storage:** Tokens stay in `data/secrets.json` and are never exposed via APIs or frontend payloads.

---

## 📄 License

MIT License. Designed with care for music enthusiasts.
