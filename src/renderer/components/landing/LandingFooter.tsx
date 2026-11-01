import React from "react";
import { Disc3, Server, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface LandingFooterProps {
  onOpenStudio: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenStudio }) => {
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0B0C0F] py-12 md:py-16 px-4 sm:px-6 md:px-8 text-left">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand column */}
        <div className="max-w-md">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/[0.1] flex items-center justify-center text-accent shadow-sm">
              <Disc3 className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-text-primary">
                TuneBridge
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 font-mono">
                v1.2
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {isEn
              ? "Private, self-hosted music library bridge. Consolidate and sync playlists across YouTube Music and Apple Music with zero cloud retention."
              : "Perpustakaan musik terintegrasi mandiri (self-hosted). Menggabungkan banyak akun YouTube Music ke Apple Music langsung dari komputer lokal Anda."}
          </p>
          <div className="flex items-center gap-3 mt-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-status-success" />
              {isEn ? "100% Private Local Vault" : "100% Berjalan Lokal"}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              MIT License
            </span>
          </div>
        </div>

        {/* Quick Links & CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full md:w-auto">
          <div className="flex flex-col space-y-2 text-xs">
            <span className="font-semibold text-text-primary uppercase tracking-wider text-[11px]">
              {isEn ? "Quick Navigation" : "Navigasi Cepat"}
            </span>
            <button
              onClick={onOpenStudio}
              className="text-left text-text-secondary hover:text-accent transition-colors"
            >
              {t("app.openStudio")}
            </button>
            <a
              href="#interactive-preview"
              className="text-text-secondary hover:text-accent transition-colors"
            >
              {isEn ? "Interactive Demo" : "Demo Interaktif"}
            </a>
            <a
              href="#features-section"
              className="text-text-secondary hover:text-accent transition-colors"
            >
              {isEn ? "Key Features" : "Fitur & Keunggulan"}
            </a>
            <a
              href="#platform-matrix-section"
              className="text-text-secondary hover:text-accent transition-colors"
            >
              {isEn ? "Platform Matrix" : "Daftar Platform"}
            </a>
          </div>

          <div className="flex flex-col space-y-3 pt-2 sm:pt-0">
            <button
              onClick={onOpenStudio}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition-all btn-press shadow-md shadow-accent/20"
            >
              <span>{t("app.openStudio")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <a
              href="https://github.com/DanDhany/music2anywhere"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-white/[0.08] text-text-secondary hover:text-text-primary text-xs hover:border-white/[0.15] transition-all btn-press"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Note */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-text-muted">
        <p>
          {isEn
            ? "© 2026 TuneBridge Project. Built for music privacy and personal data sovereignty."
            : "© 2026 TuneBridge Project. Dibuat untuk privasi dan kepemilikan data musik mandiri."}
        </p>
        <p>
          {isEn
            ? "YouTube Music & Apple Music are trademarks of their respective owners."
            : "YouTube Music & Apple Music adalah merek dagang dari masing-masing pemiliknya."}
        </p>
      </div>
    </footer>
  );
};
