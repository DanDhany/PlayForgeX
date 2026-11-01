# TuneBridge 🎵

> **Universal Music Library & Migration Hub**  
> Connect multiple streaming accounts, merge playlists with original-title precision, and manage your music library without third-party fees.

---

## 🌟 Highlights

1. **Multi-Account Music Library**
   - Connect multiple accounts from YouTube Music and Apple Music locally (for example: 3 YouTube accounts merged into a single Apple Music destination).
   - Merge playlists across accounts with variant-aware deduplication.
   - Credentials remain local on your machine with zero cloud relay.

2. **Smart Deduplication & Variant Protection**
   - Strips exact duplicate tracks across aggregated sources.
   - Detects and preserves intentional song variants: Live, Acoustic, Remix, and Instrumental versions.

3. **Original-Title-First Matching Engine**
   - Built to resolve cross-platform matching failures on non-Latin characters (Japanese Kanji, Hiragana, Katakana, Korean Hangul, Arabic).
   - Cleans video metadata noise tags (`[Official Video]`, `MV`, `【Official MV】`, `(Audio)`) while keeping original song titles intact for catalog search.

4. **Linear-Style Dark Interface**
   - Responsive layout designed for desktop and mobile screens.
   - Emil Kowalski micro-interactions and tactile feedback.
   - 6 functional modules: Overview, Transfer Studio, Library, Accounts, Activity Audit Log, Settings.

5. **Rate-Limit & Session Protection**
   - Built-in circuit breaker backoff upon receiving HTTP 429 status codes.
   - Natural request spacing to keep sessions healthy.

---

## 🗄️ Database Setup (MySQL)

TuneBridge supports MySQL for persistent caching, playlist storage, and migration logs. You can run MySQL either via Homebrew (recommended for local macOS development) or via Docker Compose.

### Option A: Homebrew MySQL (Default for Local macOS)

```bash
# Install and start MySQL
brew install mysql
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS tunebridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Default connection configuration (`.env` or environment variables):
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tunebridge
```

### Option B: Docker Compose with MySQL

If you prefer containerized services, run Docker Compose with the `with-db` profile:

```bash
# Launch TuneBridge and containerized MySQL
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
git clone https://github.com/your-username/TuneBridge.git
cd TuneBridge

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
TuneBridge
├── src/
│   ├── core/
│   │   ├── sanitizer.ts        # Unicode NFKC & noise tag stripper (preserves non-Latin)
│   │   ├── matcher.ts          # Weighted scoring engine (Title / Artist / Album)
│   │   ├── ytmusic.ts          # SAPISIDHASH generator & YouTube Music API client
│   │   ├── applemusic.ts       # MusicKit Web client, catalog search & playlist creator
│   │   ├── stealth.ts          # Circuit breaker cooldown & rate limit guard
│   │   └── lyric-validator.ts  # Lyric verification for disambiguation
│   ├── server/
│   │   ├── account-manager.ts  # Multi-account local connection and secrets manager
│   │   ├── merge-engine.ts     # Cross-account aggregation, deduplication & audit trail
│   │   ├── matcher-worker.ts   # Background matching engine & persistent draft store
│   │   └── index.ts            # REST API router & self-hosted server
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── NavigationRail.tsx         # Linear-style navigation (desktop rail & mobile bottom bar)
│   │   │   ├── views/
│   │   │   │   ├── OverviewView.tsx       # System health, metrics & quick start
│   │   │   │   ├── TransferStudioView.tsx # 1:1 Transfer & Multi-Source Merge Studio
│   │   │   │   ├── LibraryView.tsx        # Cross-account playlist explorer
│   │   │   │   ├── AccountsView.tsx       # Multi-account connection manager
│   │   │   │   ├── ActivityView.tsx       # Transfer audit trail
│   │   │   │   └── SettingsView.tsx       # Algorithm weights & connection settings
│   │   │   ├── AddAccountModal.tsx        # 1-Click bookmarklet & token input
│   │   │   ├── ReviewStudio.tsx           # Track matching review interface
│   │   │   ├── TrackRow.tsx               # Track comparison row with audio preview
│   │   │   ├── AlternativePickerModal.tsx # Interactive catalog search & alternative picker
│   │   │   ├── ExportModal.tsx            # Playlist export dialog
│   │   │   └── TransferProgressModal.tsx  # Live progress modal
│   │   └── App.tsx                        # Root layout orchestrator
│   └── shared/
│       ├── types.ts            # Shared domain types & multi-account models
│       └── ipc.ts              # Electron IPC channel contracts
├── tests/                      # Vitest test suites
├── docker-compose.yml          # Container configuration (with-db profile for MySQL)
└── Dockerfile                  # Application container definition
```

---

## 🔒 Privacy & Security

- **Local Execution:** All API calls originate directly from your machine to `music.youtube.com` and `amp-api.music.apple.com`.
- **No Cloud Relay:** Account tokens are saved in `data/secrets.json` and are never exposed outside your local environment.
- **Direct Service Communication:** No third-party proxy sits between your browser and the music services.

---

## 📄 License

MIT License.
