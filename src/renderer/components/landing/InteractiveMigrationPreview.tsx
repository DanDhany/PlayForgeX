import React, { useState, useMemo } from "react";
import {
  Check,
  Layers,
  Sparkles,
  Play,
  Pause,
  Disc3,
  ArrowRight,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface SampleTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  playlistId: "work" | "personal" | "friend";
  playlistNameEn: string;
  playlistNameId: string;
  album: string;
  color: string;
}

const SAMPLE_TRACKS: SampleTrack[] = [
  // Work Account
  {
    id: "w1",
    title: "Midnight City",
    artist: "M83",
    duration: "4:03",
    playlistId: "work",
    playlistNameEn: "Work Account",
    playlistNameId: "Akun Kantor",
    album: "Hurry Up, We're Dreaming",
    color: "#6366F1",
  },
  {
    id: "w2",
    title: "Weightless",
    artist: "Marconi Union",
    duration: "8:00",
    playlistId: "work",
    playlistNameEn: "Work Account",
    playlistNameId: "Akun Kantor",
    album: "Weightless (Ambient)",
    color: "#6366F1",
  },
  {
    id: "w3",
    title: "Resonance",
    artist: "HOME",
    duration: "3:32",
    playlistId: "work",
    playlistNameEn: "Work Account",
    playlistNameId: "Akun Kantor",
    album: "Odyssey",
    color: "#6366F1",
  },
  {
    id: "w4",
    title: "Daylight",
    artist: "David Kushner",
    duration: "3:32",
    playlistId: "work",
    playlistNameEn: "Work Account",
    playlistNameId: "Akun Kantor",
    album: "Daylight - Single",
    color: "#6366F1",
  },
  {
    id: "w5",
    title: "Intro",
    artist: "The xx",
    duration: "2:08",
    playlistId: "work",
    playlistNameEn: "Work Account",
    playlistNameId: "Akun Kantor",
    album: "xx",
    color: "#6366F1",
  },

  // Personal Account
  {
    id: "p1",
    title: "Dan...",
    artist: "Sheila On 7",
    duration: "4:47",
    playlistId: "personal",
    playlistNameEn: "Personal Account",
    playlistNameId: "Akun Pribadi",
    album: "Sheila on 7",
    color: "#FA2D48",
  },
  {
    id: "p2",
    title: "Hapus Aku",
    artist: "Nidji",
    duration: "4:18",
    playlistId: "personal",
    playlistNameEn: "Personal Account",
    playlistNameId: "Akun Pribadi",
    album: "Breakthru'",
    color: "#FA2D48",
  },
  {
    id: "p3",
    title: "Clocks",
    artist: "Coldplay",
    duration: "5:07",
    playlistId: "personal",
    playlistNameEn: "Personal Account",
    playlistNameId: "Akun Pribadi",
    album: "A Rush of Blood to the Head",
    color: "#FA2D48",
  },
  {
    id: "p4",
    title: "Daylight",
    artist: "David Kushner",
    duration: "3:32",
    playlistId: "personal",
    playlistNameEn: "Personal Account",
    playlistNameId: "Akun Pribadi",
    album: "Daylight - Single",
    color: "#FA2D48",
  },
  {
    id: "p5",
    title: "Sephia",
    artist: "Sheila On 7",
    duration: "4:15",
    playlistId: "personal",
    playlistNameEn: "Personal Account",
    playlistNameId: "Akun Pribadi",
    album: "Kisah Klasik Untuk Masa Depan",
    color: "#FA2D48",
  },

  // Friend's Playlist
  {
    id: "f1",
    title: "Midnight City",
    artist: "M83",
    duration: "4:03",
    playlistId: "friend",
    playlistNameEn: "Friend's Mix",
    playlistNameId: "Playlist Teman",
    album: "Hurry Up, We're Dreaming",
    color: "#10B981",
  },
  {
    id: "f2",
    title: "Clocks",
    artist: "Coldplay",
    duration: "5:07",
    playlistId: "friend",
    playlistNameEn: "Friend's Mix",
    playlistNameId: "Playlist Teman",
    album: "A Rush of Blood to the Head",
    color: "#10B981",
  },
  {
    id: "f3",
    title: "Weightless",
    artist: "Marconi Union",
    duration: "8:00",
    playlistId: "friend",
    playlistNameEn: "Friend's Mix",
    playlistNameId: "Playlist Teman",
    album: "Weightless (Ambient)",
    color: "#10B981",
  },
  {
    id: "f4",
    title: "As It Was",
    artist: "Harry Styles",
    duration: "2:47",
    playlistId: "friend",
    playlistNameEn: "Friend's Mix",
    playlistNameId: "Playlist Teman",
    album: "Harry's House",
    color: "#10B981",
  },
  {
    id: "f5",
    title: "Yellow",
    artist: "Coldplay",
    duration: "4:29",
    playlistId: "friend",
    playlistNameEn: "Friend's Mix",
    playlistNameId: "Playlist Teman",
    album: "Parachutes",
    color: "#10B981",
  },
];

interface PlaylistsConfig {
  id: "work" | "personal" | "friend";
  nameEn: string;
  nameId: string;
  sourceLabelEn: string;
  sourceLabelId: string;
  count: number;
  badgeColor: string;
}

const PLAYLISTS: PlaylistsConfig[] = [
  {
    id: "work",
    nameEn: "Work Account — Focus Beats",
    nameId: "Akun Kantor — Focus Beats",
    sourceLabelEn: "YouTube Music",
    sourceLabelId: "YouTube Music",
    count: 5,
    badgeColor: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
  },
  {
    id: "personal",
    nameEn: "Personal Account — Top 2000s Pop",
    nameId: "Akun Pribadi — Top 2000s Pop",
    sourceLabelEn: "YouTube Music",
    sourceLabelId: "YouTube Music",
    count: 5,
    badgeColor: "border-rose-500/30 text-rose-400 bg-rose-500/10",
  },
  {
    id: "friend",
    nameEn: "Friend's Shared Link — Roadtrip Mix",
    nameId: "Playlist Teman — Roadtrip Mix",
    sourceLabelEn: "YouTube Music (Link)",
    sourceLabelId: "YouTube Music (Tautan)",
    count: 5,
    badgeColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  },
];

interface MergedTrack {
  key: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  occurrences: number;
  sources: { id: string; name: string; color: string }[];
}

interface InteractiveMigrationPreviewProps {
  onOpenStudio?: () => void;
}

export const InteractiveMigrationPreview: React.FC<InteractiveMigrationPreviewProps> = ({
  onOpenStudio,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<"work" | "personal" | "friend">>(
    new Set(["work", "personal", "friend"])
  );
  const [targetPlatform, setTargetPlatform] = useState<"apple" | "staging">("apple");
  const [playingTrackKey, setPlayingTrackKey] = useState<string | null>(null);

  const togglePlaylist = (id: "work" | "personal" | "friend") => {
    setSelectedPlaylists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Compute merged deduplicated list
  const { totalRawTracks, mergedList, duplicateCount } = useMemo(() => {
    const rawList = SAMPLE_TRACKS.filter((t) => selectedPlaylists.has(t.playlistId));
    const totalRaw = rawList.length;

    const map = new Map<string, MergedTrack>();

    for (const track of rawList) {
      const key = `${track.title.toLowerCase()}:::${track.artist.toLowerCase()}`;
      const playlistName = isEn ? track.playlistNameEn : track.playlistNameId;
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          occurrences: 1,
          sources: [{ id: track.playlistId, name: playlistName, color: track.color }],
        });
      } else {
        const existing = map.get(key)!;
        existing.occurrences += 1;
        if (!existing.sources.some((s) => s.id === track.playlistId)) {
          existing.sources.push({ id: track.playlistId, name: playlistName, color: track.color });
        }
      }
    }

    const merged = Array.from(map.values());
    const dupes = totalRaw - merged.length;

    return {
      totalRawTracks: totalRaw,
      mergedList: merged,
      duplicateCount: Math.max(0, dupes),
    };
  }, [selectedPlaylists, isEn]);

  const handleTogglePlay = (key: string) => {
    setPlayingTrackKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="w-full bg-[#12141A]/95 border border-white/[0.08] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl backdrop-blur-2xl relative overflow-hidden text-left">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header controls & live simulator title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3 h-3" />
              {isEn ? "Interactive Simulation" : "Demo Interaktif"}
            </span>
            <span className="text-text-muted text-xs">
              • {isEn ? "Multi-Playlist Merge Engine" : "Uji Coba Multi-Playlist"}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
            {isEn
              ? "Select Source Playlists & Watch Duplicates Consolidate"
              : "Pilih Playlist Sumber & Saksikan Peleburan Duplikat"}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {isEn
              ? "Click any playlist above to add or remove song sources in real-time."
              : "Klik playlist untuk menambah atau mengurangi sumber lagu secara langsung."}
          </p>
        </div>

        {/* Target platform selector */}
        <div className="flex items-center gap-1.5 bg-[#1A1D25] p-1 rounded-xl border border-white/[0.06] self-start md:self-auto">
          <button
            onClick={() => setTargetPlatform("apple")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 btn-press ${
              targetPlatform === "apple"
                ? "bg-[#FA2D48] text-white shadow-md shadow-[#FA2D48]/20"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Apple Music</span>
          </button>
          <button
            onClick={() => setTargetPlatform("staging")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 btn-press ${
              targetPlatform === "staging"
                ? "bg-accent text-background font-semibold shadow-md shadow-accent/20"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Staging Review</span>
          </button>
        </div>
      </div>

      {/* Playlist Source Selection Badges */}
      <div className="pt-4 pb-5 relative z-10">
        <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2.5">
          {isEn ? "Source Playlists (Select at least 1):" : "Playlist Sumber (Pilih Minimal 1):"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PLAYLISTS.map((pl) => {
            const isSelected = selectedPlaylists.has(pl.id);
            const playlistTitle = isEn ? pl.nameEn : pl.nameId;
            const sourceLabel = isEn ? pl.sourceLabelEn : pl.sourceLabelId;
            return (
              <button
                key={pl.id}
                onClick={() => togglePlaylist(pl.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all btn-press ${
                  isSelected
                    ? "bg-[#1A1D25] border-accent/40 shadow-sm shadow-accent/5 ring-1 ring-accent/20"
                    : "bg-[#12141A]/60 border-white/[0.06] text-text-muted hover:border-white/[0.12] hover:bg-[#1A1D25]/40 opacity-60"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? "bg-accent" : "bg-text-muted"
                      }`}
                    />
                    <span className="text-[11px] font-mono text-text-muted">
                      {sourceLabel}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] font-medium text-text-primary truncate">
                    {playlistTitle}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-accent text-background"
                      : "border border-white/[0.15] text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Computation Badge Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 rounded-xl bg-[#0B0C0F]/80 border border-white/[0.06] mb-4 relative z-10">
        <div>
          <span className="text-[11px] text-text-muted block">
            {isEn ? "Total Tracks Selected" : "Total Lagu Dipilih"}
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-text-primary tabular-nums">
            {totalRawTracks}{" "}
            <span className="text-xs font-normal text-text-muted">{isEn ? "tracks" : "lagu"}</span>
          </span>
        </div>

        <div>
          <span className="text-[11px] text-text-muted block">
            {isEn ? "Unique Tracks Output" : "Hasil Lagu Unik"}
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-status-success tabular-nums">
            {mergedList.length}{" "}
            <span className="text-xs font-normal text-status-success/80">{isEn ? "unique" : "unik"}</span>
          </span>
        </div>

        <div>
          <span className="text-[11px] text-text-muted block">
            {isEn ? "Duplicates Merged" : "Duplikat Dilebur"}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${
                duplicateCount > 0 ? "text-amber-400" : "text-text-muted"
              }`}
            >
              {duplicateCount > 0 ? `+${duplicateCount}` : "0"}
            </span>
            {duplicateCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium border border-amber-500/30 hidden sm:inline-block">
                {isEn ? "Automated" : "Otomatis"}
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[11px] text-text-muted block">
            {isEn ? "Match Precision" : "Status Kecocokan"}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isEn ? "100% Verified" : "100% Siap"}</span>
          </div>
        </div>
      </div>

      {/* Track List Preview */}
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 relative z-10 scrollbar-thin">
        {mergedList.map((track) => {
          const isPlaying = playingTrackKey === track.key;
          const isMerged = track.occurrences > 1;

          return (
            <div
              key={track.key}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                isPlaying
                  ? "bg-accent/10 border-accent/40 shadow-sm"
                  : isMerged
                  ? "bg-[#1A1D25]/90 border-amber-500/25 hover:border-amber-500/40"
                  : "bg-[#1A1D25]/50 border-white/[0.04] hover:border-white/[0.1] hover:bg-[#1A1D25]"
              }`}
            >
              {/* Left Side: Play button + Artwork + Metadata */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => handleTogglePlay(track.key)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform btn-press ${
                    isPlaying
                      ? "bg-accent text-background scale-105"
                      : "bg-[#222630] text-text-secondary hover:text-text-primary hover:bg-[#2A2F3C]"
                  }`}
                  title={isPlaying ? (isEn ? "Pause Preview" : "Jeda Pratinjau") : (isEn ? "Play Audio Preview" : "Dengarkan Pratinjau Audio")}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                      {track.title}
                    </p>
                    {isPlaying && (
                      <span className="flex items-center gap-0.5 text-accent">
                        <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-accent rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-accent rounded-full animate-pulse delay-150" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-text-secondary truncate mt-0.5">
                    {track.artist} <span className="text-text-muted">• {track.album}</span>
                  </p>
                </div>
              </div>

              {/* Right Side: Status tags & duration */}
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {isMerged ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] sm:text-[11px] font-medium">
                    <Layers className="w-3 h-3" />
                    <span className="hidden sm:inline">{isEn ? "Duplicates Merged" : "Duplikat Digabung"}</span>
                    <span className="sm:hidden">{isEn ? "Merged" : "Digabung"}</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-text-muted text-[11px]">
                    {isEn ? "Single" : "Tunggal"}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="hidden md:inline">{isEn ? "Matched in Apple Music" : "Cocok di Apple Music"}</span>
                  <span className="md:hidden">{isEn ? "Matched" : "Cocok"}</span>
                </span>

                <span className="text-[11px] font-mono text-text-muted hidden sm:inline-block w-10 text-right">
                  {track.duration}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary relative z-10">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-accent" />
          <span>
            {duplicateCount > 0
              ? isEn
                ? `${duplicateCount} duplicate tracks automatically consolidated into 1 clean catalog recording.`
                : `${duplicateCount} lagu terduplikasi otomatis dilebur menjadi 1 trek bersih di Apple Music.`
              : isEn
              ? "All tracks from selected playlists are ready for seamless transfer."
              : "Semua lagu dari playlist terpilih siap ditransfer utuh."}
          </span>
        </div>

        {onOpenStudio && (
          <button
            onClick={onOpenStudio}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent text-background font-semibold text-xs transition-all hover:bg-accent-hover btn-press shadow-lg shadow-accent/20"
          >
            <span>{isEn ? "Open Studio & Migrate Now" : "Buka Studio & Transfer Sekarang"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
