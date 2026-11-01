import React, { useRef } from "react";
import {
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  Disc,
} from "lucide-react";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import { formatSeconds } from "../utils/ui-helpers";

export const MusicPlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    stop,
  } = useAudioPlayer();

  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSeek = (clientX: number) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSeek(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      handleSeek(e.touches[0].clientX);
    }
  };

  return (
    <div className="fixed bottom-[calc(78px+env(safe-area-inset-bottom,0px))] md:bottom-5 inset-x-2.5 sm:inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-50 animate-sheet-up md:animate-dialog-in">
      <div className="bg-surface/95 border border-white/10 backdrop-blur-2xl shadow-2xl rounded-2xl p-2.5 md:p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 select-none">
        {/* Mobile Top Row / Desktop Left Side: Artwork + Metadata + Actions */}
        <div className="flex items-center justify-between gap-2.5 min-w-0 md:flex-1">
          {/* Artwork & Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated border border-border shadow-inner">
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isPlaying ? "scale-105" : "scale-100"
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                  <Disc className={`w-5 h-5 ${isPlaying ? "animate-spin text-accent" : ""}`} />
                </div>
              )}

              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  <span className="w-0.5 bg-accent rounded-full animate-eq-1" />
                  <span className="w-0.5 bg-accent rounded-full animate-eq-2" />
                  <span className="w-0.5 bg-accent rounded-full animate-eq-3" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-text-primary truncate leading-snug">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-text-secondary truncate leading-snug">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Play/Pause Button */}
            <button
              onClick={() => togglePlay()}
              className="w-8 h-8 rounded-full bg-accent text-background flex items-center justify-center shadow-md btn-press hover:scale-105 active:scale-95 transition-transform"
              title={isPlaying ? "Jeda (Pause)" : "Putar (Play)"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-background" />
              ) : (
                <Play className="w-4 h-4 fill-background ml-0.5" />
              )}
            </button>

            {/* Desktop Volume Slider */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg transition-colors btn-press"
                title={isMuted ? "Bunyikan" : "Bisukan"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-status-danger" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-14 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-accent"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>

            {/* Stop / Close Button */}
            <button
              onClick={stop}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors btn-press"
              title="Tutup Pemutar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Scrubber: Full Width & Touch-Friendly on Mobile, Compact on Desktop */}
        <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[190px]">
          <span className="text-[10px] text-text-secondary font-mono tabular-nums flex-shrink-0 w-6 text-right">
            {formatSeconds(currentTime)}
          </span>

          <div
            ref={progressBarRef}
            onClick={handleSeekClick}
            onTouchMove={handleTouchMove}
            className="flex-1 h-3 flex items-center cursor-pointer relative group"
            title="Geser timeline lagu"
          >
            <div className="w-full h-1 group-hover:h-1.5 bg-white/15 rounded-full overflow-hidden transition-all duration-150 relative">
              <div
                className="h-full bg-accent rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Interactive scrub handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md pointer-events-none transition-transform group-hover:scale-125"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[10px] text-text-secondary font-mono tabular-nums flex-shrink-0 w-6">
            {formatSeconds(duration || 30)}
          </span>
        </div>
      </div>
    </div>
  );
};
