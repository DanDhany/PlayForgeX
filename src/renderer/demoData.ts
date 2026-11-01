import { AccountConnection, PlaylistSummary, ActivityLogItem } from "../shared/types";

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
    id: "demo_ytm_pribadi",
    userId: "demo_admin",
    platform: "youtube",
    localAlias: "YouTube Pribadi (Indo Pop 2000s)",
    status: "connected",
    createdAt: Date.now() - 86400000 * 14,
    lastVerifiedAt: Date.now() - 3600000 * 12,
    playlistCount: 5,
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
];

export const DEMO_PLAYLISTS: (PlaylistSummary & {
  accountId: string;
  accountAlias: string;
  platform: "youtube" | "apple";
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
    id: "pl_indo_nostalgia",
    title: "Nostalgia Pop Indonesia 2000-an",
    trackCount: 45,
    platform: "youtube",
    accountId: "demo_ytm_pribadi",
    accountAlias: "YouTube Pribadi (Indo Pop 2000s)",
  },
  {
    id: "pl_roadtrip_vibes",
    title: "Weekend Roadtrip Mix",
    trackCount: 24,
    platform: "youtube",
    accountId: "demo_ytm_pribadi",
    accountAlias: "YouTube Pribadi (Indo Pop 2000s)",
  },
  {
    id: "pl_apple_carplay",
    title: "CarPlay Heavy Rotation",
    trackCount: 60,
    platform: "apple",
    accountId: "demo_apple_main",
    accountAlias: "Apple Music Utama",
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
