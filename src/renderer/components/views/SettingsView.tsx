import React, { useState } from "react";
import {
  Server,
  Sliders,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { copyToClipboard } from "../../utils/ui-helpers";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../LanguageSwitcher";

interface SettingsViewProps {
  onRefresh?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [lyricsCheckEnabled, setLyricsCheckEnabled] = useState(true);

  const lanUrl = typeof window !== "undefined" ? window.location.origin : "http://192.168.1.42:3080";

  const handleCopyUrl = async () => {
    const ok = await copyToClipboard(lanUrl);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-32 md:pb-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
          {t("settings.title")}
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          {t("settings.desc")}
        </p>
      </div>

      {/* Language Preference Section */}
      <div className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">
              {isEn ? "Interface Language" : "Bahasa Antarmuka"}
            </h3>
          </div>
          <LanguageSwitcher />
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {isEn
            ? "Choose your preferred display language. Defaults to English for global compatibility."
            : "Pilih bahasa antarmuka aplikasi. Standar bawaan menggunakan bahasa Inggris untuk kompatibilitas luas."}
        </p>
      </div>

      {/* Section 1: Algoritma Matching & Deteksi Varian */}
      <div className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">
            {t("settings.matchingSection")}
          </h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {t("settings.matchingDesc")}
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-border text-xs gap-3">
            <div>
              <div className="font-medium text-text-primary">
                {isEn ? "Non-Latin Script Priority (Kanji, Hangul, Cyrillic)" : "Prioritas Judul & Artis (Non-Latin)"}
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                {isEn
                  ? "Transliterate Japanese, Korean, and Arabic titles to official international releases."
                  : "Mencocokkan judul kanji/hangul/arab ke transliterasi romaji/latin resmi di katalog."}
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-status-success/15 text-status-success border border-status-success/25 font-semibold flex-shrink-0">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-border text-xs gap-3">
            <div>
              <div className="font-medium text-text-primary">
                {isEn ? "Audio Preview Verification" : "Verifikasi Pratinjau Audio (30s Preview)"}
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                {isEn
                  ? "Direct stream audition from official catalog CDN before committing transfers."
                  : "Streaming cuplikan audio langsung dari CDN resmi sebelum transfer dijalankan."}
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-status-success/15 text-status-success border border-status-success/25 font-semibold flex-shrink-0">
              Enabled
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated border border-border text-xs gap-3">
            <div>
              <div className="font-medium text-text-primary">
                {isEn ? "Live & Remix Edition Protection" : "Proteksi Edisi Live & Remix"}
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                {isEn
                  ? "Prevents accidental replacement of live concert versions with standard studio tracks."
                  : "Mencegah penimpaan versi konser live dengan versi rekaman studio standar."}
              </div>
            </div>
            <button
              onClick={() => setLyricsCheckEnabled(!lyricsCheckEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 btn-press flex-shrink-0 ${
                lyricsCheckEnabled ? "bg-accent" : "bg-surface"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  lyricsCheckEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Mobile Access via Local Wi-Fi */}
      <div className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            {t("settings.networkSection")}
          </h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {t("settings.networkDesc")}
        </p>

        <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-text-secondary font-medium">Local Web Address</span>
            <span className="text-[11px] font-mono text-status-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              Online
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={lanUrl}
              className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border font-mono text-xs text-text-primary focus:outline-none"
            />
            <button
              onClick={handleCopyUrl}
              className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-border text-xs text-text-primary font-medium flex items-center gap-1.5 btn-press transition-colors flex-shrink-0"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-status-success" />
                  <span>{t("settings.copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-text-secondary" />
                  <span>{t("settings.copyUrl")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
