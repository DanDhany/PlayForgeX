import React from "react";
import {
  ArrowRight,
  Server,
  Smartphone,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { SoundwaveVisualizer } from "./SoundwaveVisualizer";
import { InteractiveMigrationPreview } from "./InteractiveMigrationPreview";
import { Reveal } from "./Reveal";
import { useLanguage } from "../../context/LanguageContext";

interface HeroSectionProps {
  onOpenStudio: () => void;
  onExploreFeatures?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenStudio,
  onExploreFeatures,
}) => {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  const handleScrollToFeatures = () => {
    if (onExploreFeatures) {
      onExploreFeatures();
      return;
    }
    const elem = document.getElementById("how-it-works") || document.getElementById("features-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full pt-8 pb-16 md:pt-16 md:pb-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Background Multi-Layer Aurora Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-gradient-to-b from-accent/20 via-accent/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-24 right-1/4 w-80 h-80 bg-service-apple/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-36 left-1/4 w-96 h-96 bg-status-success/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Top Floating Badge */}
      <Reveal direction="down">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-elevated/90 border border-white/[0.1] backdrop-blur-md mb-6 shadow-xl shadow-black/40 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-0.5">
            <span className="w-1 h-3.5 bg-accent rounded-full animate-eq-1" />
            <span className="w-1 h-2.5 bg-status-success rounded-full animate-eq-2" />
            <span className="w-1 h-4 bg-service-apple rounded-full animate-eq-3" />
          </div>
          <span className="text-xs font-semibold text-text-secondary">
            {isEn ? "PlayForgeX • Your Music Woven Together" : "PlayForgeX • Seluruh Musik Anda Menyatu"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold font-mono">
            LIVE
          </span>
        </div>
      </Reveal>

      {/* Main Apple Music Inspired Headline */}
      <Reveal delay={100}>
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-text-primary max-w-5xl leading-[1.06]">
          {isEn ? (
            <>
              Keep Your Playlists. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-service-apple to-emerald-400">
                Truly Yours Forever.
              </span>
            </>
          ) : (
            <>
              Playlist Anda. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-service-apple to-emerald-400">
                Milik Anda Seutuhnya.
              </span>
            </>
          )}
        </h1>
      </Reveal>

      {/* Humanized Subheadline */}
      <Reveal delay={200}>
        <p className="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed mx-auto">
          {isEn
            ? "You spent years curating your favorite songs. Don't let switching streaming services or monthly paywalls hold your library hostage. Migrate and merge your YouTube Music collections directly to Apple Music — 100% private and on your own machine."
            : "Tahun-tahun Anda mengumpulkan lagu favorit jangan sampai hilang hanya karena ganti aplikasi musik atau dipungut biaya bulanan. Pindahkan dan lebur playlist YouTube Music ke Apple Music langsung dari browser Anda — privat, aman, dan tanpa pihak ketiga."}
        </p>
      </Reveal>

      {/* Action Buttons */}
      <Reveal delay={300}>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={onOpenStudio}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-accent text-background font-bold text-sm transition-all hover:bg-accent-hover hover:shadow-2xl hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] btn-press"
          >
            <span>{isEn ? "Open Studio & Migrate" : "Buka Studio & Mulai Transfer"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleScrollToFeatures}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-elevated/80 border border-white/[0.08] text-text-primary font-semibold text-sm transition-all hover:bg-surface-hover hover:border-white/[0.15] active:scale-[0.98] btn-press backdrop-blur-md"
          >
            <span>{isEn ? "Explore Features" : "Pelajari Fitur"}</span>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </Reveal>

      {/* Trust & Privacy Chips */}
      <Reveal delay={350}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated/50 border border-white/[0.06] backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            <span>{isEn ? "Zero Cloud Retention" : "100% Privat & Tanpa Cloud"}</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated/50 border border-white/[0.06] backdrop-blur-sm">
            <Server className="w-3.5 h-3.5 text-accent" />
            <span>{isEn ? "Encrypted Local Storage" : "Vault Lokal Terenkripsi"}</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated/50 border border-white/[0.06] backdrop-blur-sm">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEn ? "iPhone & Android Ready" : "Akses iPhone & Android Siap"}</span>
          </span>
        </div>
      </Reveal>

      {/* Live Apple Music Style Soundwave Visualizer */}
      <Reveal delay={400} direction="none" className="w-full mt-10 sm:mt-14">
        <SoundwaveVisualizer />
      </Reveal>

      {/* Interactive Migration Simulation Component */}
      <Reveal delay={500} direction="none" className="w-full mt-14 sm:mt-20">
        <div id="interactive-preview" className="w-full scroll-mt-24">
          <InteractiveMigrationPreview />
        </div>
      </Reveal>
    </section>
  );
};
