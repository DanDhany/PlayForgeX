import React from "react";
import { Disc3, ArrowRight, Menu, X } from "lucide-react";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { PlatformMatrixSection } from "./PlatformMatrixSection";
import { FaqSection } from "./FaqSection";
import { LandingFooter } from "./LandingFooter";

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface LandingPageProps {
  onOpenStudio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#0B0C0F] text-text-primary scroll-smooth selection:bg-accent selection:text-background font-sans relative">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full h-16 bg-[#0B0C0F]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 md:px-8 select-none">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/[0.1] flex items-center justify-center text-accent shadow-sm">
              <Disc3 className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-text-primary">
                TuneBridge
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-mono font-medium hidden sm:inline-block">
                v1.2
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-text-secondary">
            <a
              href="#interactive-preview"
              className="hover:text-text-primary transition-colors font-medium"
            >
              Demo Interaktif
            </a>
            <a
              href="#features-section"
              className="hover:text-text-primary transition-colors font-medium"
            >
              Fitur
            </a>
            <a
              href="#platform-matrix-section"
              className="hover:text-text-primary transition-colors font-medium"
            >
              Platform
            </a>
            <a
              href="#faq-section"
              className="hover:text-text-primary transition-colors font-medium"
            >
              FAQ
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </nav>

          {/* CTA Group */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenStudio}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-accent text-background font-semibold text-xs transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 btn-press"
            >
              <span>Buka Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-surface-elevated border border-white/[0.08] text-text-secondary hover:text-text-primary btn-press"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bg-[#12141A]/95 border-b border-white/[0.08] p-4 flex flex-col space-y-3 backdrop-blur-xl animate-drawer-down">
            <a
              href="#interactive-preview"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
            >
              Demo Interaktif
            </a>
            <a
              href="#features-section"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
            >
              Fitur Utama
            </a>
            <a
              href="#platform-matrix-section"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
            >
              Daftar Platform
            </a>
            <a
              href="#faq-section"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
            >
              FAQ
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated flex items-center gap-2"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub Repository</span>
            </a>
          </div>
        )}
      </header>

      {/* Main Content Sections */}
      <main className="flex flex-col items-center w-full">
        <HeroSection onOpenStudio={onOpenStudio} />
        <FeaturesSection />
        <PlatformMatrixSection />
        <FaqSection />
      </main>

      {/* Footer */}
      <LandingFooter onOpenStudio={onOpenStudio} />
    </div>
  );
};
