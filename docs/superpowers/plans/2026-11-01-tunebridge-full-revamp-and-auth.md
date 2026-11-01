# TuneBridge Full Rebrand, MySQL Database, User Auth, Landing Page & Multi-Platform Extensibility

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the project into TuneBridge by removing all legacy branding, implementing a persistent MySQL database with multi-user authentication (login/register), connecting by default to Homebrew MySQL on the host while providing a disabled-by-default persistent MySQL Docker service profile, migrating existing progress and state into the initial admin account, designing an Apple Music × Linear landing page, and introducing an extensible music platform adapter architecture (YouTube Music, Apple Music active; Spotify, Tidal, Deezer, SoundCloud, Navidrome extensible).

**Architecture:** A MySQL database layer (`src/server/db.ts`) powered by `mysql2/promise` with automatic schema migrations and password hashing (`node:crypto` scrypt). By default, the application connects to local Homebrew MySQL (`localhost` or `host.docker.internal`), with environment variable overrides (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). A persistent MySQL container service is configured in `docker-compose.yml` under an optional profile (`profiles: ["with-db"]`) with volume mount `./data/mysql:/var/lib/mysql`. Multi-user authentication isolates accounts and playlists, and startup migration attaches existing legacy data (`data/accounts.json`, `data/secrets.json`, snapshots) to the default admin user. A modular `MusicPlatformProvider` registry defines platform capabilities, while the frontend features an Apple Music × Linear landing page, interactive migration preview, and auth modal.

**Tech Stack:** TypeScript, React 18, Tailwind CSS, Vite, Express 5, Node 22, MySQL (`mysql2/promise`), `node:crypto`, Vitest, Docker Compose.

**Spec:** User specification for complete rebranding to TuneBridge, persistent MySQL database (Homebrew host connection with disabled Docker compose service), user registration & login, migration of existing state to admin, landing page, and all-platform extensibility.

## Global Constraints

- **Branding:** Completely remove all mentions of "MirrorSong", "mirrorsong", and "music2anywhere" across code, package configuration, Docker services, UI copy, and documentation. Use "TuneBridge" / "tunebridge".
- **Database Engine:** MySQL 8.x using `mysql2/promise`. Must connect to Homebrew MySQL on host (`localhost` / `host.docker.internal`) by default.
- **Docker Compose MySQL Service:** Include a persistent MySQL service with volume `./data/mysql:/var/lib/mysql` under `profiles: ["with-db"]` so it remains disabled by default for the user's host MySQL setup, but is easily enabled for standalone deployments.
- **Data Continuity:** Existing local connections (`acc_ytm_primary`, `acc_apple_primary`, snapshots, drafts) must automatically migrate to the default admin account in MySQL on first boot.
- **UI/UX Craft Standards:** Adhere strictly to the Apple Music × Linear design system (`#0B0C0F` background, `#12141A` surface, `#A99BFF` accent, `#69D6AF` success). No generic AI-slop layout (no generic 3-card rows with identical icons, no cliché marketing copy).
- **TDD:** Write unit and integration tests for database schema, auth service, migration, and platform provider registry before/alongside implementation.

## Review Focus

1. **MySQL connection resilience & reconnection:** Connection pool should handle transient restarts or connection loss gracefully.
2. **Backward-compatible unauthenticated API protection:** Existing API endpoints must resolve the authenticated user, or fall back to the default admin user if running in single-user local mode.
3. **Password hashing security:** Scrypt parameters must provide sufficient work factor (N=16384, r=8, p=1) with cryptographically random salt per user.
4. **Landing page responsiveness on mobile:** Viewports from 375px (iPhone mini) to 1440px desktop must render without horizontal overflow.
5. **Platform provider pluggability:** Calling provider registry for planned platforms (Spotify, Tidal) must return clean metadata and capabilities without throwing uncaught exceptions.

---

### Task 1: Complete Branding Purge & Rebrand to TuneBridge

**Files:**
- Modify: `package.json`
- Modify: `docker-compose.yml`
- Modify: `Dockerfile`
- Modify: `index.html`
- Modify: `README.md`
- Modify: `src/server/index.ts`
- Modify: `src/renderer/components/Header.tsx`
- Modify: `src/renderer/components/NavigationRail.tsx`

**Interfaces:**
- Package name: `tunebridge` (was `mirrorsong`)
- Container name: `tunebridge-app` (was `music2anywhere-app`)
- Image name: `tunebridge-app` (was `mirrorsong-app`)
- Window / HTML Title: `TuneBridge — Universal Music Library & Migration Hub`

- [ ] **Step 1: Write verification test for package and branding metadata in `tests/branding.test.ts`**
- [ ] **Step 2: Update `package.json`, `docker-compose.yml`, `Dockerfile`, and `index.html`**
- [ ] **Step 3: Update `docker-compose.yml` with disabled-by-default MySQL service (`profiles: ["with-db"]`) and volume `./data/mysql:/var/lib/mysql`**
- [ ] **Step 4: Update `README.md` with TuneBridge branding, MySQL configuration docs, and multi-account architecture**
- [ ] **Step 5: Update UI headers and text across navigation components**
- [ ] **Step 6: Run tests and verify build**
- [ ] **Step 7: Commit branding changes**

```bash
git add package.json docker-compose.yml Dockerfile index.html README.md src/ tests/
git commit -m "chore(branding): rename all services and repository references to TuneBridge"
```

---

### Task 2: MySQL Database Schema, Connection Pool & User Authentication Engine

**Files:**
- Create: `src/server/db.ts`
- Create: `src/server/auth-service.ts`
- Modify: `src/server/account-manager.ts`
- Create: `tests/auth-db.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface User {
    id: string;
    username: string;
    role: "admin" | "user";
    createdAt: number;
    lastLoginAt?: number;
  }

  export class AuthService {
    register(username: string, password: string, role?: "admin" | "user"): Promise<User>;
    login(username: string, password: string): Promise<{ user: User; token: string }>;
    verifyToken(token: string): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    listUsers(): Promise<User[]>;
  }

  export class DatabaseManager {
    init(): Promise<void>;
    migrateLegacyJsonToAdmin(adminId: string, legacyAccounts: any[], legacySecrets: any[]): Promise<void>;
  }
  ```

- [ ] **Step 1: Write integration tests in `tests/auth-db.test.ts` testing MySQL table creation, user registration, scrypt password verification, and legacy state migration**
- [ ] **Step 2: Implement MySQL connection pool and table migration in `src/server/db.ts` using `mysql2/promise`**
  - Tables: `users`, `sessions`, `accounts`, `account_secrets`, `snapshots`, `activity_logs`.
- [ ] **Step 3: Implement `AuthService` in `src/server/auth-service.ts` using `node:crypto` scrypt hashing and session tokens**
- [ ] **Step 4: Implement automatic seed of default `admin` account and migration of existing `data/accounts.json` and `data/secrets.json` into MySQL**
- [ ] **Step 5: Run unit/integration tests to verify database operations and authentication pass**
- [ ] **Step 6: Commit database and auth engine**

```bash
git add src/server/db.ts src/server/auth-service.ts tests/auth-db.test.ts
git commit -m "feat(auth): implement MySQL persistence and user authentication service"
```

---

### Task 3: Multi-Platform Music Provider Extensibility Architecture

**Files:**
- Create: `src/core/platform-registry.ts`
- Create: `src/core/adapters/types.ts`
- Create: `src/core/adapters/youtube-adapter.ts`
- Create: `src/core/adapters/apple-adapter.ts`
- Create: `src/core/adapters/spotify-adapter.ts`
- Create: `src/core/adapters/tidal-adapter.ts`
- Create: `src/core/adapters/deezer-adapter.ts`
- Create: `src/core/adapters/subsonic-adapter.ts`
- Create: `tests/platform-registry.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type PlatformId = "youtube" | "apple" | "spotify" | "tidal" | "deezer" | "soundcloud" | "subsonic" | "navidrome";
  export type PlatformStatus = "active" | "experimental" | "planned";

  export interface PlatformCapabilities {
    canReadPlaylists: boolean;
    canReadTracks: boolean;
    canCreatePlaylists: boolean;
    canAddTracks: boolean;
    searchCatalog: boolean;
    supportsMobileSync: boolean;
  }

  export interface PlatformProvider {
    id: PlatformId;
    name: string;
    brandColor: string;
    status: PlatformStatus;
    capabilities: PlatformCapabilities;
    authDescription: string;
    getAuthMethod(): "cookie" | "token" | "oauth" | "basic";
  }

  export class PlatformRegistry {
    static get(id: PlatformId): PlatformProvider | undefined;
    static list(): PlatformProvider[];
    static listActive(): PlatformProvider[];
  }
  ```

- [ ] **Step 1: Write unit tests in `tests/platform-registry.test.ts` testing platform discovery, capabilities query, active vs planned listing**
- [ ] **Step 2: Implement platform provider interfaces and registry in `src/core/platform-registry.ts`**
- [ ] **Step 3: Implement active adapters for YouTube Music and Apple Music wrapping existing client cores**
- [ ] **Step 4: Implement extensible adapter stubs for Spotify, Tidal, Deezer, SoundCloud, and Subsonic/Navidrome**
- [ ] **Step 5: Run tests and verify all platform adapters load correctly**
- [ ] **Step 6: Commit platform extensibility layer**

```bash
git add src/core/platform-registry.ts src/core/adapters/ tests/platform-registry.test.ts
git commit -m "feat(core): introduce extensible multi-platform provider registry and adapters"
```

---

### Task 4: High-Craft Editorial Landing Page for TuneBridge

**Files:**
- Create: `src/renderer/components/landing/LandingPage.tsx`
- Create: `src/renderer/components/landing/HeroSection.tsx`
- Create: `src/renderer/components/landing/InteractiveMigrationPreview.tsx`
- Create: `src/renderer/components/landing/PlatformMatrixSection.tsx`
- Create: `src/renderer/components/landing/FeaturesSection.tsx`
- Create: `src/renderer/components/landing/LandingFooter.tsx`
- Modify: `src/renderer/App.tsx`

**Design Principles:**
- Apple Music × Linear aesthetic: rich dark palette, crisp sans-serif typography, subtle borders, high contrast.
- Humanized copywriting: No AI clichés ("unleash", "streamline", "seamlessly", "elevate"). Honest, direct, and technical clarity.
- Live interactive migration simulator showing real-time source deduplication (Orang A + B + C -> Carplay / Apple Music).
- Platform availability matrix highlighting Active (YouTube Music, Apple Music) and Extensible (Spotify, Tidal, Deezer, Subsonic).
- Self-hosted privacy guarantees (Local-first, zero cloud tracking, direct client connection).

- [ ] **Step 1: Build `InteractiveMigrationPreview.tsx` showing interactive multi-source merge demo**
- [ ] **Step 2: Build `HeroSection.tsx` with bold typography, call-to-action buttons ("Buka Studio" / "Mulai Sekarang"), and live preview**
- [ ] **Step 3: Build `PlatformMatrixSection.tsx` showing supported services and roadmap**
- [ ] **Step 4: Build `FeaturesSection.tsx` highlighting local privacy, deduplication engine, and smart mobile sync**
- [ ] **Step 5: Integrate `LandingPage.tsx` into `App.tsx` with a top header toggle ("Studio" vs "Tentang TuneBridge") and guest mode**
- [ ] **Step 6: Verify responsive rendering across mobile (393px) and desktop**
- [ ] **Step 7: Commit landing page components**

```bash
git add src/renderer/components/landing/ src/renderer/App.tsx
git commit -m "feat(ui): create high-craft Apple Music × Linear landing page for TuneBridge"
```

---

### Task 5: Authentication UI & User Management (Login / Register / Profile)

**Files:**
- Create: `src/renderer/components/auth/AuthModal.tsx`
- Create: `src/renderer/components/auth/UserProfileMenu.tsx`
- Modify: `src/renderer/components/Header.tsx`
- Modify: `src/renderer/components/NavigationRail.tsx`
- Modify: `src/server/index.ts`

**Interfaces:**
- API Endpoints:
  - `POST /api/auth/register` -> `{ success: true, user, token }`
  - `POST /api/auth/login` -> `{ success: true, user, token }`
  - `GET /api/auth/me` -> `{ user }`
  - `POST /api/auth/user-logout` -> `{ success: true }`
- Header Profile Pill:
  - Displays user avatar / initials, role badge (`Admin`), and dropdown with "Keluar (Logout)" and "Switch User".

- [ ] **Step 1: Write integration tests for register, login, session verify endpoints in `tests/auth-endpoints.test.ts`**
- [ ] **Step 2: Implement `/api/auth/register`, `/api/auth/login`, and `/api/auth/me` in `src/server/index.ts`**
- [ ] **Step 3: Build `AuthModal.tsx` with Tab switcher ("Masuk" / "Daftar Akun Baru"), field validation, and error states**
- [ ] **Step 4: Build `UserProfileMenu.tsx` and integrate into `Header.tsx` and mobile `NavigationRail.tsx`**
- [ ] **Step 5: Verify seamless login/logout state transition in the frontend**
- [ ] **Step 6: Commit auth UI and endpoints**

```bash
git add src/renderer/components/auth/ src/server/index.ts tests/auth-endpoints.test.ts
git commit -m "feat(auth): add login/register modal, user session persistence, and profile menu"
```

---

### Task 6: End-to-End Verification, Docker Deployment & Documentation

**Files:**
- Modify: `docker-compose.yml`
- Modify: `Dockerfile`
- Modify: `README.md`
- Test: Full Vitest suite (`npm test`)

- [ ] **Step 1: Run full test suite (`npm test`) across all test files**
- [ ] **Step 2: Run production TypeScript and Vite compilation (`npm run build`)**
- [ ] **Step 3: Rebuild and test Docker container with `docker compose build --no-cache && docker compose up -d`**
- [ ] **Step 4: Verify that legacy data is intact in the admin account upon startup**
- [ ] **Step 5: Verify that the landing page and authentication modal render responsively**
- [ ] **Step 6: Final git commit and push to branch `revamp`**

```bash
git add -A
git commit -m "feat: complete TuneBridge rebrand, MySQL database, user auth, landing page, and multi-platform architecture"
git push origin revamp
```
