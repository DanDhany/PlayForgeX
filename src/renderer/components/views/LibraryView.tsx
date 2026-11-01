import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  Disc3,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { AccountConnection, PlaylistSummary } from "../../../shared/types";

interface LibraryViewProps {
  accounts: AccountConnection[];
  playlists: (PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: "youtube" | "apple" })[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectForTransfer: (playlist: PlaylistSummary, accountId?: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  accounts,
  playlists,
  isLoading,
  onRefresh,
  onSelectForTransfer,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredPlaylists = playlists.filter((pl) => {
    if (selectedAccountId !== "all" && pl.accountId && pl.accountId !== selectedAccountId) {
      return false;
    }
    if (!search.trim()) return true;
    return pl.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-text-primary">
            Eksplorasi Library Playlist
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Lihat seluruh playlist dari semua akun terhubung dalam satu tempat terpadu.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-text-primary font-medium flex items-center gap-1.5 btn-press self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-accent" : "text-text-secondary"}`} />
          <span>{isLoading ? "Menyinkronkan..." : "Sinkronkan Library"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-text-secondary" />
          <input
            type="text"
            placeholder="Cari nama playlist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        {/* Account Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedAccountId("all")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors btn-press ${
              selectedAccountId === "all"
                ? "bg-accent/20 text-accent border border-accent/30 font-semibold"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Semua Akun ({playlists.length})
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors btn-press flex items-center gap-1.5 ${
                selectedAccountId === acc.id
                  ? "bg-accent/20 text-accent border border-accent/30 font-semibold"
                  : "bg-surface border border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  acc.platform === "youtube" ? "bg-red-500" : "bg-accent"
                }`}
              />
              <span>{acc.localAlias}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Playlist Grid */}
      {filteredPlaylists.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border space-y-3 bg-surface/50">
          <FolderOpen className="w-8 h-8 text-text-secondary/50 mx-auto" />
          <div className="text-xs text-text-secondary">Tidak ada playlist yang ditemukan.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between space-y-3 hover:border-border/90 transition-colors shadow-sm group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                  {pl.thumbnailUrl ? (
                    <img
                      src={pl.thumbnailUrl}
                      alt={pl.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Disc3 className="w-6 h-6 text-text-secondary/50" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs md:text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                    {pl.title}
                  </h4>
                  <div className="text-[11px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                    <span>{pl.trackCount !== undefined ? `${pl.trackCount} lagu` : "—"}</span>
                    {pl.accountAlias && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">{pl.accountAlias}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-medium ${
                    pl.platform === "youtube"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {pl.platform === "youtube" ? "YouTube Music" : "Apple Music"}
                </span>

                <button
                  onClick={() => onSelectForTransfer(pl, pl.accountId)}
                  className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-text-primary font-medium flex items-center gap-1 btn-press"
                >
                  <span>Pilih Transfer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-accent" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
