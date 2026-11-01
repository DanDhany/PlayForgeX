import React from "react";
import { Lock, LogIn, UserPlus, ArrowRight, KeyRound } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../LanguageSwitcher";

interface AuthGateCardProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenLanding: () => void;
}

export const AuthGateCard: React.FC<AuthGateCardProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenLanding,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 w-full h-full min-h-[480px]">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#12141A] border border-white/[0.1] shadow-2xl text-center relative overflow-hidden animate-dialog-in">
        {/* Language switch header */}
        <div className="flex justify-end mb-2">
          <LanguageSwitcher compact />
        </div>

        {/* Glow behind the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Lock Icon Badge */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent mx-auto mb-4 sm:mb-5 shadow-lg shadow-accent/10">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            {t("auth.protectedTitle")}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
            {t("auth.protectedDesc")}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:gap-3">
            <button
              onClick={onOpenLogin}
              className="w-full py-3 px-5 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 transition-all btn-press flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{t("auth.login")}</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="w-full py-2.5 px-5 rounded-xl bg-surface-elevated border border-white/[0.08] text-text-primary font-medium text-xs hover:bg-surface-hover hover:border-white/[0.15] transition-all btn-press flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-text-secondary" />
              <span>{t("auth.register")}</span>
            </button>
          </div>

          {/* Prominent Admin Credentials Box */}
          <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-primary mb-2">
              <KeyRound className="w-4 h-4 text-accent" />
              <span>{t("auth.adminDefault")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-surface-elevated/80 border border-white/[0.06] font-mono text-xs text-text-secondary">
              <div>
                <span className="text-[10px] text-text-muted block">Username</span>
                <span className="text-accent font-semibold text-xs select-all">admin</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Password</span>
                <span className="text-accent font-semibold text-xs select-all">tunebridge2026</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-text-secondary leading-tight">
              {t("auth.adminNotice")}
            </p>
          </div>

          <button
            onClick={onOpenLanding}
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            <span>{t("auth.exploreLanding")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
