import { AccountConnection, PlaylistSummary, ActivityLogItem, PlatformType } from "../shared/types";

export const IS_PAGES_OR_STATIC =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("github.io") ||
    window.location.hostname.includes("pages.dev") ||
    (window.location.protocol === "file:" && !window.location.port));

export const DEMO_ACCOUNTS: AccountConnection[] = [
  {
    id: "demo_ytm_kantor",
    userId: "demo_admin",
    platform: "youtube",
    localAlias: "YouTube Kantor (Lo-Fi & Work)",
    status: "connected",
    createdAt: Date.now() - 86400000 * 7,
    lastVerifiedAt: Date.now() - 3600000 * 4,
    playlistCount: 3,
  },
  {
    id: "demo_apple_main",
    userId: "demo_admin",
    platform: "apple",
    localAlias: "Apple Music Utama",
    status: "connected",
    createdAt: Date.now() - 86400000 * 2,
    lastVerifiedAt: Date.now() - 1800000,
    playlistCount: 8,
  },
  {
    id: "demo_spotify_daily",
    userId: "demo_admin",
    platform: "spotify",
    localAlias: "Spotify Liked & Discover",
    status: "connected",
    createdAt: Date.now() - 86400000 * 5,
    lastVerifiedAt: Date.now() - 3600000,
    playlistCount: 4,
  },
  {
    id: "demo_ytv_curated",
    userId: "demo_admin",
    platform: "youtube_video",
    localAlias: "YouTube Video Clips (MV & Live)",
    status: "connected",
    createdAt: Date.now() - 86400000 * 3,
    lastVerifiedAt: Date.now() - 7200000,
    playlistCount: 2,
  },
  {
    id: "demo_sc_mixes",
    userId: "demo_admin",
    platform: "soundcloud",
    localAlias: "SoundCloud Underground Sets",
    status: "connected",
    createdAt: Date.now() - 86400000 * 1,
    lastVerifiedAt: Date.now() - 10800000,
    playlistCount: 3,
  },
];

export const DEMO_PLAYLISTS: (PlaylistSummary & {
  accountId: string;
  accountAlias: string;
  platform: PlatformType | string;
})[] = [
  {
    id: "pl_focus_lofi",
    title: "Focus & Coding Session",
    trackCount: 32,
    platform: "youtube",
    accountId: "demo_ytm_kantor",
    accountAlias: "YouTube Kantor (Lo-Fi & Work)",
  },
  {
    id: "pl_apple_carplay",
    title: "CarPlay Heavy Rotation",
    trackCount: 60,
    platform: "apple",
    accountId: "demo_apple_main",
    accountAlias: "Apple Music Utama",
  },
  {
    id: "pl_spotify_hits",
    title: "Today's Top Hits & Pop",
    trackCount: 50,
    platform: "spotify",
    accountId: "demo_spotify_daily",
    accountAlias: "Spotify Liked & Discover",
  },
  {
    id: "pl_ytv_live",
    title: "Acoustic & Live Concert Videos",
    trackCount: 18,
    platform: "youtube_video",
    accountId: "demo_ytv_curated",
    accountAlias: "YouTube Video Clips (MV & Live)",
  },
  {
    id: "pl_sc_sunset",
    title: "Sunset Chillout DJ Mix",
    trackCount: 12,
    platform: "soundcloud",
    accountId: "demo_sc_mixes",
    accountAlias: "SoundCloud Underground Sets",
  },
];

export const DEMO_ACTIVITY: ActivityLogItem[] = [
  {
    id: "act_1",
    timestamp: Date.now() - 3600000 * 2,
    workflowName: "Migrasi Playlist Pribadi ke Apple Music",
    sourceAliases: ["YouTube Pribadi (Indo Pop 2000s)"],
    destinationAlias: "Apple Music Utama",
    destinationPlatform: "apple",
    totalTracks: 45,
    matchedCount: 42,
    successCount: 42,
    failedCount: 3,
    duplicatesRemoved: 4,
    status: "completed",
    details: "42 lagu berhasil dicocokkan dan ditambahkan ke Apple Music.",
  },
  {
    id: "act_2",
    timestamp: Date.now() - 86400000 * 2,
    workflowName: "Koneksi Akun Apple Music",
    sourceAliases: [],
    destinationAlias: "Apple Music Utama",
    destinationPlatform: "apple",
    totalTracks: 0,
    matchedCount: 0,
    successCount: 0,
    failedCount: 0,
    duplicatesRemoved: 0,
    status: "completed",
    details: "Koneksi Apple Music terverifikasi melalui token sesi web.",
  },
];
