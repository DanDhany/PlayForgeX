import React, { useState, useEffect } from "react";
import { ArrowRight, Disc3 } from "lucide-react";

interface FloatingDockProps {
  onOpenStudio: () => void;
  show?: boolean;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({ onOpenStudio, show }) => {
  const [internalVisible, setInternalVisible] = useState(false);

  useEffect(() => {
    if (typeof show === "boolean") return;
    const handleScroll = () => {
      setInternalVisible(window.scrollY > 320);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [show]);

  const isVisible = typeof show === "boolean" ? show : internalVisible;
  if (!isVisible) return null;

  return (
    <aside
      aria-label="Navigasi cepat melayang"
      className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-dialog-in"
    >
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2 rounded-2xl bg-[#12141A]/90 backdrop-blur-2xl border border-white/[0.12] shadow-2xl shadow-black/80 ring-1 ring-white/[0.05]">
        {/* Brand mini icon */}
        <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-white/[0.1] hidden sm:flex items-center justify-center text-accent">
          <Disc3 className="w-4 h-4 animate-spin-slow" />
        </div>

        {/* Quick Jump Links (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 text-xs text-text-secondary px-2">
          <a
            href="#interactive-preview"
            className="px-2.5 py-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.06] transition-colors font-medium"
          >
            Demo
          </a>
          <a
            href="#how-it-works"
            className="px-2.5 py-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.06] transition-colors font-medium"
          >
            Cara Kerja
          </a>
          <a
            href="#features-section"
            className="px-2.5 py-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.06] transition-colors font-medium"
          >
            Fitur
          </a>
          <a
            href="#comparison-section"
            className="px-2.5 py-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.06] transition-colors font-medium"
          >
            Perbandingan
          </a>
          <a
            href="#platform-matrix-section"
            className="px-2.5 py-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.06] transition-colors font-medium"
          >
            Platform
          </a>
          <a
            href="#faq-section"
            className="px-2.5 py-1.5 rounded-lg hover:text-text-primary hover:bg-white/[0.06] transition-colors font-medium"
          >
            FAQ
          </a>
        </nav>

        {/* Divider on desktop */}
        <div className="h-5 w-px bg-white/[0.08] hidden md:block" />

        {/* Primary CTA Button */}
        <button
          onClick={onOpenStudio}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-background font-bold text-xs transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] btn-press"
        >
          <span>Buka Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
