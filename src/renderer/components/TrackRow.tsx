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
      className={`grid grid-cols-12 gap-3 p-3 rounded-lg border transition items-center ${
        excluded
          ? "bg-card/40 border-border/40 opacity-50"
          : "bg-card border-border hover:border-slate-600/70"
      }`}
    >
      {/* 1. Track Index & Exclude Checkbox (Cols 1) */}
      <div className="col-span-1 flex items-center space-x-2">
        <input
          type="checkbox"
          checked={!excluded}
          onChange={() => onToggleExclude(item)}
          title={excluded ? "Click to include in transfer" : "Click to exclude"}
          className="w-4 h-4 rounded bg-surface border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
        />
        <span className="text-[11px] font-mono text-slate-500 w-5 text-right">{index + 1}</span>
      </div>

      {/* 2. Source Track (YouTube Music) (Cols 5) */}
      <div className="col-span-4 flex items-center space-x-3 min-w-0">
        <div className="w-10 h-10 rounded bg-surface border border-border/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
              <span className="px-1 py-0.2 text-[9px] font-medium bg-red-500/10 text-red-300 border border-red-500/20 rounded">
                JP / Original
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

      {/* 3. Match Engine Verdict & Score (Cols 2) */}
      <div className="col-span-2 flex flex-col items-center justify-center text-center px-1">
        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center space-x-1 ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
        >
          <span>{badge.label}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 mt-1">
          {Math.round(match.totalScore * 100)}% match
        </span>
        {match.reason && (
          <span className="text-[9px] text-slate-500 truncate max-w-[140px]" title={match.reason}>
            {match.reason}
          </span>
        )}
      </div>

      {/* 4. Apple Music Target Candidate (Cols 5) */}
      <div className="col-span-5 flex items-center justify-between space-x-3 min-w-0 pl-2 border-l border-border/60">
        {selectedCandidate ? (
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative group/art w-10 h-10 rounded bg-surface border border-border/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-primary fill-primary" />
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
            <span className="truncate">No match in Apple Music catalog</span>
          </div>
        )}

        {/* Action: Swap Alternative Track */}
        <button
          onClick={() => onOpenAlternativePicker(item)}
          title="Search or pick an alternative song in Apple Music"
          className="p-1.5 rounded-md bg-surface hover:bg-card-hover border border-border text-slate-400 hover:text-slate-200 transition flex items-center gap-1 text-[11px]"
        >
          <Replace className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Swap</span>
        </button>
      </div>
    </div>
  );
};
