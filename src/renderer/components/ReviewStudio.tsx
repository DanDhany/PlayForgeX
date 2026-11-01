import React, { useState, useRef } from "react";
import {
  Sparkles,
  CheckCheck,
  ArrowRight,
  Disc3,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { TransferTrackItem, PlaylistSummary } from "../../shared/types";
import {
  FilterTab,
  filterReviewTracks,
  calculateMatchStats,
} from "../utils/ui-helpers";
import { TrackRow } from "./TrackRow";
import { VinylIllustration } from "./VinylIllustration";

interface ReviewStudioProps {
  selectedPlaylist: PlaylistSummary | null;
  items: TransferTrackItem[];
  isMatching: boolean;
  totalTracksToMatch?: number;
  isTransferring: boolean;
  onToggleExclude: (item: TransferTrackItem) => void;
  onOpenAlternativePicker: (item: TransferTrackItem) => void;
  onStartTransfer: () => void;
  onReMatch: () => void;
  onOpenMobileSidebar?: () => void;
  sourcePlatform?: "youtube" | "apple";
  targetPlatform?: "apple" | "youtube";
}

export const ReviewStudio: React.FC<ReviewStudioProps> = ({
  selectedPlaylist,
  items,
  isMatching,
  totalTracksToMatch = 0,
  isTransferring,
  onToggleExclude,
  onOpenAlternativePicker,
  onStartTransfer,
  onReMatch,
  onOpenMobileSidebar,
  sourcePlatform = "youtube",
  targetPlatform = "apple",
}) => {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stats = calculateMatchStats(items);

  const filteredItems = filterReviewTracks(items, filter).filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const sourceMatch =
      item.source.title.toLowerCase().includes(q) ||
      item.source.artist.toLowerCase().includes(q);
    const targetMatch =
      item.selectedCandidate?.name.toLowerCase().includes(q) ||
      item.selectedCandidate?.artistName.toLowerCase().includes(q);
    return sourceMatch || targetMatch;
  });

  const handleTogglePlayPreview = (previewUrl: string, trackId: string) => {
    if (playingPreviewId === trackId) {
      audioRef.current?.pause();
      setPlayingPreviewId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(previewUrl);
      audio.play();
      audio.onended = () => setPlayingPreviewId(null);
      audioRef.current = audio;
      setPlayingPreviewId(trackId);
    }
  };

  const handleToggleSelectAll = (select: boolean) => {
    items.forEach((item) => {
      if (item.selectedCandidate) {
        item.excluded = !select;
      }
    });
  };

  if (!selectedPlaylist) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center select-none overflow-y-auto">
        <div className="max-w-md w-full flex flex-col items-center space-y-6 animate-fade-in">
          <VinylIllustration className="w-44 h-44 md:w-56 md:h-56" />

          <div className="space-y-2">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Pilih Playlist untuk Mulai
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Pilih salah satu playlist dari menu di samping. MirrorSong akan mencocokkan judul original non-Latin (Jepang / Kanji) antar platform secara presisi.
            </p>
          </div>

          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/25 btn-press transition"
            >
              Lihat Daftar Playlist
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4.5rem)] bg-background select-none overflow-hidden relative">
      {/* 1. Playlist Header & Stats Banner */}
      <div className="p-4 md:p-5 border-b border-white/[0.08] bg-surface/80 backdrop-blur space-y-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-card border border-white/[0.1] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md">
              {selectedPlaylist.thumbnailUrl ? (
                <img
                  src={selectedPlaylist.thumbnailUrl}
                  alt={selectedPlaylist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc3 className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
                  {selectedPlaylist.title}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-white/[0.06] text-slate-300 rounded-md border border-white/[0.08]">
                  {items.length} tracks
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-mono uppercase bg-primary/10 text-primary border border-primary/20 rounded-md">
                  {sourcePlatform === "youtube" ? "YTM" : "Apple"} ➔ {targetPlatform === "youtube" ? "YTM" : "Apple"}
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Siap diekspor ke {targetPlatform === "youtube" ? "YouTube Music" : "Apple Music"}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2 self-end sm:self-auto w-full sm:w-auto">
            <button
              onClick={onReMatch}
              disabled={isMatching || isTransferring}
              title="Re-run matching search"
              className="flex-1 sm:flex-none px-3 py-2 bg-card hover:bg-card-hover border border-white/[0.08] rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 btn-press transition shadow-sm"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isMatching ? "animate-spin" : ""}`} />
              <span>Re-Match</span>
            </button>

            <button
              onClick={onStartTransfer}
              disabled={isTransferring || stats.activeForImport === 0}
              className="flex-1 sm:flex-none px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 btn-press transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Transfer ke {targetPlatform === "youtube" ? "YouTube" : "Apple"} ({stats.activeForImport})</span>
            </button>
          </div>
        </div>

        {/* Background Matching Progress Banner */}
        {isMatching && (
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-slate-200">
                Mencocokkan lagu di latar belakang ({items.length}{totalTracksToMatch > 0 ? ` / ${totalTracksToMatch}` : ""} lagu)...
              </span>
            </div>
            <span className="text-[11px] font-mono text-primary font-semibold hidden sm:inline">
              Tersimpan otomatis ke draft
            </span>
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-card/90 border border-white/[0.06] rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Exact Matches
              </span>
              <p className="text-base md:text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {stats.exact}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-card/90 border border-white/[0.06] rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Covers / Alt
              </span>
              <p className="text-base md:text-lg font-bold text-amber-400 font-mono mt-0.5">
                {stats.covers}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-card/90 border border-white/[0.06] rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Unmatched
              </span>
              <p className="text-base md:text-lg font-bold text-rose-400 font-mono mt-0.5">
                {stats.unmatched}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-card/90 border border-white/[0.06] rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Siap Ditransfer
              </span>
              <p className="text-base md:text-lg font-bold text-primary font-mono mt-0.5">
                {stats.activeForImport}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="px-4 md:px-5 py-2.5 border-b border-white/[0.08] bg-surface flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs flex-shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex-shrink-0 btn-press ${
              filter === "all"
                ? "bg-card-hover text-white border border-white/[0.15] shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setFilter("exact")}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex-shrink-0 btn-press ${
              filter === "exact"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            Exact ({stats.exact})
          </button>
          <button
            onClick={() => setFilter("covers")}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex-shrink-0 btn-press ${
              filter === "covers"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            Cover / Alt ({stats.covers})
          </button>
          <button
            onClick={() => setFilter("unmatched")}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex-shrink-0 btn-press ${
              filter === "unmatched"
                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            Unmatched ({stats.unmatched})
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lagu di playlist ini..."
            className="w-full bg-card/80 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/60 transition shadow-inner"
          />
        </div>
      </div>

      {/* 3. Table Column Headers (Desktop Only) */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-8 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/[0.06] bg-surface/40 flex-shrink-0 items-center">
        <div className="col-span-1 flex items-center space-x-1.5">
          <button
            onClick={() => handleToggleSelectAll(true)}
            title="Pilih semua"
            className="hover:text-white transition btn-press p-0.5"
          >
            <CheckSquare className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <button
            onClick={() => handleToggleSelectAll(false)}
            title="Batalkan semua"
            className="hover:text-white transition btn-press p-0.5"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <span>#</span>
        </div>
        <div className="col-span-4">Lagu Asal (YouTube Music)</div>
        <div className="col-span-2 text-center">Tingkat Kecocokan</div>
        <div className="col-span-5 pl-3">Hasil Pencocokan (Apple Music)</div>
      </div>

      {/* 4. Scrollable Tracks List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2.5 pb-20 md:pb-4">
        {isMatching && items.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-4">
            <VinylIllustration className="w-24 h-24" spinning={true} />
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">
                Mencocokkan lagu dengan prioritas judul original...
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Karakter Kanji / non-Latin diprioritaskan terlebih dahulu agar katalog terindeks akurat. Lagu akan muncul dan tersimpan ke draft secara otomatis.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            {isMatching ? "Sedang memproses lagu pertama..." : "Tidak ada lagu yang cocok dengan filter yang dipilih."}
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <TrackRow
              key={item.source.videoId || item.source.title + idx}
              item={item}
              index={idx}
              playingPreviewId={playingPreviewId}
              onTogglePlayPreview={handleTogglePlayPreview}
              onOpenAlternativePicker={onOpenAlternativePicker}
              onToggleExclude={onToggleExclude}
            />
          ))
        )}
      </div>

      {/* Floating Bottom Quick Action on Mobile */}
      {selectedPlaylist && stats.activeForImport > 0 && (
        <div className="md:hidden fixed bottom-4 inset-x-4 z-30">
          <button
            onClick={onStartTransfer}
            disabled={isTransferring || stats.activeForImport === 0}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl text-xs font-bold shadow-2xl shadow-primary/40 flex items-center justify-between btn-press transition"
          >
            <div className="flex items-center space-x-2">
              <CheckCheck className="w-4 h-4" />
              <span>Transfer ke {targetPlatform === "youtube" ? "YouTube Music" : "Apple Music"}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 font-mono text-[11px]">
              {stats.activeForImport} Lagu
            </span>
          </button>
        </div>
      )}
    </main>
  );
};
