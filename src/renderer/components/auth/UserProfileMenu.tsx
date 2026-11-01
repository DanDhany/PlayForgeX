import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  LogOut,
  UserCheck,
  ChevronDown,
  LogIn,
  UserPlus,
} from "lucide-react";
import { User } from "../../../shared/types";

interface UserProfileMenuProps {
  currentUser?: User | null;
  onOpenAuth: (initialTab?: "login" | "register") => void;
  onLogout: () => void;
  compact?: boolean;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!currentUser) {
    return (
      <button
        onClick={() => onOpenAuth("login")}
        className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-medium text-text-primary flex items-center gap-2 btn-press transition-colors shadow-sm"
        title="Masuk atau Daftar Akun TuneBridge"
      >
        <LogIn className="w-3.5 h-3.5 text-accent" />
        <span>Masuk / Daftar</span>
      </button>
    );
  }

  // Derive initials for avatar
  const initials = currentUser.username
    ? currentUser.username.slice(0, 2).toUpperCase()
    : "TB";

  const isAdmin = currentUser.role === "admin";

  const formattedDate = currentUser.createdAt
    ? new Date(Number(currentUser.createdAt)).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Baru saja";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Pill trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all btn-press border ${
          isOpen
            ? "bg-surface-elevated border-accent/40 shadow-sm shadow-accent/10"
            : "bg-surface-elevated/70 hover:bg-surface-elevated border-border"
        } ${compact ? "p-1.5" : "px-2.5 py-1.5"}`}
        title={`Akun: ${currentUser.username} (${isAdmin ? "Admin" : "Pengguna"})`}
      >
        {/* Avatar badge */}
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent font-mono flex-shrink-0">
          {initials}
        </div>

        {!compact && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-text-primary truncate max-w-[100px]">
              {currentUser.username}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${
                isAdmin
                  ? "bg-accent/15 text-accent border-accent/30"
                  : "bg-white/[0.08] text-text-secondary border-border"
              }`}
            >
              {isAdmin ? "Admin" : "User"}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-text-secondary transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-50 animate-dialog-in backdrop-blur-xl">
          {/* Header profile info */}
          <div className="p-4 border-b border-border bg-surface-elevated/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent/30 to-accent/15 border border-accent/30 flex items-center justify-center text-sm font-bold text-accent font-mono flex-shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-text-primary truncate">
                    {currentUser.username}
                  </h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold border ${
                      isAdmin
                        ? "bg-accent/20 text-accent border-accent/30"
                        : "bg-white/[0.08] text-text-secondary border-border"
                    }`}
                  >
                    {isAdmin ? "Administrator" : "Pengguna"}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">
                  ID: {currentUser.id.slice(0, 14)}...
                </p>
              </div>
            </div>

            {/* Join date info */}
            <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-text-secondary/70" />
                <span>Terdaftar</span>
              </span>
              <span className="font-mono text-text-primary">{formattedDate}</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-1 text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuth("login");
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-text-primary hover:bg-surface-hover flex items-center gap-2.5 transition-colors btn-press"
            >
              <UserCheck className="w-3.5 h-3.5 text-accent" />
              <span>Ganti Akun</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuth("register");
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-text-primary hover:bg-surface-hover flex items-center gap-2.5 transition-colors btn-press"
            >
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span>Daftar Akun Baru</span>
            </button>

            <div className="h-px bg-border my-1" />

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-rose-300 hover:bg-rose-500/15 flex items-center gap-2.5 transition-colors btn-press"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
