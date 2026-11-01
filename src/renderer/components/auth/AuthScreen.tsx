import React, { useState } from "react";
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  Disc3,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { User } from "../../../shared/types";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../LanguageSwitcher";

interface AuthScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
  onBackToLanding: () => void;
  initialTab?: "login" | "register";
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onBackToLanding,
  initialTab = "login",
}) => {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage(t("auth.usernameMin"));
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(t("auth.passwordMin"));
      return;
    }

    if (tab === "register" && password !== confirmPassword) {
      setErrorMessage(t("auth.passwordMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (lang === "en"
              ? tab === "login"
                ? "Sign in failed"
                : "Registration failed"
              : tab === "login"
              ? "Gagal masuk"
              : "Gagal mendaftar")
        );
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === "en"
            ? "An unexpected error occurred. Please try again."
            : "Terjadi kesalahan. Silakan coba lagi.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0B0C0F] text-text-primary flex flex-col justify-between selection:bg-accent selection:text-background relative overflow-x-hidden font-sans">
      {/* Ambient Aurora Gradient Glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-accent/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[380px] h-[380px] bg-[#FA2D48]/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="fixed top-10 left-10 w-[320px] h-[320px] bg-status-success/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="w-full h-16 px-4 sm:px-8 flex items-center justify-between border-b border-white/[0.06] bg-[#0B0C0F]/80 backdrop-blur-xl relative z-20">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-xl bg-surface-elevated/60 border border-white/[0.08] hover:border-white/[0.15] transition-all btn-press"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("auth.backHome")}</span>
        </button>

        {/* Brand Center */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-white/[0.1] flex items-center justify-center text-accent shadow-sm">
            <Disc3 className="w-4 h-4 animate-spin-slow" />
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary">
            TuneBridge
          </span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center">
          <LanguageSwitcher compact />
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto relative z-20">
        <div className="max-w-md w-full rounded-3xl bg-[#12141A]/90 border border-white/[0.1] shadow-2xl p-6 sm:p-8 backdrop-blur-2xl relative animate-dialog-in max-h-[88vh] overflow-y-auto">
          {/* Soundwave equalizer badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent/25 via-accent/10 to-transparent border border-accent/30 flex items-center justify-center text-accent shadow-lg shadow-accent/10 mb-3">
              <div className="flex items-end gap-1 h-5">
                <span className="w-1 h-3 bg-accent rounded-full animate-eq-1" />
                <span className="w-1 h-5 bg-accent rounded-full animate-eq-2" />
                <span className="w-1 h-2 bg-accent rounded-full animate-eq-3" />
                <span className="w-1 h-4 bg-accent rounded-full animate-eq-2" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {t("auth.welcomeTitle")}
            </h1>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed max-w-xs">
              {t("auth.welcomeSubtitle")}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-elevated border border-white/[0.06] mb-5">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all btn-press flex items-center justify-center gap-1.5 ${
                tab === "login"
                  ? "bg-accent text-background shadow-md shadow-accent/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t("auth.login")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all btn-press flex items-center justify-center gap-1.5 ${
                tab === "register"
                  ? "bg-accent text-background shadow-md shadow-accent/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("auth.register")}</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {t("users.username")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / username"
                  autoComplete="username"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-white/[0.08] text-base sm:text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {lang === "en" ? "Password" : "Kata Sandi"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-surface-elevated border border-white/[0.08] text-base sm:text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register mode) */}
            {tab === "register" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-surface-elevated border border-white/[0.08] text-base sm:text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-5 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 transition-all btn-press flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === "en" ? "Processing..." : "Memproses..."}</span>
                </>
              ) : tab === "login" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{t("auth.login")}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{t("auth.register")}</span>
                </>
              )}
            </button>
          </form>

          {/* Privacy footer */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-[11px] text-text-muted flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>{lang === "en" ? "100% Private, Encrypted Local Storage" : "100% Privat, Penyimpanan Lokal Terenkripsi"}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full py-4 text-center text-[11px] text-text-muted border-t border-white/[0.04]">
        TuneBridge &copy; 2026 &middot; {lang === "en" ? "Universal Music Migration" : "Jembatan Perpustakaan Musik"}
      </footer>
    </div>
  );
};
