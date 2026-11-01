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
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center shadow-lg text-accent">
            <Disc3 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-text-primary tracking-tight">
              Pilih Playlist untuk Ditinjau
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Pilih playlist dari daftar untuk memulai pencocokan judul original non-Latin secara presisi ke platform tujuan.
            </p>
          </div>

          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden px-4 py-2 bg-accent text-background rounded-xl text-xs font-semibold flex items-center gap-2 btn-press shadow-sm"
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
      <div className="px-4 py-3 md:px-6 md:py-3.5 border-b border-border bg-surface/90 backdrop-blur-md flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Playlist Info */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg bg-surface-elevated border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
              {selectedPlaylist.thumbnailUrl ? (
                <img
                  src={selectedPlaylist.thumbnailUrl}
                  alt={selectedPlaylist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc3 className="w-5 h-5 text-text-secondary" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm md:text-base font-semibold text-text-primary tracking-tight truncate">
                  {selectedPlaylist.title}
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono uppercase bg-surface-elevated text-text-secondary rounded border border-border">
                  {sourcePlatform === "youtube" ? "YTM" : "Apple"} ➔ {targetPlatform === "youtube" ? "YTM" : "Apple"}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5 truncate">
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
              className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1.5 btn-press transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isMatching ? "animate-spin text-accent" : ""}`} />
              <span>Re-Match</span>
            </button>

            <button
              onClick={onStartTransfer}
              disabled={isTransferring || stats.activeForImport === 0}
              className="px-3.5 py-1.5 bg-accent text-background hover:bg-accent/90 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center gap-2 btn-press transition shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Transfer ({stats.activeForImport})</span>
            </button>
          </div>
        </div>

        {/* Matching In-Progress Banner */}
        {isMatching && (
          <div className="py-1.5 px-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
              <span className="text-text-primary text-[11px]">
                Mencocokkan lagu di latar belakang ({items.length}{totalTracksToMatch > 0 ? ` / ${totalTracksToMatch}` : ""} lagu)...
              </span>
            </div>
            <span className="text-[10px] font-mono text-accent hidden sm:inline">
              Otomatis tersimpan
            </span>
          </div>
        )}

        {/* Quiet, Single-Line Status Strip */}
        <div className="flex items-center space-x-4 text-xs text-text-secondary pt-0.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span className="text-text-primary font-medium tabular-nums">{stats.exact}</span>
            <span className="text-text-secondary">Cocok</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-status-warning" />
            <span className="text-text-primary font-medium tabular-nums">{stats.covers}</span>
            <span className="text-text-secondary">Cover / Alt</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-status-danger" />
            <span className="text-text-primary font-medium tabular-nums">{stats.unmatched}</span>
            <span className="text-text-secondary">Belum Ada</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0 ml-auto font-mono text-[11px] text-text-secondary">
            <span>Siap:</span>
            <span className="text-text-primary font-semibold tabular-nums">{stats.activeForImport}</span>
            <span>/</span>
            <span className="tabular-nums">{items.length}</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="px-4 md:px-6 py-2 border-b border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs flex-shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex-shrink-0 btn-press ${
              filter === "all"
                ? "bg-surface-elevated text-text-primary border border-border shadow-sm font-semibold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setFilter("exact")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex-shrink-0 btn-press ${
              filter === "exact"
                ? "bg-status-success/15 text-status-success border border-status-success/25 font-semibold"
                : "text-text-secondary hover:text-status-success"
            }`}
          >
            Cocok ({stats.exact})
          </button>
          <button
            onClick={() => setFilter("covers")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex-shrink-0 btn-press ${
              filter === "covers"
                ? "bg-status-warning/15 text-status-warning border border-status-warning/25 font-semibold"
                : "text-text-secondary hover:text-status-warning"
            }`}
          >
            Cover ({stats.covers})
          </button>
          <button
            onClick={() => setFilter("unmatched")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex-shrink-0 btn-press ${
              filter === "unmatched"
                ? "bg-status-danger/15 text-status-danger border border-status-danger/25 font-semibold"
                : "text-text-secondary hover:text-status-danger"
            }`}
          >
            Belum Ada ({stats.unmatched})
          </button>
        </div>

        {/* Search & Select All */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lagu / artis..."
              className="w-full pl-8 pr-7 py-1 bg-surface-elevated border border-border rounded-md text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 text-text-secondary hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-0.5 border-l border-border pl-2">
            <button
              onClick={() => handleToggleSelectAll(true)}
              title="Pilih semua lagu yang cocok"
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors btn-press"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleToggleSelectAll(false)}
              title="Batalkan pilihan semua lagu"
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors btn-press"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table Column Headers (Desktop Only) */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2 text-[10px] uppercase font-semibold tracking-wider text-text-secondary border-b border-border bg-surface/30 flex-shrink-0 items-center">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Lagu Sumber ({sourcePlatform === "youtube" ? "YouTube" : "Apple"})</div>
        <div className="col-span-2 text-center">Status Kecocokan</div>
        <div className="col-span-5 pl-3">Lagu Tujuan ({targetPlatform === "youtube" ? "YouTube" : "Apple"})</div>
      </div>

      {/* 4. Tracks Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-2 pb-24 md:pb-6">
        {isMatching && items.length === 0 ? (
          <div className="py-20 text-center text-xs text-text-secondary flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-accent animate-spin" />
            <div className="space-y-1">
              <p className="font-semibold text-text-primary text-sm">
                Mencocokkan lagu di latar belakang...
              </p>
              <p className="text-[11px] text-text-secondary max-w-sm">
                Lagu akan otomatis muncul satu per satu dan tersimpan ke draft lokal.
              </p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-secondary">
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

      {/* 5. Floating Bottom Bar on Mobile */}
      {selectedPlaylist && stats.activeForImport > 0 && (
        <div className="md:hidden fixed bottom-16 inset-x-3 z-30 pb-safe">
          <div className="bg-surface-elevated/95 border border-border backdrop-blur-xl p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="min-w-0 pl-1">
              <p className="text-[11px] font-medium text-text-primary truncate">
                {stats.activeForImport} lagu terpilih
              </p>
              <p className="text-[10px] text-text-secondary truncate">
                Ke {destinationName}
              </p>
            </div>

            <button
              onClick={onStartTransfer}
              disabled={isTransferring || stats.activeForImport === 0}
              className="px-4 py-2 bg-accent text-background rounded-xl text-xs font-semibold flex items-center gap-1.5 btn-press shadow-md flex-shrink-0"
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
