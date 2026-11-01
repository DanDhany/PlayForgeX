import React from "react";
import { Disc3, CheckCircle2, LogIn, LogOut, RefreshCw, Menu } from "lucide-react";
import { ServiceAuthStatus } from "../../shared/types";

interface HeaderProps {
  authStatus: ServiceAuthStatus;
  isLoadingYt: boolean;
  isLoadingApple: boolean;
  onLoginYouTube: () => void;
  onLoginApple: () => void;
  onLogout: (service: "youtube" | "apple") => void;
  onRefresh: () => void;
  onToggleMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  authStatus,
  isLoadingYt,
  isLoadingApple,
  onLoginYouTube,
  onLoginApple,
  onLogout,
  onRefresh,
  onToggleMobileDrawer,
}) => {
  return (
    <header className="h-16 md:h-18 border-b border-white/[0.08] bg-surface/90 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between select-none sticky top-0 z-40 transition-all">
      {/* Brand & Mobile Drawer Trigger */}
      <div className="flex items-center space-x-3">
        {onToggleMobileDrawer && (
          <button
            onClick={onToggleMobileDrawer}
            className="md:hidden p-2 rounded-xl bg-card border border-white/[0.08] text-slate-300 hover:text-white btn-press"
            aria-label="Toggle Playlists Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="relative group">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-primary flex items-center justify-center shadow-lg shadow-primary/25 border border-white/20">
            <Disc3 className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface animate-pulse" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              MirrorSong
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase bg-primary/15 text-rose-300 border border-primary/25 rounded-md">
                Studio
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Original Title Priority • YTM ➔ Apple Music
          </p>
        </div>
      </div>

      {/* Account Connections (Responsive Pills) */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* YouTube Music Pill */}
        <div className="flex items-center bg-card/90 border border-white/[0.08] rounded-xl px-2.5 md:px-3 py-1.5 text-xs shadow-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-500/50" />
          <span className="font-semibold text-slate-200 hidden sm:inline">YouTube Music</span>
          <span className="font-semibold text-slate-200 sm:hidden">YTM</span>

          {authStatus.youtube.connected ? (
            <div className="flex items-center space-x-1.5 pl-2 ml-2 border-l border-white/[0.08]">
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{authStatus.youtube.playlistCount || 0} Playlists</span>
              </span>
              <button
                onClick={() => onLogout("youtube")}
                title="Disconnect YouTube Music"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] transition"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginYouTube}
              disabled={isLoadingYt}
              className="ml-2 px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/30 rounded-lg font-medium text-[11px] flex items-center gap-1.5 btn-press transition"
            >
              {isLoadingYt ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <LogIn className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Connect</span>
            </button>
          )}
        </div>

        {/* Apple Music Pill */}
        <div className="flex items-center bg-card/90 border border-white/[0.08] rounded-xl px-2.5 md:px-3 py-1.5 text-xs shadow-sm">
          <div className="w-2 h-2 rounded-full bg-primary mr-2 shadow-sm shadow-primary/50" />
          <span className="font-semibold text-slate-200 hidden sm:inline">Apple Music</span>
          <span className="font-semibold text-slate-200 sm:hidden">Apple</span>

          {authStatus.apple.connected ? (
            <div className="flex items-center space-x-1.5 pl-2 ml-2 border-l border-white/[0.08]">
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{authStatus.apple.storefront?.toUpperCase() || "US"}</span>
              </span>
              <button
                onClick={() => onLogout("apple")}
                title="Disconnect Apple Music"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] transition"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginApple}
              disabled={isLoadingApple}
              className="ml-2 px-2.5 py-1 bg-primary/20 hover:bg-primary/30 text-rose-300 hover:text-white border border-primary/30 rounded-lg font-medium text-[11px] flex items-center gap-1.5 btn-press transition"
            >
              {isLoadingApple ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <LogIn className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Connect</span>
            </button>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          title="Refresh Connections"
          className="p-2 md:p-2.5 bg-card hover:bg-card-hover border border-white/[0.08] rounded-xl text-slate-400 hover:text-white btn-press transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>
    </header>
  );
};
