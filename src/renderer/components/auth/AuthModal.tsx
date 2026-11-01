import React, { useState } from "react";
import {
  X,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Disc3,
  CheckCircle2,
} from "lucide-react";
import { User } from "../../../shared/types";
import { useLanguage } from "../../context/LanguageContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  initialTab?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = "login",
}) => {
  if (!isOpen) return null;

  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage(null);
  };

  const handleTabChange = (newTab: "login" | "register") => {
    setTab(newTab);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage("Username minimal harus 3 karakter.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
      return;
    }

    if (tab === "register" && password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
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

      if (data.token) {
        localStorage.setItem("playforgex_token", data.token);
      }

      resetForm();
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      let friendlyError =
        err.message ||
        (lang === "en"
          ? "An unexpected error occurred while processing your request."
          : "Terjadi kesalahan saat memproses permintaan.");
      if (friendlyError.includes("already taken") || friendlyError.includes("ER_DUP_ENTRY")) {
        friendlyError =
          lang === "en"
            ? `Username "${cleanUsername}" is already taken. Please choose another username or sign in.`
            : `Username "${cleanUsername}" sudah digunakan. Silakan pilih username lain atau masuk.`;
      } else if (friendlyError.includes("Invalid username or password")) {
        friendlyError =
          lang === "en"
            ? "Invalid username or password."
            : "Username atau kata sandi tidak sesuai.";
      }
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[85dvh] animate-sheet-up md:animate-dialog-in pb-safe">
        {/* iOS Drag Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
              <Disc3 className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                {tab === "login" ? (isEn ? "Sign In to PlayForgeX" : "Masuk ke PlayForgeX") : (isEn ? "Create PlayForgeX Account" : "Buat Akun PlayForgeX")}
              </h3>
              <p className="text-[11px] text-text-secondary">
                {tab === "login"
                  ? (isEn ? "Access your playlists and connected accounts" : "Akses koleksi playlist dan multi-akun Anda")
                  : (isEn ? "Safely persist your transfer history and vaults" : "Simpan riwayat transfer dan akun Anda")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover btn-press transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 p-1 bg-surface-elevated rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 btn-press ${
                tab === "login"
                  ? "bg-surface text-text-primary shadow-sm border border-border"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t("auth.login")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("register")}
              className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 btn-press ${
                tab === "register"
                  ? "bg-surface text-text-primary shadow-sm border border-border"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("auth.register")}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-status-error/15 border border-status-error/30 text-rose-300 text-xs flex items-start gap-2.5 animate-dialog-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-status-error mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
              <span>Username</span>
              <span className="text-[10px] text-text-secondary/70">{isEn ? "Min. 3 characters" : "Min. 3 karakter"}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isEn ? "e.g. alex_music" : "misal: alex_music"}
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full pl-9 pr-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
              <span>{isEn ? "Password" : "Kata Sandi"}</span>
              <span className="text-[10px] text-text-secondary/70">{isEn ? "Min. 6 characters" : "Min. 6 karakter"}</span>
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
                required
                className="w-full pl-9 pr-10 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (only on register) */}
          {tab === "register" && (
            <div className="space-y-1.5 animate-dialog-in">
              <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
                <span>{t("auth.confirmPassword")}</span>
                {confirmPassword && password === confirmPassword && (
                  <span className="text-[10px] text-status-success flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> {isEn ? "Match" : "Cocok"}
                  </span>
                )}
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
                  required
                  className="w-full pl-9 pr-10 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Security footnote */}
          <div className="p-3 rounded-xl bg-surface-elevated/60 border border-border/80 flex items-start gap-2.5 text-[11px] text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {lang === "en"
                ? "Passwords are cryptographically salted and hashed. Account data remains safe in your local server."
                : "Kata sandi dienkripsi menggunakan scrypt dengan garam kriptografis unik. Data akun disimpan aman di server lokal."}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-background font-semibold rounded-xl text-xs flex items-center justify-center gap-2 btn-press transition-all shadow-md shadow-accent/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : tab === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Buat Akun Baru</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
