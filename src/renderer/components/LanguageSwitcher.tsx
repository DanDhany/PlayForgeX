import React from "react";
import { Globe } from "lucide-react";
import { useLanguage, Language } from "../context/LanguageContext";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = "",
}) => {
  const { lang, setLang } = useLanguage();

  const handleSelect = (selected: Language) => {
    if (selected !== lang) {
      setLang(selected);
    }
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg p-0.5 bg-surface-elevated border border-border select-none text-[11px] font-medium transition-colors ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      {!compact && (
        <div className="pl-1.5 pr-1 text-text-secondary">
          <Globe className="w-3.5 h-3.5" />
        </div>
      )}
      <button
        type="button"
        onClick={() => handleSelect("en")}
        className={`px-2 py-0.5 rounded-md transition-all btn-press ${
          lang === "en"
            ? "bg-accent/20 text-accent font-semibold shadow-sm border border-accent/25"
            : "text-text-secondary hover:text-text-primary"
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleSelect("id")}
        className={`px-2 py-0.5 rounded-md transition-all btn-press ${
          lang === "id"
            ? "bg-accent/20 text-accent font-semibold shadow-sm border border-accent/25"
            : "text-text-secondary hover:text-text-primary"
        }`}
        title="Bahasa Indonesia"
      >
        ID
      </button>
    </div>
  );
};
