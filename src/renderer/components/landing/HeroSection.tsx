import React from "react";
import {
  ArrowRight,
  Server,
  Layers,
  Smartphone,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { InteractiveMigrationPreview } from "./InteractiveMigrationPreview";

interface HeroSectionProps {
  onOpenStudio: () => void;
  onExploreFeatures?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenStudio,
  onExploreFeatures,
}) => {
  const handleScrollToFeatures = () => {
    if (onExploreFeatures) {
      onExploreFeatures();
      return;
    }
    const elem = document.getElementById("features-section");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full pt-8 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Release & Architecture Kicker Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated/80 border border-white/[0.08] backdrop-blur-md mb-6 shadow-sm hover:border-accent/40 transition-colors">
        <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
        <span className="text-xs font-medium text-text-secondary">
          TuneBridge v1.2 • Mesin Migrasi Multi-Akun & Database Lokal
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary max-w-4xl leading-[1.12]">
        Perpustakaan Musik Anda.{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-accent to-accent-hover">
          Tersambung, Bersih, dan Utuh.
        </span>
      </h1>

      {/* Subheadline (Humanized, natural Indonesian) */}
      <p className="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed">
        Pindahkan dan gabungkan playlist dari banyak akun YouTube Music ke Apple Music langsung dari
        browser laptop atau HP Anda. Data tersimpan di server lokal Anda sendiri.
      </p>

      {/* Action Buttons Group */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
        <button
          onClick={onOpenStudio}
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-accent text-background font-semibold text-sm transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/25 flex items-center justify-center gap-2.5 btn-press"
        >
          <span>Buka Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleScrollToFeatures}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-surface-elevated/80 hover:bg-surface-elevated text-text-primary font-medium text-sm border border-white/[0.08] hover:border-white/[0.15] transition-all flex items-center justify-center gap-2 btn-press"
        >
          <span>Pelajari Fitur</span>
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {/* Key Guarantees Pill Bar */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-text-secondary max-w-3xl w-full">
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface/40 border border-white/[0.04]">
          <Layers className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <span className="truncate">Multi-Akun YouTube</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface/40 border border-white/[0.04]">
          <Smartphone className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
          <span className="truncate">Akses Browser HP</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface/40 border border-white/[0.04]">
          <Server className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate">Database MySQL Lokal</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface/40 border border-white/[0.04]">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="truncate">100% Data Pribadi</span>
        </div>
      </div>

      {/* Embedded Interactive Migration Simulator */}
      <div id="interactive-preview" className="mt-12 sm:mt-16 w-full max-w-4xl">
        <InteractiveMigrationPreview onOpenStudio={onOpenStudio} />
      </div>
    </section>
  );
};
