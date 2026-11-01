export interface PlatformDisplayMeta {
  id: string;
  name: string;
  shortCode: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  dotColor: string;
  accentBg: string;
}

export const PLATFORM_REGISTRY_META: Record<string, PlatformDisplayMeta> = {
  youtube: {
    id: "youtube",
    name: "YouTube Music",
    shortCode: "YTM",
    badgeBg: "bg-red-500/15",
    badgeBorder: "border-red-500/25",
    textColor: "text-red-400",
    dotColor: "bg-red-500",
    accentBg: "bg-red-500",
  },
  youtube_video: {
    id: "youtube_video",
    name: "YouTube Video Playlists",
    shortCode: "YTV",
    badgeBg: "bg-rose-500/15",
    badgeBorder: "border-rose-500/25",
    textColor: "text-rose-400",
    dotColor: "bg-rose-500",
    accentBg: "bg-rose-500",
  },
  apple: {
    id: "apple",
    name: "Apple Music",
    shortCode: "Apple",
    badgeBg: "bg-pink-500/15",
    badgeBorder: "border-pink-500/25",
    textColor: "text-pink-400",
    dotColor: "bg-pink-500",
    accentBg: "bg-pink-500",
  },
  spotify: {
    id: "spotify",
    name: "Spotify",
    shortCode: "Spotify",
    badgeBg: "bg-emerald-500/15",
    badgeBorder: "border-emerald-500/25",
    textColor: "text-emerald-400",
    dotColor: "bg-emerald-500",
    accentBg: "bg-emerald-500",
  },
  soundcloud: {
    id: "soundcloud",
    name: "SoundCloud",
    shortCode: "SoundCloud",
    badgeBg: "bg-orange-500/15",
    badgeBorder: "border-orange-500/25",
    textColor: "text-orange-400",
    dotColor: "bg-orange-500",
    accentBg: "bg-orange-500",
  },
  deezer: {
    id: "deezer",
    name: "Deezer",
    shortCode: "Deezer",
    badgeBg: "bg-purple-500/15",
    badgeBorder: "border-purple-500/25",
    textColor: "text-purple-400",
    dotColor: "bg-purple-500",
    accentBg: "bg-purple-500",
  },
  file: {
    id: "file",
    name: "File / Ingestion",
    shortCode: "File",
    badgeBg: "bg-sky-500/15",
    badgeBorder: "border-sky-500/25",
    textColor: "text-sky-400",
    dotColor: "bg-sky-500",
    accentBg: "bg-sky-500",
  },
  tidal: {
    id: "tidal",
    name: "Tidal",
    shortCode: "Tidal",
    badgeBg: "bg-cyan-500/15",
    badgeBorder: "border-cyan-500/25",
    textColor: "text-cyan-400",
    dotColor: "bg-cyan-500",
    accentBg: "bg-cyan-500",
  },
  subsonic: {
    id: "subsonic",
    name: "Subsonic / Navidrome",
    shortCode: "Subsonic",
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-500/25",
    textColor: "text-amber-400",
    dotColor: "bg-amber-500",
    accentBg: "bg-amber-500",
  },
};

export function getPlatformMeta(platform?: string): PlatformDisplayMeta {
  if (!platform) {
    return {
      id: "unknown",
      name: "Music Service",
      shortCode: "Music",
      badgeBg: "bg-slate-500/15",
      badgeBorder: "border-slate-500/25",
      textColor: "text-slate-400",
      dotColor: "bg-slate-500",
      accentBg: "bg-slate-500",
    };
  }

  const p = platform.toLowerCase();
  if (PLATFORM_REGISTRY_META[p]) {
    return PLATFORM_REGISTRY_META[p];
  }

  // Fallback for custom or future platforms
  return {
    id: p,
    name: p.charAt(0).toUpperCase() + p.slice(1),
    shortCode: p.slice(0, 4).toUpperCase(),
    badgeBg: "bg-accent/15",
    badgeBorder: "border-accent/25",
    textColor: "text-accent",
    dotColor: "bg-accent",
    accentBg: "bg-accent",
  };
}
