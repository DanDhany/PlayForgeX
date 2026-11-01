import React, { useState } from "react";
import { Search, RefreshCw, X, ChevronRight, Disc3 } from "lucide-react";
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
  isMobileInline?: boolean; // When true, renders as full view on mobile
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
  isMobileInline = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaylists = playlists.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={`
        ${isMobileInline ? "flex w-full md:w-80 lg:w-84" : isOpenMobile ? "fixed inset-0 z-50 flex" : "hidden md:flex md:w-80 lg:w-84"}
        border-r border-white/[0.08] bg-surface flex-col h-[calc(100dvh-3.5rem)] select-none flex-shrink-0 transition-colors
      `}
    >
      {/* Sidebar Header & Controls */}
      <div className="p-3.5 md:p-4 border-b border-white/[0.08] space-y-3 bg-surface/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Koleksi Playlist
            </span>
            <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 bg-white/[0.06] text-slate-300 rounded border border-white/[0.08]">
              {playlists.length}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onRefreshPlaylists}
              disabled={isLoading}
              title="Refresh playlist list"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition btn-press"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {onCloseMobile && !isMobileInline && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] btn-press"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Source Switcher (YouTube Music ⇄ Apple Music) */}
        {onChangeSource && (
          <div className="grid grid-cols-2 p-0.5 bg-card rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => onChangeSource("youtube")}
              className={`py-1.5 px-2 rounded-md font-medium transition flex items-center justify-center gap-1.5 btn-press ${
                activeSource === "youtube"
                  ? "bg-red-500/15 text-red-300 border border-red-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>YouTube</span>
              {youtubeCount !== undefined && (
                <span className="text-[10px] font-mono tabular-nums opacity-75">
                  ({youtubeCount})
                </span>
              )}
            </button>
            <button
              onClick={() => onChangeSource("apple")}
              className={`py-1.5 px-2 rounded-md font-medium transition flex items-center justify-center gap-1.5 btn-press ${
                activeSource === "apple"
                  ? "bg-primary/15 text-rose-300 border border-primary/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Apple</span>
              {appleCount !== undefined && (
                <span className="text-[10px] font-mono tabular-nums opacity-75">
                  ({appleCount})
                </span>
              )}
            </button>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama playlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-white/[0.08] rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white/20 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Playlist List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="text-slate-300">Memuat playlist...</span>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="py-16 px-4 text-center text-slate-500 text-xs leading-relaxed">
            {playlists.length === 0
              ? `Belum ada playlist dari ${activeSource === "youtube" ? "YouTube Music" : "Apple Music"}. Pastikan akun sudah terhubung.`
              : "Tidak ada playlist yang cocok dengan pencarian."}
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
                className={`w-full text-left p-2 rounded-xl flex items-center space-x-3 transition btn-press group ${
                  isSelected
                    ? "bg-card-active border border-primary/40 shadow-sm"
                    : "hover:bg-card border border-transparent"
                }`}
              >
                {/* Artwork */}
                <div className="w-11 h-11 rounded-lg bg-card-hover border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {pl.thumbnailUrl ? (
                    <img
                      src={pl.thumbnailUrl}
                      alt={pl.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc3 className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-xs font-medium truncate ${
                      isSelected ? "text-white font-semibold" : "text-slate-200 group-hover:text-white"
                    }`}
                  >
                    {pl.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono tabular-nums">
                      {pl.trackCount > 0 ? `${pl.trackCount} lagu` : "Playlist"}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                    isSelected ? "text-primary translate-x-0.5" : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
