import React, { useState, useRef } from "react";
import {
  ArrowRight,
  Disc3,
  Search,
  RotateCcw,
  RefreshCw,
  CheckSquare,
  Square,
  Loader2,
  X,
  ListMusic,
} from "lucide-react";
import { TransferTrackItem, PlaylistSummary } from "../../shared/types";
import {
  FilterTab,
  filterReviewTracks,
  calculateMatchStats,
} from "../utils/ui-helpers";
import { TrackRow } from "./TrackRow";

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
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center select-none overflow-y-auto bg-background">
        <div className="max-w-sm w-full flex flex-col items-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-card border border-white/[0.08] flex items-center justify-center shadow-lg">
            <Disc3 className="w-8 h-8 text-primary/80" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Pilih Playlist untuk Ditinjau
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih playlist dari daftar untuk memulai pencocokan judul original non-Latin (Kanji/Kana) secara presisi ke platform tujuan.
            </p>
          </div>

          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium flex items-center gap-2 btn-press shadow-sm"
            >
              <ListMusic className="w-4 h-4" />
              <span>Buka Daftar Playlist</span>
            </button>
          )}
        </div>
      </main>
    );
  }

  const destinationName = targetPlatform === "youtube" ? "YouTube Music" : "Apple Music";

  return (
    <main className="flex-1 flex flex-col h-[calc(100dvh-3.5rem)] bg-background select-none overflow-hidden relative">
      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 md:px-6 md:py-3.5 border-b border-white/[0.08] bg-surface/70 backdrop-blur-md flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Playlist Info */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg bg-card border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {selectedPlaylist.thumbnailUrl ? (
                <img
                  src={selectedPlaylist.thumbnailUrl}
                  alt={selectedPlaylist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc3 className="w-5 h-5 text-slate-500" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm md:text-base font-semibold text-white tracking-tight truncate">
                  {selectedPlaylist.title}
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono uppercase bg-white/[0.06] text-slate-300 rounded border border-white/[0.08]">
                  {sourcePlatform === "youtube" ? "YTM" : "Apple"} ➔ {targetPlatform === "youtube" ? "YTM" : "Apple"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {items.length} lagu · Ekspor ke {destinationName}
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={onReMatch}
              disabled={isMatching || isTransferring}
              title="Cari ulang semua kecocokan lagu"
              className="px-3 py-1.5 bg-card hover:bg-card-hover border border-white/[0.08] rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 btn-press transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isMatching ? "animate-spin" : ""}`} />
              <span>Re-Match</span>
            </button>

            <button
              onClick={onStartTransfer}
              disabled={isTransferring || stats.activeForImport === 0}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover disabled:bg-card disabled:text-slate-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 btn-press transition shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Transfer ({stats.activeForImport})</span>
            </button>
          </div>
        </div>

        {/* Matching In-Progress Banner */}
        {isMatching && (
          <div className="py-1.5 px-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-slate-200 text-[11px]">
                Mencocokkan lagu di latar belakang ({items.length}{totalTracksToMatch > 0 ? ` / ${totalTracksToMatch}` : ""} lagu)...
              </span>
            </div>
            <span className="text-[10px] font-mono text-primary/80 hidden sm:inline">
              Otomatis tersimpan
            </span>
          </div>
        )}

        {/* Quiet, Single-Line Status Strip (Replaces AI-slop 4 KPI cards) */}
        <div className="flex items-center space-x-4 text-xs text-slate-400 pt-0.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 font-medium tabular-nums">{stats.exact}</span>
            <span className="text-slate-400">Cocok</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300 font-medium tabular-nums">{stats.covers}</span>
            <span className="text-slate-400">Cover / Alt</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-slate-300 font-medium tabular-nums">{stats.unmatched}</span>
            <span className="text-slate-400">Belum Ada</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0 ml-auto font-mono text-[11px] text-slate-400">
            <span>Siap:</span>
            <span className="text-white font-semibold tabular-nums">{stats.activeForImport}</span>
            <span>/</span>
            <span className="tabular-nums">{items.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="px-4 md:px-6 py-2 border-b border-white/[0.08] bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs flex-shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition flex-shrink-0 btn-press ${
              filter === "all"
                ? "bg-white/[0.12] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setFilter("exact")}
            className={`px-2.5 py-1 rounded-md font-medium transition flex-shrink-0 btn-press ${
              filter === "exact"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            Cocok ({stats.exact})
          </button>
          <button
            onClick={() => setFilter("covers")}
            className={`px-2.5 py-1 rounded-md font-medium transition flex-shrink-0 btn-press ${
              filter === "covers"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            Cover ({stats.covers})
          </button>
          <button
            onClick={() => setFilter("unmatched")}
            className={`px-2.5 py-1 rounded-md font-medium transition flex-shrink-0 btn-press ${
              filter === "unmatched"
                ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            Belum Ada ({stats.unmatched})
          </button>
        </div>

        {/* Search & Select All */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lagu di playlist..."
              className="w-full bg-card border border-white/[0.08] rounded-md pl-7 pr-6 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-1 border-l border-white/[0.08] pl-2">
            <button
              onClick={() => handleToggleSelectAll(true)}
              title="Pilih semua lagu"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition btn-press"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleToggleSelectAll(false)}
              title="Batalkan pilihan semua lagu"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition btn-press"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table Column Headers (Desktop Only) */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2 text-[10px] uppercase font-semibold tracking-wider text-slate-400 border-b border-white/[0.06] bg-surface/30 flex-shrink-0 items-center">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Lagu Sumber ({sourcePlatform === "youtube" ? "YouTube" : "Apple"})</div>
        <div className="col-span-2 text-center">Status Kecocokan</div>
        <div className="col-span-5 pl-3">Lagu Tujuan ({targetPlatform === "youtube" ? "YouTube" : "Apple"})</div>
      </div>

      {/* 4. Tracks Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-2 pb-24 md:pb-6">
        {isMatching && items.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="font-semibold text-white text-sm">
                Mencocokkan lagu di latar belakang...
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Lagu akan otomatis muncul satu per satu dan tersimpan ke draft lokal.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            {isMatching ? "Sedang memproses lagu pertama..." : "Tidak ada lagu yang cocok dengan filter ini."}
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

      {/* 5. Floating Bottom Bar on Mobile (Ensures Transfer CTA is always accessible without scrolling up) */}
      {selectedPlaylist && stats.activeForImport > 0 && (
        <div className="md:hidden fixed bottom-3 inset-x-3 z-30 pb-safe">
          <div className="bg-surface-elevated/95 border border-white/[0.12] backdrop-blur-xl p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="min-w-0 pl-1">
              <p className="text-[11px] font-medium text-white truncate">
                {stats.activeForImport} lagu terpilih
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Ke {destinationName}
              </p>
            </div>

            <button
              onClick={onStartTransfer}
              disabled={isTransferring || stats.activeForImport === 0}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-card text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 btn-press shadow-md shadow-primary/20 flex-shrink-0"
            >
              <span>Transfer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
