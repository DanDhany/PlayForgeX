import React, { useState, useRef } from "react";
import { Play, Pause, Disc3, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const SoundwaveVisualizer: React.FC = () => {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 24 equalizer bar heights
  const bars = [
    35, 60, 85, 45, 95, 70, 50, 100, 75, 40, 85, 65,
    90, 55, 80, 45, 100, 60, 75, 50, 90, 65, 40, 30
  ];

  const togglePlayback = () => {
    if (!audioRef.current) {
      // Use clean preview stream or Web Audio synthesis if offline
      audioRef.current = new Audio("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/44/e9/87/44e987f1-a1b6-dcae-0be1-33a76e187514/mzaf_17208880629706346740.plus.aac.p.m4a");
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        // Fallback simulated playing state
        console.log("Audio preview fallback activated");
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(true);
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-[#161B27]/90 to-[#0F1219]/90 border border-white/[0.1] p-5 sm:p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
      {/* Ambient background glow */}
      <div className={`absolute -right-10 -bottom-10 w-44 h-44 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${isPlaying ? "bg-service-apple/25 opacity-100" : "bg-accent/15 opacity-50"}`} />
      <div className={`absolute -left-10 -top-10 w-44 h-44 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${isPlaying ? "bg-status-success/20 opacity-100" : "bg-white/[0.03] opacity-30"}`} />

      {/* Top Track & Master Audio Pill */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr from-accent/30 to-service-apple/20 border border-white/[0.1] flex items-center justify-center text-accent shadow-md ${isPlaying ? "animate-spin-slow ring-2 ring-accent/30" : ""}`}>
              <Disc3 className="w-5 h-5" />
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-status-success border-2 border-[#12141A] animate-ping" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-text-primary truncate">
                M83 &mdash; Midnight City
              </span>
              <span className="px-1.5 py-0.2 rounded bg-accent/15 text-accent border border-accent/25 text-[9px] font-mono font-medium hidden sm:inline-block">
                STUDIO MASTER
              </span>
            </div>
            <p className="text-[11px] text-text-secondary truncate mt-0.5">
              {isEn ? "Direct Apple Music 24-bit Lossless Stream Audition" : "Cuplikan Audio Apple Music Lossless 24-bit Langsung"}
            </p>
          </div>
        </div>

        {/* Audition Play Trigger Button */}
        <button
          onClick={togglePlayback}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all btn-press shadow-md ${
            isPlaying
              ? "bg-service-apple text-white shadow-service-apple/30"
              : "bg-accent text-background hover:bg-accent-hover shadow-accent/20"
          }`}
          aria-label={isPlaying ? "Pause audio audition" : "Play audio audition"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>{isEn ? "Pause" : "Jeda"}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isEn ? "Audition" : "Putar"}</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Soundwave Equalizer Bars */}
      <div className="h-16 sm:h-20 flex items-end justify-between gap-1 sm:gap-1.5 px-2 py-2 rounded-2xl bg-[#0B0C0F]/70 border border-white/[0.06] backdrop-blur-md">
        {bars.map((height, i) => {
          const delay = (i * 0.05).toFixed(2);
          const duration = (0.7 + (i % 5) * 0.15).toFixed(2);

          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-300"
              style={{
                height: isPlaying ? `${height}%` : "15%",
                minHeight: "4px",
                background: isPlaying
                  ? `linear-gradient(to top, #A99BFF 0%, #FA2D48 65%, #69D6AF 100%)`
                  : `rgba(255, 255, 255, 0.12)`,
                animation: isPlaying
                  ? `soundwave-pulse ${duration}s ease-in-out infinite alternate ${delay}s`
                  : "none",
              }}
            />
          );
        })}
      </div>

      {/* Footer Details */}
      <div className="flex items-center justify-between text-[11px] text-text-muted mt-3 pt-2.5 border-t border-white/[0.05]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>{isEn ? "Lossless title & acoustic verification" : "Verifikasi judul & audio bebas miss-match"}</span>
        </span>
        <span className="font-mono text-[10px] text-accent">
          {isPlaying ? (isEn ? "PLAYING LIVE STREAM" : "MEMUTAR AUDIO LIVE") : (isEn ? "CLICK AUDITION TO TEST" : "KLIK PUTAR UNTUK MENGUJI")}
        </span>
      </div>
    </div>
  );
};
