import React, { useState, useRef } from "react";
import {
  Sparkles,
  CheckCheck,
  ArrowRight,
  Disc3,
  Search,
  Music2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
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
  isTransferring: boolean;
  onToggleExclude: (item: TransferTrackItem) => void;
  onOpenAlternativePicker: (item: TransferTrackItem) => void;
  onStartTransfer: () => void;
  onReMatch: () => void;
}

export const ReviewStudio: React.FC<ReviewStudioProps> = ({
  selectedPlaylist,
  items,
  isMatching,
  isTransferring,
  onToggleExclude,
  onOpenAlternativePicker,
  onStartTransfer,
  onReMatch,
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
      <main className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <Music2 className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-base font-semibold text-white">Select a Playlist to Begin</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          Choose a playlist from YouTube Music on the left sidebar. MirrorSong will inspect each track,
          prioritize original Kanji/non-Latin titles, and find matching songs on Apple Music.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-background select-none overflow-hidden">
      {/* 1. Playlist Header & Stats Banner */}
      <div className="p-5 border-b border-border bg-surface/80 backdrop-blur space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-card border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                <h2 className="text-sm font-bold text-white tracking-tight truncate">
                  {selectedPlaylist.title}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-border/60 text-slate-300 rounded border border-border">
                  {items.length} tracks
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: New Apple Music Library Playlist
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onReMatch}
              disabled={isMatching || isTransferring}
              title="Re-run matching search against Apple Music catalog"
              className="px-3 py-1.5 bg-card hover:bg-card-hover border border-border rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isMatching ? "animate-spin" : ""}`} />
              Re-Match
            </button>

            <button
              onClick={onStartTransfer}
              disabled={isMatching || isTransferring || stats.activeForImport === 0}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 disabled:border-transparent text-white rounded-lg text-xs font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 transition"
            >
              <ArrowRight className="w-4 h-4" />
              Import {stats.activeForImport} Tracks to Apple Music
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Exact Matches
              </span>
              <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">{stats.exact}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
          </div>

          <div className="bg-card border border-border rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Covers / Alternatives
              </span>
              <p className="text-base font-bold text-amber-400 font-mono mt-0.5">{stats.covers}</p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-400/60" />
          </div>

          <div className="bg-card border border-border rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Unmatched
              </span>
              <p className="text-base font-bold text-rose-400 font-mono mt-0.5">{stats.unmatched}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-400/60" />
          </div>

          <div className="bg-card border border-border rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Ready For Import
              </span>
              <p className="text-base font-bold text-primary font-mono mt-0.5">{stats.activeForImport}</p>
            </div>
            <CheckCheck className="w-5 h-5 text-primary/60" />
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="px-5 py-2.5 border-b border-border bg-surface flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-card-hover text-white border border-slate-600"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Tracks ({stats.total})
          </button>
          <button
            onClick={() => setFilter("exact")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === "exact"
                ? "bg-card-hover text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            Exact ({stats.exact})
          </button>
          <button
            onClick={() => setFilter("covers")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === "covers"
                ? "bg-card-hover text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            Covers / Alt ({stats.covers})
          </button>
          <button
            onClick={() => setFilter("unmatched")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === "unmatched"
                ? "bg-card-hover text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            Unmatched ({stats.unmatched})
          </button>
        </div>

        {/* Search within this playlist */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter songs or artists..."
            className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 transition"
          />
        </div>
      </div>

      {/* 3. Table Column Headers */}
      <div className="grid grid-cols-12 gap-3 px-8 py-2 text-[10px] uppercase font-semibold tracking-wider text-slate-500 border-b border-border bg-surface/40 flex-shrink-0 items-center">
        <div className="col-span-1 flex items-center space-x-1">
          <button
            onClick={() => handleToggleSelectAll(true)}
            title="Include all tracks"
            className="hover:text-white transition"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleSelectAll(false)}
            title="Exclude all tracks"
            className="hover:text-white transition"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <span>#</span>
        </div>
        <div className="col-span-4">Source Track (YouTube Music)</div>
        <div className="col-span-2 text-center">Match Confidence</div>
        <div className="col-span-5 pl-2">Target Track (Apple Music)</div>
      </div>

      {/* 4. Scrollable Tracks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isMatching ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
            <Disc3 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-medium text-slate-200">
              Matching songs with original-title priority in Apple Music...
            </p>
            <span className="text-[11px] text-slate-500 max-w-sm">
              Non-Latin Kanji/Kana titles are searched first to ensure accurate catalog resolution.
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">
            No tracks match the selected filter.
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
    </main>
  );
};
