import React, { useState } from "react";
import { ListMusic, Search, CheckSquare, Square, Music, RefreshCw } from "lucide-react";
import { PlaylistSummary } from "../../shared/types";

interface PlaylistSidebarProps {
  playlists: PlaylistSummary[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlist: PlaylistSummary) => void;
  isLoading: boolean;
  onRefreshPlaylists: () => void;
}

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  isLoading,
  onRefreshPlaylists,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlaylists = playlists.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-80 border-r border-border bg-surface flex flex-col h-[calc(100vh-4rem)]">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ListMusic className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              YTM Playlists ({playlists.length})
            </h2>
          </div>
          <button
            onClick={onRefreshPlaylists}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 transition p-1"
            title="Reload Playlists"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search Playlists */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 transition"
          />
        </div>
      </div>

      {/* Playlists List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            <span>Loading playlists from YouTube Music...</span>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            {playlists.length === 0
              ? "No playlists found. Please connect YouTube Music above."
              : "No playlists match your search."}
          </div>
        ) : (
          filteredPlaylists.map((pl) => {
            const isSelected = selectedPlaylistId === pl.id;
            return (
              <button
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className={`w-full text-left p-2.5 rounded-lg flex items-center space-x-3 transition group ${
                  isSelected
                    ? "bg-card-hover border border-slate-600/60 shadow-sm"
                    : "hover:bg-card border border-transparent"
                }`}
              >
                {/* Cover Art */}
                <div className="w-11 h-11 rounded-md bg-card border border-border/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {pl.thumbnailUrl ? (
                    <img
                      src={pl.thumbnailUrl}
                      alt={pl.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {/* Playlist Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-xs font-medium truncate ${
                      isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {pl.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {pl.trackCount > 0 ? `${pl.trackCount} tracks` : "Playlist"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
