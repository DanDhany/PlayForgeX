# PlayForgeX 🎵

> **Universal Music Library & Migration Hub**  
> The all-in-one platform to migrate, merge, and mix-and-match playlists across YouTube Music, standard YouTube Video playlists, Apple Music, Spotify, SoundCloud, Deezer, and local files (M3U/CSV/JSON)—100% self-hosted, private, and unlimited.

---

## 🌟 Highlights

1. **Multi-Source Merge & Mix-and-Match**
   - Connect multiple accounts and services concurrently (for example: merge 2 YouTube Music accounts, a YouTube video playlist, and a Spotify public playlist into one master Apple Music library).
   - Flexible deduplication policies: remove exact audio duplicates while preserving authentic live recordings, acoustic covers, and remixes.
   - All credentials and library snapshots remain private inside your local database with zero remote cloud tracking.

2. **Standard YouTube Video Playlist Support (`youtube_video`)**
   - Ingest standard YouTube video playlists (`youtube.com/playlist?list=...`) or video IDs directly.
   - Smart Title Sanitizer automatically scrubs video noise (`[Official Video]`, `[MV]`, `(Lyrics)`, `4K`, `60fps`, remux tags) to recover clean studio artist and track names.
   - Video ID retention: preserves original `videoId` and generates direct links back to original videos.

3. **Multi-Platform Extensibility Architecture**
   - **YouTube Music** (`active`): Live bidirectional sync, stealth session support, mobile 1-tap bookmarklet.
   - **YouTube Video Playlists** (`active`): Standard video playlist ingestion with noise stripping.
   - **Apple Music** (`active`): Lossless catalog search, 30-second audio previews, and instant playlist creation.
   - **Spotify** (`active`): Public playlist URL and embed ingestion without developer credentials, plus full Spotify Web API support.
   - **SoundCloud** (`active`): Ingest indie tracks, underground live sets, and DJ mixes from SoundCloud sets.
   - **Deezer** (`active`): Open REST API integration with lossless metadata and instant track resolution.
   - **File / Text Ingestion** (`active`): Import playlists from M3U, M3U8, CSV, plain text lists (`Artist - Title`), and Soundiiz/PlayForgeX JSON snapshots.
   - **Tidal Hi-Fi & Subsonic / Navidrome** (`planned`): Roadmapped self-hosted and audiophile connectors.

4. **User Authentication & Multi-Tenant Data Isolation**
   - Secure authentication with scrypt password hashing and stateless token verification.
   - Role-based permissions (`admin` and `user`).
   - Tenant isolation: non-admin users only view their own accounts and logs, while administrators have full user management and audit capabilities.

5. **Linear × Apple Music Interface**
   - Responsive layout designed for desktop, tablet, and mobile devices (with portrait and landscape support).
   - Audio preview bar: listen to real 30-second catalog snippets before committing transfers.
   - Multi-language support: English (default) and Indonesian (`id`) with instant runtime switching.

---

## 🔑 Default Administrator Credentials

When starting PlayForgeX for the first time, a default administrator account is seeded:

| Parameter | Value |
| :--- | :--- |
| **Username** | `admin` |
| **Password** | `playforgex2026` |
| **Role** | `admin` (Full administrative privileges, user management, and cross-user activity audits) |

> 🔒 *Security Note*: These credentials are for initial local setup. You can update credentials or manage additional users from the **Users** tab inside the application. Regular users registering via the app only access their own connected accounts and activity logs.

---

## 🗄️ Database Setup (MySQL)

PlayForgeX supports MySQL for persistent caching, playlist storage, and migration logs. You can run MySQL either via Homebrew (recommended for local macOS development) or via Docker Compose.

### Option A: Homebrew MySQL (Default for Local macOS)

```bash
# Install and start MySQL
brew install mysql
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS playforgex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Default connection configuration (`.env` or environment variables):
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=playforgex
```

### Option B: Docker Compose with MySQL

If you prefer containerized services, run Docker Compose with the `with-db` profile:

```bash
# Launch PlayForgeX and containerized MySQL
docker compose --profile with-db up -d

# MySQL data is persisted in ./data/mysql
```

If MySQL is already running on your host machine, run only the application container:

```bash
docker compose up -d
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- MySQL 8.0+ (via Homebrew or Docker)
- Modern web browser (Chrome, Safari, Edge, or Brave)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/DanDhany/PlayForgeX.git
cd PlayForgeX

# Install dependencies
npm install

# Start the web server
npm run server
# Open http://localhost:3080 in your browser
```

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

---

## 🛠️ Project Structure

```
PlayForgeX
├── src/
│   ├── core/
│   │   ├── adapters/           # Modular platform adapters (YouTube, Spotify, SoundCloud, Deezer, File, etc.)
│   │   ├── sanitizer.ts        # Unicode NFKC & noise tag stripper (preserves non-Latin)
│   │   ├── matcher.ts          # Weighted scoring engine (Title / Artist / Album)
│   │   ├── ytmusic.ts          # SAPISIDHASH generator & YouTube Music API client
│   │   ├── applemusic.ts       # MusicKit Web client, catalog search & playlist creator
│   │   ├── stealth.ts          # Circuit breaker cooldown & rate limit guard
│   │   ├── platform-registry.ts# Multi-platform adapter registry & capabilities
│   │   └── lyric-validator.ts  # Lyric verification for disambiguation
│   ├── server/
│   │   ├── db.ts               # MySQL schema migrations, connection pooling & health checks
│   │   ├── auth-service.ts     # Scrypt authentication, session tokens & role management
│   │   ├── account-manager.ts  # Multi-account local connection and secrets manager
│   │   ├── merge-engine.ts     # Cross-account aggregation, deduplication & audit trail
│   │   ├── matcher-worker.ts   # Background matching engine & persistent draft store
│   │   └── index.ts            # REST API router & self-hosted server
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── NavigationRail.tsx         # Linear-style navigation (desktop rail & mobile bottom bar)
│   │   │   ├── landing/                   # High-craft animated landing page components
│   │   │   ├── auth/                      # Login, register, user profile & permissions dialogs
│   │   │   ├── views/
│   │   │   │   ├── OverviewView.tsx       # System health, metrics & quick start
│   │   │   │   ├── TransferStudioView.tsx # 1:1 Transfer & Multi-Source Merge Studio
│   │   │   │   ├── LibraryView.tsx        # Cross-account playlist explorer
│   │   │   │   ├── AccountsView.tsx       # Multi-account connection manager
│   │   │   │   ├── ActivityView.tsx       # Transfer audit trail
│   │   │   │   └── SettingsView.tsx       # Algorithm weights & connection settings
│   │   │   ├── AddAccountModal.tsx        # Multi-platform connection & import modal
│   │   │   ├── ReviewStudio.tsx           # Track matching review interface
│   │   │   ├── TrackRow.tsx               # Track comparison row with audio preview
│   │   │   ├── AlternativePickerModal.tsx # Interactive catalog search & alternative picker
│   │   │   ├── ExportModal.tsx            # Playlist export dialog
│   │   │   └── TransferProgressModal.tsx  # Live progress modal
│   │   └── App.tsx                        # Root layout orchestrator
│   └── shared/
│       ├── types.ts            # Shared domain types & multi-platform models
│       └── ipc.ts              # Electron IPC channel contracts
├── tests/                      # Vitest test suites
├── docker-compose.yml          # Container configuration (with-db profile for MySQL)
└── Dockerfile                  # Application container definition
```

---

## 🔒 Privacy & Security

- **Local Execution:** All API calls originate directly from your machine.
- **Zero Cloud Relay:** Account tokens, cookies, and local database entries never leave your computer.
- **Git Safety:** User session tokens, cookies, and `data/` caches are strictly `.gitignore`d and never committed.

---

## 📄 License

MIT License.
