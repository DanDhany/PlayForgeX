import React from "react";
import {
  ArrowRight,
  Server,
  Smartphone,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
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
  const { t } = useLanguage();

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
    <section className="relative w-full pt-10 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Background multi-layer radial mesh glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[550px] bg-gradient-to-b from-accent/20 via-accent/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-1/4 w-72 h-72 bg-service-apple/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-32 left-1/4 w-80 h-80 bg-status-success/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Release Badge (No raw tech stacks or architectures) */}
      <Reveal direction="down">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-elevated/90 border border-white/[0.1] backdrop-blur-md mb-6 shadow-lg shadow-black/40 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-0.5">
            <span className="w-1 h-3.5 bg-accent rounded-full animate-eq-1" />
            <span className="w-1 h-2.5 bg-status-success rounded-full animate-eq-2" />
            <span className="w-1 h-4 bg-service-apple rounded-full animate-eq-3" />
          </div>
          <span className="text-xs font-medium text-text-secondary">
            {t("landing.badge")}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold font-mono">
            LIVE
          </span>
        </div>
      </Reveal>

      {/* Main Headline */}
      <Reveal delay={100}>
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-text-primary max-w-4xl leading-[1.08]">
          {t("landing.heroTitle")}
        </h1>
      </Reveal>

      {/* Subheadline */}
      <Reveal delay={200}>
        <p className="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed mx-auto">
          {t("landing.heroDesc")}
        </p>
      </Reveal>

      {/* Action Buttons Group */}
      <Reveal delay={300}>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={onOpenStudio}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 rounded-xl bg-accent text-background font-bold text-sm transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] btn-press"
          >
            <span>{t("landing.ctaOpenStudio")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleScrollToFeatures}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-elevated border border-white/[0.08] text-text-primary font-semibold text-sm transition-all hover:bg-surface-hover hover:border-white/[0.15] active:scale-[0.98] btn-press"
          >
            <span>{t("landing.ctaLearnMore")}</span>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </Reveal>

      {/* Trust & Privacy Chips (Clean, benefit-focused) */}
      <Reveal delay={400}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated/40 border border-white/[0.05]">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            <span>{t("landing.pillZeroCloud")}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated/40 border border-white/[0.05]">
            <Server className="w-3.5 h-3.5 text-accent" />
            <span>{t("landing.pillPrivateVault")}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated/40 border border-white/[0.05]">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("landing.pillMobileReady")}</span>
          </span>
        </div>
      </Reveal>

      {/* Interactive Migration Simulation Component */}
      <Reveal delay={500} direction="none" className="w-full mt-12 sm:mt-16">
        <div id="interactive-preview" className="w-full scroll-mt-24">
          <InteractiveMigrationPreview />
        </div>
      </Reveal>
    </section>
  );
};
