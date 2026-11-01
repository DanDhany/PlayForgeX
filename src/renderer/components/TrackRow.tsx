import React from "react";
import { Play, Replace, X, Disc, Music, ArrowRight, Check } from "lucide-react";
import { TransferTrackItem } from "../../shared/types";
import { getStatusBadgeProps } from "../utils/ui-helpers";

interface TrackRowProps {
  item: TransferTrackItem;
  index: number;
  playingPreviewId: string | null;
  onTogglePlayPreview: (
    previewUrl: string,
    trackId: string,
    metadata?: { title: string; artist: string; artworkUrl?: string }
  ) => void;
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
      className={`rounded-xl border transition-colors duration-150 overflow-hidden ${
        excluded
          ? "bg-surface/30 border-border/40 opacity-40"
          : "bg-surface border-border hover:border-accent/30 hover:bg-surface-elevated shadow-sm"
      }`}
    >
      {/* ================= DESKTOP VIEW (md and up) ================= */}
      <div className="hidden md:grid grid-cols-12 gap-3 p-3 items-center">
        {/* Checkbox & Index */}
        <div className="col-span-1 flex items-center space-x-2">
          <button
            onClick={() => onToggleExclude(item)}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors btn-press ${
              !excluded
                ? "bg-accent border-accent text-background"
                : "border-border bg-surface-elevated text-transparent"
            }`}
            title={excluded ? "Sertakan lagu ini" : "Kecualikan lagu ini"}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>
          <span className="text-[11px] font-mono tabular-nums text-text-secondary w-5 text-right">
            {index + 1}
          </span>
        </div>

        {/* Source Track */}
        <div className="col-span-4 flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
            {source.thumbnailUrl ? (
              <img src={source.thumbnailUrl} alt={source.title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-4 h-4 text-text-secondary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-semibold text-text-primary truncate" title={source.title}>
                {sanitizedTitle.originalTitle}
              </h4>
              {sanitizedTitle.hasNonLatin && (
                <span className="px-1 py-0.2 text-[8px] font-mono uppercase bg-surface-elevated text-accent border border-accent/20 rounded">
                  JP
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary truncate mt-0.5">
              {source.artist || "Unknown Artist"}
              {source.album ? ` · ${source.album}` : ""}
            </p>
          </div>
        </div>

        {/* Match Engine Verdict */}
        <div className="col-span-2 flex flex-col items-center justify-center text-center px-1">
          <div
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border flex items-center space-x-1 ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
          >
            <span>{badge.label}</span>
            <span className="opacity-75 font-mono tabular-nums">
              {Math.round(match.totalScore * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {match.lyricsVerified && (
              <span className="px-1 py-0.2 text-[8px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded">
                ✓ Lirik
              </span>
            )}
            {selectedCandidate && match.artistScore < 0.45 && (
              <span className="px-1 py-0.2 text-[8px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 rounded">
                ⚠ Beda Artis
              </span>
            )}
          </div>
        </div>

        {/* Target Track */}
        <div className="col-span-5 flex items-center justify-between space-x-3 min-w-0 pl-3 border-l border-white/[0.06]">
          {selectedCandidate ? (
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Artwork with Preview Button */}
              <div className="relative group/art w-10 h-10 rounded-lg bg-surface border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
                {selectedCandidate.artworkUrl ? (
                  <img
                    src={selectedCandidate.artworkUrl}
                    alt={selectedCandidate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-4 h-4 text-slate-500" />
                )}

                {selectedCandidate.previewUrl && (
                  <button
                    onClick={() =>
                      onTogglePlayPreview(selectedCandidate.previewUrl!, selectedCandidate.id, {
                        title: selectedCandidate.name,
                        artist: selectedCandidate.artistName,
                        artworkUrl: selectedCandidate.artworkUrl || source.thumbnailUrl,
                      })
                    }
                    title={isPlaying ? "Jeda cuplikan lagu" : "Putar cuplikan 30s"}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity btn-press ${
                      isPlaying
                        ? "bg-black/75 opacity-100"
                        : "bg-black/60 opacity-0 group-hover/art:opacity-100"
                    }`}
                  >
                    {isPlaying ? (
                      <div className="flex items-end space-x-0.5 h-3.5">
                        <div className="w-1 bg-primary rounded-full animate-eq-1" />
                        <div className="w-1 bg-primary rounded-full animate-eq-2" />
                        <div className="w-1 bg-primary rounded-full animate-eq-3" />
                      </div>
                    ) : (
                      <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Title & Artist */}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-text-primary truncate" title={selectedCandidate.name}>
                  {selectedCandidate.name}
                </h4>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">
                  {selectedCandidate.artistName}
                  {selectedCandidate.albumName ? ` · ${selectedCandidate.albumName}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-status-danger flex-1">
              <X className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Lagu tidak ditemukan</span>
            </div>
          )}

          {/* Action: Swap Alternative */}
          <button
            onClick={() => onOpenAlternativePicker(item)}
            title="Cari alternatif lagu lain"
            className="px-2 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary btn-press transition flex items-center gap-1.5 text-[11px]"
          >
            <Replace className="w-3 h-3 text-text-secondary" />
            <span>Ganti</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE VIEW (< md) ================= */}
      {/* Sleek, Unified Music Row with minimal vertical footprint */}
      <div className="md:hidden p-3 flex items-center space-x-3">
        {/* Cover Art with Embedded Audio Preview Trigger */}
        <div className="relative group w-11 h-11 rounded-lg bg-surface-elevated border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
          {selectedCandidate?.artworkUrl || source.thumbnailUrl ? (
            <img
              src={selectedCandidate?.artworkUrl || source.thumbnailUrl}
              alt={source.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Disc className="w-4 h-4 text-text-secondary" />
          )}

          {selectedCandidate?.previewUrl && (
            <button
              onClick={() =>
                onTogglePlayPreview(selectedCandidate.previewUrl!, selectedCandidate.id, {
                  title: selectedCandidate.name,
                  artist: selectedCandidate.artistName,
                  artworkUrl: selectedCandidate.artworkUrl || source.thumbnailUrl,
                })
              }
              className={`absolute inset-0 flex items-center justify-center transition-colors ${
                isPlaying ? "bg-black/70" : "bg-black/40"
              }`}
            >
              {isPlaying ? (
                <div className="flex items-end space-x-0.5 h-3">
                  <div className="w-0.5 bg-accent rounded-full animate-eq-1" />
                  <div className="w-0.5 bg-accent rounded-full animate-eq-2" />
                  <div className="w-0.5 bg-accent rounded-full animate-eq-3" />
                </div>
              ) : (
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Track Info Center */}
        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Original Source Title */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono tabular-nums text-text-secondary">
              #{index + 1}
            </span>
            <h4 className="text-xs font-semibold text-text-primary truncate">
              {sanitizedTitle.originalTitle}
            </h4>
          </div>

          {/* Matched Target Subline */}
          {selectedCandidate ? (
            <div className="flex items-center space-x-1 text-[11px] text-text-secondary truncate">
              <ArrowRight className="w-2.5 h-2.5 text-text-secondary/70 flex-shrink-0" />
              <span className="text-text-primary truncate">{selectedCandidate.name}</span>
              <span className="text-text-secondary/70">·</span>
              <span className="truncate">{selectedCandidate.artistName}</span>
            </div>
          ) : (
            <p className="text-[11px] text-status-danger truncate">
              Belum ada lagu yang cocok
            </p>
          )}

          {/* Verdict Tags */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
              {badge.label} ({Math.round(match.totalScore * 100)}%)
            </span>
            {match.lyricsVerified && (
              <span className="px-1 py-0.2 text-[8px] font-medium bg-status-success/15 text-status-success border border-status-success/20 rounded">
                ✓ Lirik
              </span>
            )}
            {selectedCandidate && match.artistScore < 0.45 && (
              <span className="px-1 py-0.2 text-[8px] font-medium bg-status-warning/15 text-status-warning border border-status-warning/20 rounded">
                ⚠ Beda Artis
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Swap & Checkbox */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => onOpenAlternativePicker(item)}
            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary btn-press"
            title="Ganti alternatif lagu"
          >
            <Replace className="w-3.5 h-3.5 text-text-secondary" />
          </button>

          <button
            onClick={() => onToggleExclude(item)}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors btn-press ${
              !excluded
                ? "bg-accent border-accent text-background"
                : "border-border bg-surface-elevated text-transparent"
            }`}
            title={excluded ? "Sertakan lagu" : "Kecualikan lagu"}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
