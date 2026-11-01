import React, { useState } from "react";
import { Disc3, LogIn, LogOut, RefreshCw, Layers, ListMusic, ChevronDown, X, Sparkles } from "lucide-react";
import { ServiceAuthStatus, User } from "../../shared/types";
import { UserProfileMenu } from "./auth/UserProfileMenu";

interface HeaderProps {
  authStatus: ServiceAuthStatus;
  isLoadingYt: boolean;
  isLoadingApple: boolean;
  onLoginYouTube: () => void;
  onLoginApple: () => void;
  onLogout: (service: "youtube" | "apple") => void;
  onRefresh: () => void;
  onOpenLanding?: () => void;
  onToggleMobileDrawer?: () => void;
  activeMobileTab?: "playlists" | "review";
  onChangeMobileTab?: (tab: "playlists" | "review") => void;
  selectedPlaylistTitle?: string;
  matchedCount?: number;
  currentUser?: User | null;
  onOpenAuth?: (initialTab?: "login" | "register") => void;
  onUserLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  authStatus,
  isLoadingYt,
  isLoadingApple,
  onLoginYouTube,
  onLoginApple,
  onLogout,
  onRefresh,
  onOpenLanding,
  activeMobileTab = "playlists",
  onChangeMobileTab,
  matchedCount = 0,
  currentUser,
  onOpenAuth,
  onUserLogout,
}) => {
  const [isAccountsMenuOpen, setIsAccountsMenuOpen] = useState(false);

  const bothConnected = authStatus.youtube.connected && authStatus.apple.connected;

  return (
    <>
      <header className="h-14 border-b border-white/[0.08] bg-surface/95 backdrop-blur-md px-3.5 md:px-6 flex items-center justify-between select-none sticky top-0 z-40 transition-colors">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-card border border-white/[0.1] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Disc3 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5 truncate">
              TuneBridge
            </h1>
          </div>
        </div>

        {/* Mobile View Switcher (Segmented Control on < md) */}
        {onChangeMobileTab && (
          <div className="md:hidden flex items-center bg-card p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => onChangeMobileTab("playlists")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 btn-press ${
                activeMobileTab === "playlists"
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Playlist</span>
            </button>
            <button
              onClick={() => onChangeMobileTab("review")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 btn-press ${
                activeMobileTab === "review"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Review</span>
              {matchedCount > 0 && (
                <span className="text-[10px] px-1 bg-black/30 rounded-full font-mono tabular-nums">
                  {matchedCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Desktop Account Status & Connections */}
        <div className="hidden md:flex items-center space-x-2.5">
          {/* YouTube Connection Pill */}
          <div className="flex items-center bg-card border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs">
            <div
              className={`w-1.5 h-1.5 rounded-full mr-2 ${
                authStatus.youtube.connected ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-slate-600"
              }`}
            />
            <span className="font-medium text-slate-300">YouTube</span>
            {authStatus.youtube.connected ? (
              <div className="flex items-center space-x-1 pl-2 ml-2 border-l border-white/[0.08]">
                <span className="text-emerald-400 text-[11px] font-mono tabular-nums">
                  {authStatus.youtube.playlistCount || 0}
                </span>
                <button
                  onClick={() => onLogout("youtube")}
                  title="Disconnect YouTube Music"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition btn-press"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginYouTube}
                disabled={isLoadingYt}
                className="ml-2 px-2 py-0.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 rounded text-[11px] font-medium flex items-center gap-1 btn-press transition"
              >
                {isLoadingYt ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <LogIn className="w-2.5 h-2.5" />}
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Apple Connection Pill */}
          <div className="flex items-center bg-card border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs">
            <div
              className={`w-1.5 h-1.5 rounded-full mr-2 ${
                authStatus.apple.connected ? "bg-primary shadow-[0_0_8px_rgba(250,45,72,0.5)]" : "bg-slate-600"
              }`}
            />
            <span className="font-medium text-slate-300">Apple</span>
            {authStatus.apple.connected ? (
              <div className="flex items-center space-x-1 pl-2 ml-2 border-l border-white/[0.08]">
                <span className="text-emerald-400 text-[11px] font-mono tabular-nums">
                  {authStatus.apple.playlistCount || 0}
                </span>
                <button
                  onClick={() => onLogout("apple")}
                  title="Disconnect Apple Music"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition btn-press"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginApple}
                disabled={isLoadingApple}
                className="ml-2 px-2 py-0.5 bg-primary/15 hover:bg-primary/25 text-rose-300 border border-primary/30 rounded text-[11px] font-medium flex items-center gap-1 btn-press transition"
              >
                {isLoadingApple ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <LogIn className="w-2.5 h-2.5" />}
                <span>Login</span>
              </button>
            )}
          </div>

          {onOpenLanding && (
            <button
              onClick={onOpenLanding}
              title="Buka Landing Page TuneBridge"
              className="px-2.5 py-1 rounded-lg bg-card border border-white/[0.08] text-xs text-slate-300 hover:text-white hover:border-white/[0.2] btn-press transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Tentang</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            title="Refresh sync status"
            className="p-1.5 rounded-lg bg-card border border-white/[0.08] text-slate-400 hover:text-white hover:bg-card-hover btn-press transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Menu */}
          <UserProfileMenu
            currentUser={currentUser}
            onOpenAuth={onOpenAuth || (() => {})}
            onLogout={onUserLogout || (() => {})}
          />
        </div>

        {/* Mobile Accounts Hub Trigger (Compact on < md) */}
        <div className="md:hidden flex items-center space-x-1.5">
          <UserProfileMenu
            compact
            currentUser={currentUser}
            onOpenAuth={onOpenAuth || (() => {})}
            onLogout={onUserLogout || (() => {})}
          />
          <button
            onClick={() => setIsAccountsMenuOpen(true)}
            className={`px-2 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 btn-press transition ${
              bothConnected
                ? "bg-card border-white/[0.08] text-slate-300"
                : "bg-primary/10 border-primary/30 text-rose-300"
            }`}
          >
            <div className="flex items-center -space-x-1">
              <span className={`w-2 h-2 rounded-full border border-surface ${authStatus.youtube.connected ? "bg-red-500" : "bg-slate-600"}`} />
              <span className={`w-2 h-2 rounded-full border border-surface ${authStatus.apple.connected ? "bg-primary" : "bg-slate-600"}`} />
            </div>
            <span className="text-[11px] font-medium">Akun</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Mobile Accounts Bottom Sheet / Drawer */}
      {isAccountsMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            onClick={() => setIsAccountsMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
          />
          <div className="relative bg-surface border-t border-white/[0.1] rounded-t-2xl p-5 space-y-4 animate-sheet-up pb-safe">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-2 mb-2" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Status Koneksi Layanan</h3>
              <button
                onClick={() => setIsAccountsMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* YouTube Music */}
              <div className="p-3 rounded-xl bg-card border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${authStatus.youtube.connected ? "bg-red-500 shadow-sm shadow-red-500" : "bg-slate-600"}`} />
                  <div>
                    <h4 className="text-xs font-semibold text-white">YouTube Music</h4>
                    <p className="text-[11px] text-slate-400">
                      {authStatus.youtube.connected
                        ? `${authStatus.youtube.playlistCount || 0} playlist terdeteksi`
                        : "Belum terhubung"}
                    </p>
                  </div>
                </div>
                {authStatus.youtube.connected ? (
                  <button
                    onClick={() => {
                      onLogout("youtube");
                      setIsAccountsMenuOpen(false);
                    }}
                    className="px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg btn-press"
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onLoginYouTube();
                      setIsAccountsMenuOpen(false);
                    }}
                    disabled={isLoadingYt}
                    className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg font-medium btn-press"
                  >
                    {isLoadingYt ? "Menghubungkan..." : "Login"}
                  </button>
                )}
              </div>

              {/* Apple Music */}
              <div className="p-3 rounded-xl bg-card border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${authStatus.apple.connected ? "bg-primary shadow-sm shadow-primary" : "bg-slate-600"}`} />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Apple Music</h4>
                    <p className="text-[11px] text-slate-400">
                      {authStatus.apple.connected
                        ? `${authStatus.apple.playlistCount || 0} playlist terdeteksi`
                        : "Belum terhubung"}
                    </p>
                  </div>
                </div>
                {authStatus.apple.connected ? (
                  <button
                    onClick={() => {
                      onLogout("apple");
                      setIsAccountsMenuOpen(false);
                    }}
                    className="px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg btn-press"
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onLoginApple();
                      setIsAccountsMenuOpen(false);
                    }}
                    disabled={isLoadingApple}
                    className="px-3 py-1.5 text-xs text-white bg-primary rounded-lg font-medium btn-press"
                  >
                    {isLoadingApple ? "Menghubungkan..." : "Login"}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onRefresh();
                setIsAccountsMenuOpen(false);
              }}
              className="w-full py-2 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 btn-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status Koneksi</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
