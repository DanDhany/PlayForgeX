import React, { useState } from "react";
import { ListMusic, Search, Music, RefreshCw, X, ChevronRight } from "lucide-react";
import { PlaylistSummary } from "../../shared/types";

interface PlaylistSidebarProps {
  playlists: PlaylistSummary[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlist: PlaylistSummary) => void;
  isLoading: boolean;
  onRefreshPlaylists: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  activeSource?: "youtube" | "apple";
  onChangeSource?: (source: "youtube" | "apple") => void;
  youtubeCount?: number;
  appleCount?: number;
}

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  isLoading,
  onRefreshPlaylists,
  isOpenMobile = false,
  onCloseMobile,
  activeSource = "youtube",
  onChangeSource,
  youtubeCount,
  appleCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaylists = playlists.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container: Fixed slide-over on mobile, static on desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-0 w-80 md:w-84 border-r border-white/[0.08] bg-surface flex flex-col h-[100dvh] md:h-[calc(100dvh-4.5rem)] transition-transform duration-300 ease-out ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/[0.08] space-y-3 bg-surface/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-card border border-white/[0.08] text-slate-400">
                <ListMusic className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Playlists ({playlists.length})
              </h2>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={onRefreshPlaylists}
                disabled={isLoading}
                className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/[0.05] btn-press"
                title="Reload Playlists"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              {onCloseMobile && (
                <button
                  onClick={onCloseMobile}
                  className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] btn-press"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Service Switcher Tabs: YouTube Music vs Apple Music */}
          {onChangeSource && (
            <div className="grid grid-cols-2 p-1 bg-card/90 border border-white/[0.08] rounded-xl text-xs">
              <button
                onClick={() => onChangeSource("youtube")}
                className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                  activeSource === "youtube"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>YouTube</span>
                {youtubeCount !== undefined && (
                  <span className="text-[10px] opacity-75 font-mono">({youtubeCount})</span>
                )}
              </button>
              <button
                onClick={() => onChangeSource("apple")}
                className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                  activeSource === "apple"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Apple</span>
                {appleCount !== undefined && (
                  <span className="text-[10px] opacity-75 font-mono">({appleCount})</span>
                )}
              </button>
            </div>
          )}

          {/* Search Playlists */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card/80 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary/60 transition shadow-inner"
            />
          </div>
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {isLoading ? (
            <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="font-medium text-slate-300">Fetching your YouTube Music library...</span>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs leading-relaxed">
              {playlists.length === 0
                ? "No playlists loaded. Click 'Connect' in the top bar to sign in to YouTube Music."
                : "No playlists match your search."}
            </div>
          ) : (
            filteredPlaylists.map((pl) => {
              const isSelected = selectedPlaylistId === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => {
                    onSelectPlaylist(pl);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition group btn-press ${
                    isSelected
                      ? "bg-card-hover border border-primary/50 shadow-md shadow-primary/5"
                      : "hover:bg-card/70 border border-transparent"
                  }`}
                >
                  {/* Playlist Art */}
                  <div className="relative w-12 h-12 rounded-xl bg-card border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                    {pl.thumbnailUrl ? (
                      <img
                        src={pl.thumbnailUrl}
                        alt={pl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <Music className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  {/* Playlist Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-xs font-semibold truncate ${
                        isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                      }`}
                    >
                      {pl.title}
                    </h3>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="px-1.5 py-0.2 text-[10px] font-mono bg-white/[0.05] text-slate-400 rounded">
                        {pl.trackCount > 0 ? `${pl.trackCount} tracks` : "Playlist"}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isSelected ? "text-primary translate-x-0.5" : "text-slate-600 group-hover:text-slate-400"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
