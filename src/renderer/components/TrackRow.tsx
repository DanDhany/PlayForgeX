import React from "react";
import { Play, Pause, Replace, X, Disc, Music } from "lucide-react";
import { TransferTrackItem } from "../../shared/types";
import { getStatusBadgeProps } from "../utils/ui-helpers";

interface TrackRowProps {
  item: TransferTrackItem;
  index: number;
  playingPreviewId: string | null;
  onTogglePlayPreview: (previewUrl: string, trackId: string) => void;
  onOpenAlternativePicker: (item: TransferTrackItem) => void;
  onToggleExclude: (item: TransferTrackItem) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  item,
  index,
  playingPreviewId,
  onTogglePlayPreview,
  onOpenAlternativePicker,
  onToggleExclude,
}) => {
  const { source, sanitizedTitle, match, selectedCandidate, excluded } = item;
  const badge = getStatusBadgeProps(match.status);
  const isPlaying = selectedCandidate?.id && playingPreviewId === selectedCandidate.id;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        excluded
          ? "bg-card/40 border-white/[0.04] opacity-50"
          : "bg-card/90 border-white/[0.08] hover:border-slate-500/50 shadow-sm"
      }`}
    >
      {/* ================= DESKTOP VIEW (md and up) ================= */}
      <div className="hidden md:grid grid-cols-12 gap-3 p-3.5 items-center">
        {/* 1. Track Index & Exclude Checkbox */}
        <div className="col-span-1 flex items-center space-x-2">
          <input
            type="checkbox"
            checked={!excluded}
            onChange={() => onToggleExclude(item)}
            title={excluded ? "Click to include in transfer" : "Click to exclude"}
            className="w-4 h-4 rounded bg-surface border-white/20 text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-400 w-5 text-right">{index + 1}</span>
        </div>

        {/* 2. Source Track (YouTube Music) */}
        <div className="col-span-4 flex items-center space-x-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-surface border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
            {source.thumbnailUrl ? (
              <img src={source.thumbnailUrl} alt={source.title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-semibold text-slate-100 truncate" title={source.title}>
                {sanitizedTitle.originalTitle}
              </h4>
              {sanitizedTitle.hasNonLatin && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-medium bg-red-500/15 text-red-300 border border-red-500/30 rounded-md">
                  Original JP
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 truncate mt-0.5">
              <span className="truncate">{source.artist || "Unknown Artist"}</span>
              {source.album && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="truncate text-slate-500">{source.album}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Match Engine Verdict & Score */}
        <div className="col-span-2 flex flex-col items-center justify-center text-center px-1">
          <div
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center space-x-1 shadow-sm ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
          >
            <span>{badge.label}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
            <span className="text-[10px] font-mono text-slate-300 font-medium">
              {Math.round(match.totalScore * 100)}%
            </span>
            {match.lyricsVerified && (
              <span className="px-1 py-0.2 text-[8px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                ✓ Lirik
              </span>
            )}
            {selectedCandidate && match.artistScore < 0.45 && (
              <span className="px-1 py-0.2 text-[8px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                ⚠ Beda Artis
              </span>
            )}
          </div>
          {match.reason && (
            <span className="text-[9px] text-slate-500 truncate max-w-[140px] mt-0.5" title={match.reason}>
              {match.reason}
            </span>
          )}
        </div>

        {/* 4. Target Track (Apple Music) */}
        <div className="col-span-5 flex items-center justify-between space-x-3 min-w-0 pl-3 border-l border-white/[0.08]">
          {selectedCandidate ? (
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="relative group/art w-11 h-11 rounded-xl bg-surface border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                {selectedCandidate.artworkUrl ? (
                  <img
                    src={selectedCandidate.artworkUrl}
                    alt={selectedCandidate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-4 h-4 text-slate-600" />
                )}

                {/* Audio Preview Overlay Button */}
                {selectedCandidate.previewUrl && (
                  <button
                    onClick={() => onTogglePlayPreview(selectedCandidate.previewUrl!, selectedCandidate.id)}
                    title={isPlaying ? "Pause audio preview" : "Play 30s preview"}
                    className={`absolute inset-0 flex items-center justify-center transition-all ${
                      isPlaying
                        ? "bg-black/70 opacity-100"
                        : "bg-black/60 opacity-0 group-hover/art:opacity-100"
                    }`}
                  >
                    {isPlaying ? (
                      <div className="flex items-end space-x-0.5 h-4">
                        <div className="w-1 bg-primary rounded-full animate-eq-1" />
                        <div className="w-1 bg-primary rounded-full animate-eq-2" />
                        <div className="w-1 bg-primary rounded-full animate-eq-3" />
                      </div>
                    ) : (
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    )}
                  </button>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-slate-100 truncate" title={selectedCandidate.name}>
                  {selectedCandidate.name}
                </h4>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 truncate mt-0.5">
                  <span className="truncate">{selectedCandidate.artistName}</span>
                  {selectedCandidate.albumName && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="truncate text-slate-500">{selectedCandidate.albumName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-rose-400 flex-1">
              <X className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">No catalog match found</span>
            </div>
          )}

          {/* Action: Swap Alternative Track */}
          <button
            onClick={() => onOpenAlternativePicker(item)}
            title="Search or swap an alternative song in Apple Music"
            className="p-2 rounded-xl bg-card hover:bg-card-hover border border-white/[0.08] text-slate-300 hover:text-white btn-press transition flex items-center gap-1.5 text-[11px] shadow-sm"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE VIEW (< md) ================= */}
      <div className="md:hidden p-3.5 space-y-3">
        {/* Mobile Header: Index, Status Badge, Checkbox, Swap Button */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!excluded}
              onChange={() => onToggleExclude(item)}
              className="w-4 h-4 rounded bg-surface border-white/20 text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-400 font-semibold">#{index + 1}</span>
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center space-x-1 ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
            >
              <span>{badge.label}</span>
              <span className="text-[9px] opacity-80">({Math.round(match.totalScore * 100)}%)</span>
            </div>
            {match.lyricsVerified && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                ✓ Lirik
              </span>
            )}
            {selectedCandidate && match.artistScore < 0.45 && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                ⚠ Beda Artis
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenAlternativePicker(item)}
            className="px-2.5 py-1 rounded-lg bg-card-hover border border-white/[0.08] text-slate-300 hover:text-white btn-press transition flex items-center gap-1 text-[11px]"
          >
            <Replace className="w-3 h-3 text-primary" />
            <span>Ganti</span>
          </button>
        </div>

        {/* Mobile Content: Side by side or Stacked */}
        <div className="space-y-2">
          {/* Source YTM Track */}
          <div className="flex items-center space-x-2.5 bg-surface/60 rounded-xl p-2 border border-white/[0.04]">
            <div className="w-10 h-10 rounded-lg bg-card border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {source.thumbnailUrl ? (
                <img src={source.thumbnailUrl} alt={source.title} className="w-full h-full object-cover" />
              ) : (
                <Music className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-red-500/10 text-red-400 rounded">YTM</span>
                <h4 className="text-xs font-semibold text-white truncate">{sanitizedTitle.originalTitle}</h4>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{source.artist}</p>
            </div>
          </div>

          {/* Target Apple Music Track */}
          {selectedCandidate ? (
            <div className="flex items-center space-x-2.5 bg-primary/5 rounded-xl p-2 border border-primary/20">
              <div className="relative w-10 h-10 rounded-lg bg-card border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
                {selectedCandidate.artworkUrl ? (
                  <img src={selectedCandidate.artworkUrl} alt={selectedCandidate.name} className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-4 h-4 text-slate-600" />
                )}

                {selectedCandidate.previewUrl && (
                  <button
                    onClick={() => onTogglePlayPreview(selectedCandidate.previewUrl!, selectedCandidate.id)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-primary fill-primary" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                    )}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-primary/20 text-rose-300 rounded">Apple</span>
                  <h4 className="text-xs font-semibold text-white truncate">{selectedCandidate.name}</h4>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{selectedCandidate.artistName}</p>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>Tidak ditemukan lagu cocok di Apple Music</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
