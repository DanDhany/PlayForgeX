import React, { useState } from "react";
import { CheckCircle2, Wand2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface SanitizerSample {
  id: string;
  dirtyTitle: string;
  sourceArtist: string;
  cleanedTitle: string;
  cleanedArtist: string;
  matchScore: number;
  highlightJunk: string;
}

const SAMPLES: SanitizerSample[] = [
  {
    id: "s1",
    dirtyTitle: "YOASOBI -「アイドル」(Idol) Official Music Video [4K 60FPS]",
    sourceArtist: "Ayase / YOASOBI",
    cleanedTitle: "Idol (アイドル)",
    cleanedArtist: "YOASOBI",
    matchScore: 99.8,
    highlightJunk: "[4K 60FPS] Official Music Video",
  },
  {
    id: "s2",
    dirtyTitle: "RADWIMPS - 前前前世 [Movie ver.] 【Official MV】",
    sourceArtist: "RADWIMPS",
    cleanedTitle: "Zenzenzense (Movie ver.)",
    cleanedArtist: "RADWIMPS",
    matchScore: 99.5,
    highlightJunk: "【Official MV】",
  },
  {
    id: "s3",
    dirtyTitle: "NewJeans (뉴진스) 'Ditto' Official MV (side A) [1080p Full HD]",
    sourceArtist: "HYBE LABELS",
    cleanedTitle: "Ditto",
    cleanedArtist: "NewJeans",
    matchScore: 100,
    highlightJunk: "[1080p Full HD] (side A) Official MV",
  },
  {
    id: "s4",
    dirtyTitle: "Fujii Kaze - Shinunoga E-Wa (Official Visualizer) [Color Coded Lyrics]",
    sourceArtist: "Fujii Kaze",
    cleanedTitle: "Shinunoga E-Wa",
    cleanedArtist: "Fujii Kaze",
    matchScore: 99.2,
    highlightJunk: "(Official Visualizer) [Color Coded Lyrics]",
  },
];

export const SanitizerPlayground: React.FC = () => {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [selectedIdx, setSelectedIdx] = useState(0);
  const sample = SAMPLES[selectedIdx];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-[#121622]/90 border border-white/[0.1] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
      {/* Aurora glow header */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-xs font-semibold text-accent mb-2">
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isEn ? "Interactive Smart Sanitizer" : "Simulator Pembersih Metadata Cerdas"}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {isEn ? "Watch YouTube Metadata Clutter Vanish" : "Saksikan Teks Sampah Video Hilang Seketika"}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {isEn
              ? "Click any video title below to see our Title-Priority engine match the original studio recording."
              : "Klik judul video di bawah untuk melihat mesin kami mencocokkan rekaman studio aslinya secara instan."}
          </p>
        </div>
      </div>

      {/* Sample Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-6">
        {SAMPLES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setSelectedIdx(idx)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all btn-press flex-shrink-0 border ${
              selectedIdx === idx
                ? "bg-accent text-background border-accent font-bold shadow-md shadow-accent/20"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary border-white/[0.08]"
            }`}
          >
            {s.cleanedArtist} &mdash; {s.cleanedTitle}
          </button>
        ))}
      </div>

      {/* Before & After Interactive Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Cluttered YouTube Title (Before) */}
        <div className="p-5 rounded-2xl bg-[#0B0C0F]/80 border border-rose-500/25 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono font-semibold text-rose-300">
            BEFORE (RAW VIDEO)
          </div>

          <div>
            <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
              {isEn ? "Cluttered YouTube Video Title" : "Judul Video YouTube Mentah"}
            </span>
            <p className="text-sm font-semibold text-text-primary mt-2 leading-relaxed">
              {sample.dirtyTitle}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Uploader: <span className="text-text-muted">{sample.sourceArtist}</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-500/15 flex items-center justify-between text-[11px] text-rose-300">
            <span>{isEn ? "Noise Detected:" : "Sampah Terdeteksi:"}</span>
            <span className="font-mono bg-rose-500/20 px-2 py-0.5 rounded text-[10px]">
              {sample.highlightJunk}
            </span>
          </div>
        </div>

        {/* Right: Cleaned Studio Recording (After) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-status-success/10 border border-status-success/35 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-status-success/15 border border-status-success/30 text-[10px] font-mono font-semibold text-status-success flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>MATCHED ({sample.matchScore}%)</span>
          </div>

          <div>
            <span className="text-[10px] text-status-success uppercase font-mono tracking-wider">
              {isEn ? "Clean Apple Music Studio Cut" : "Metadata Bersih Apple Music"}
            </span>
            <p className="text-base font-bold text-text-primary mt-2 tracking-tight">
              {sample.cleanedTitle}
            </p>
            <p className="text-xs font-semibold text-accent mt-1">
              Artist: <span className="text-text-primary">{sample.cleanedArtist}</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-status-success/20 flex items-center justify-between text-[11px] text-status-success">
            <span>{isEn ? "Verification Status:" : "Status Verifikasi:"}</span>
            <span className="font-mono font-semibold">
              {isEn ? "Ready for 100% Export" : "Siap Ekspor 100% Bersih"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
