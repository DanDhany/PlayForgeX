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
import { useLanguage } from "../../context/LanguageContext";

interface UserProfileMenuProps {
  currentUser?: User | null;
  onOpenAuth: (initialTab?: "login" | "register") => void;
  onLogout: () => void;
  compact?: boolean;
  dropUp?: boolean;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  compact = false,
  dropUp = false,
}) => {
  const { t, lang } = useLanguage();
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
        className={`rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-medium text-text-primary flex items-center gap-2 btn-press transition-colors shadow-sm ${
          compact ? "p-1.5" : "w-full px-3 py-1.5 justify-center"
        }`}
        title={t("auth.loginOrRegister")}
      >
        <LogIn className="w-3.5 h-3.5 text-accent" />
        {!compact && <span>{t("auth.loginOrRegister")}</span>}
      </button>
    );
  }

  // Derive initials for avatar
  const initials = currentUser.username
    ? currentUser.username.slice(0, 2).toUpperCase()
    : "PX";

  const isAdmin = currentUser.role === "admin";

  const formattedDate = currentUser.createdAt
    ? new Date(Number(currentUser.createdAt)).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : t("auth.justNow");

  return (
    <div className={`relative ${compact ? "inline-block" : "block w-full"} text-left`} ref={menuRef}>
      {/* Pill trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all btn-press border ${
          compact ? "p-1.5" : "w-full justify-between px-2.5 py-1.5"
        } ${
          isOpen
            ? "bg-surface-elevated border-accent/40 shadow-sm shadow-accent/10"
            : "bg-surface-elevated/70 hover:bg-surface-elevated border-border"
        }`}
        title={`${t("auth.signedInAs")}: ${currentUser.username} (${isAdmin ? "Admin" : "User"})`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar badge */}
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent font-mono flex-shrink-0">
            {initials}
          </div>

          {!compact && (
            <div className="flex items-center gap-1.5 min-w-0 truncate">
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
            </div>
          )}
        </div>

        {!compact && (
          <ChevronDown
            className={`w-3 h-3 text-text-secondary transition-transform flex-shrink-0 ${
              isOpen ? (dropUp ? "rotate-0" : "rotate-180") : dropUp ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{ maxHeight: "calc(100vh - 90px)" }}
          className={`absolute ${
            dropUp ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"
          } w-64 rounded-2xl bg-surface border border-border shadow-2xl overflow-y-auto z-[100] animate-dialog-in backdrop-blur-xl`}
        >
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
                    {isAdmin ? "Admin" : "User"}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary truncate mt-0.5 font-mono">
                  ID: {currentUser.id.slice(0, 14)}...
                </p>
              </div>
            </div>

            {/* Join date info */}
            <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-between text-[11px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-text-secondary/70" />
                <span>{t("auth.registered")}</span>
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
              <span>{t("auth.switchAccount")}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAuth("register");
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-text-primary hover:bg-surface-hover flex items-center gap-2.5 transition-colors btn-press"
            >
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span>{t("auth.register")}</span>
            </button>

            <div className="h-px bg-border my-1" />

            {/* Logout button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-3 py-2 rounded-xl text-left text-rose-300 hover:bg-rose-500/15 flex items-center gap-2.5 transition-colors btn-press font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>{t("auth.logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
