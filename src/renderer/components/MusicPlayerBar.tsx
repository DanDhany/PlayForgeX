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

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  return (
    <div className="fixed bottom-[64px] md:bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-xl z-50 animate-sheet-up md:animate-dialog-in">
      <div className="bg-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-2.5 md:p-3 flex items-center gap-3 select-none">
        {/* Track Artwork / Vinyl Thumbnail */}
        <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated border border-border shadow-inner">
          {currentTrack.artworkUrl ? (
            <img
              src={currentTrack.artworkUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? "scale-105" : "scale-100"
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary">
              <Disc className={`w-5 h-5 ${isPlaying ? "animate-spin text-accent" : ""}`} />
            </div>
          )}

          {/* Equalizer Wave Overlay when Playing */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
              <span className="w-0.5 bg-accent rounded-full animate-eq-1" />
              <span className="w-0.5 bg-accent rounded-full animate-eq-2" />
              <span className="w-0.5 bg-accent rounded-full animate-eq-3" />
            </div>
          )}
        </div>

        {/* Center Section: Track Metadata & Interactive Progress Bar */}
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-text-primary truncate leading-tight">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-text-secondary truncate leading-tight">
                {currentTrack.artist}
              </p>
            </div>
            {/* Real-time Time Stamp */}
            <div className="text-[10px] text-text-secondary font-mono tabular-nums flex-shrink-0">
              {formatSeconds(currentTime)} / {formatSeconds(duration || 30)}
            </div>
          </div>

          {/* Scrubbable Progress Bar */}
          <div
            ref={progressBarRef}
            onClick={handleSeekClick}
            className="w-full h-1.5 bg-white/10 hover:bg-white/15 rounded-full overflow-hidden cursor-pointer relative group transition-colors"
            title="Klik untuk melompat ke detik lagu"
          >
            <div
              className="h-full bg-accent rounded-full transition-all duration-75 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Playback Controls & Volume */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          {/* Play / Pause Toggle Button */}
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

          {/* Volume Control (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-1">
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

          {/* Close / Stop Button */}
          <button
            onClick={stop}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors btn-press ml-0.5"
            title="Tutup Pemutar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
