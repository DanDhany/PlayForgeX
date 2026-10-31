import React from "react";
import { Disc3, CheckCircle2, AlertCircle, LogIn, LogOut, RefreshCw } from "lucide-react";
import { ServiceAuthStatus } from "../../shared/types";

interface HeaderProps {
  authStatus: ServiceAuthStatus;
  isLoadingYt: boolean;
  isLoadingApple: boolean;
  onLoginYouTube: () => void;
  onLoginApple: () => void;
  onLogout: (service: "youtube" | "apple") => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  authStatus,
  isLoadingYt,
  isLoadingApple,
  onLoginYouTube,
  onLoginApple,
  onLogout,
  onRefresh,
}) => {
  return (
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between select-none">
      {/* Brand & App Info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Disc3 className="w-6 h-6 text-white animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-semibold tracking-tight text-white">MirrorSong</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-border/60 text-slate-300 rounded border border-border">
              Original Title 1st
            </span>
          </div>
          <p className="text-xs text-slate-400">Zero-Dev-Key Playlist Studio • YTM ➔ Apple Music</p>
        </div>
      </div>

      {/* Account Connections (Cookie/Modal Based) */}
      <div className="flex items-center space-x-3">
        {/* YouTube Music Status Pill */}
        <div className="flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-medium text-slate-200">YouTube Music</span>
          {authStatus.youtube.connected ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-border/60">
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {authStatus.youtube.playlistCount || 0} Playlists
              </span>
              <button
                onClick={() => onLogout("youtube")}
                title="Disconnect YouTube Music"
                className="text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginYouTube}
              disabled={isLoadingYt}
              className="ml-2 px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 rounded font-medium flex items-center gap-1 transition"
            >
              {isLoadingYt ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <LogIn className="w-3 h-3" />
              )}
              Modal Login
            </button>
          )}
        </div>

        {/* Apple Music Status Pill */}
        <div className="flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-medium text-slate-200">Apple Music</span>
          {authStatus.apple.connected ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-border/60">
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Storefront: {authStatus.apple.storefront?.toUpperCase() || "US"}
              </span>
              <button
                onClick={() => onLogout("apple")}
                title="Disconnect Apple Music"
                className="text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginApple}
              disabled={isLoadingApple}
              className="ml-2 px-2.5 py-1 bg-primary/20 hover:bg-primary/30 text-rose-300 hover:text-rose-200 border border-primary/30 rounded font-medium flex items-center gap-1 transition"
            >
              {isLoadingApple ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <LogIn className="w-3 h-3" />
              )}
              Modal Login
            </button>
          )}
        </div>

        {/* Global Refresh Button */}
        <button
          onClick={onRefresh}
          title="Refresh Connections and Playlists"
          className="p-2 bg-card hover:bg-card-hover border border-border rounded-lg text-slate-400 hover:text-slate-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
