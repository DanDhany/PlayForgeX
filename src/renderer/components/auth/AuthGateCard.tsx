import React from "react";
import { Lock, LogIn, UserPlus, ArrowRight } from "lucide-react";

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
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 w-full h-full min-h-[480px]">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#12141A] border border-white/[0.1] shadow-2xl text-center relative overflow-hidden animate-dialog-in">
        {/* Glow behind the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Lock Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent mx-auto mb-5 shadow-lg shadow-accent/10">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Akses Terproteksi
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
            Perpustakaan musik, token multi-akun, dan riwayat migrasi Anda tersimpan aman dan terisolasi di database lokal Anda. Masuk untuk membuka akses ke Studio.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={onOpenLogin}
              className="w-full py-3 px-5 rounded-xl bg-accent text-background font-bold text-xs hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 transition-all btn-press flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Akun TuneBridge</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="w-full py-2.5 px-5 rounded-xl bg-surface-elevated border border-white/[0.08] text-text-primary font-medium text-xs hover:bg-surface-hover hover:border-white/[0.15] transition-all btn-press flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-text-secondary" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary mb-1">
              <span>💡 Akun Administrator Default:</span>
            </div>
            <div className="text-[11px] font-mono text-text-secondary space-y-0.5">
              <div>Username: <span className="text-accent font-semibold">admin</span></div>
              <div>Password: <span className="text-accent font-semibold">tunebridge2026</span></div>
            </div>
            <p className="mt-2 text-[10px] text-text-muted leading-tight">
              Seluruh data akun dan playlist lama Anda telah dimigrasikan ke akun admin ini. Masuk dengan akun di atas untuk mengaksesnya.
            </p>
          </div>

          <button
            onClick={onOpenLanding}
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            <span>Jelajahi Landing Page Promosi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
