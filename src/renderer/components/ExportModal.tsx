import React, { useState, useEffect } from "react";
import {
  X,
  PlusCircle,
  FolderInput,
  Search,
  Disc3,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ListPlus,
} from "lucide-react";
import { PlaylistSummary } from "../../shared/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    mode: "create" | "existing";
    playlistTitle: string;
    existingPlaylistId?: string;
    existingPlaylistTitle?: string;
  }) => void;
  defaultTitle: string;
  targetPlatform: "apple" | "youtube";
  trackCount: number;
  isMatching?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle,
  targetPlatform,
  trackCount,
  isMatching = false,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<"create" | "existing">("create");
  const [playlistTitle, setPlaylistTitle] = useState(defaultTitle);
  const [existingPlaylists, setExistingPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const targetName = targetPlatform === "youtube" ? "YouTube Music" : "Apple Music";

  useEffect(() => {
    setPlaylistTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    if (mode === "existing" && existingPlaylists.length === 0) {
      loadDestinationPlaylists();
    }
  }, [mode]);

  const loadDestinationPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const res = await fetch(`/api/playlists?source=${targetPlatform}`);
      if (res.ok) {
        const data = await res.json();
        setExistingPlaylists(data);
        if (data.length > 0 && !selectedPlaylistId) {
          setSelectedPlaylistId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load destination playlists:", err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const filteredPlaylists = existingPlaylists.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPlaylist = existingPlaylists.find((p) => p.id === selectedPlaylistId);

  const handleStart = () => {
    if (mode === "create") {
      const title = playlistTitle.trim() || defaultTitle;
      onConfirm({
        mode: "create",
        playlistTitle: title,
      });
    } else {
      if (!selectedPlaylistId) {
        alert("Pilih salah satu playlist tujuan!");
        return;
      }
      onConfirm({
        mode: "existing",
        playlistTitle: selectedPlaylist?.title || "Playlist",
        existingPlaylistId: selectedPlaylistId,
        existingPlaylistTitle: selectedPlaylist?.title,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-surface border-t md:border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[82dvh] animate-sheet-up md:animate-dialog-in pb-safe">
        {/* iOS Drag Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="px-4 py-3 md:px-5 md:py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-card border border-white/[0.08] flex items-center justify-center text-primary">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-white">
                Ekspor ke {targetName}
              </h3>
              <p className="text-[11px] text-slate-400">
                {trackCount} lagu siap ditransfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] btn-press transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Note if matching is still running */}
          {isMatching && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-amber-400" />
              <span>
                Pencocokan masih berjalan di latar belakang. Anda akan mentransfer {trackCount} lagu yang sudah siap saat ini.
              </span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 p-0.5 bg-card rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => setMode("create")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium transition btn-press ${
                mode === "create"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Buat Baru</span>
            </button>
            <button
              onClick={() => setMode("existing")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium transition btn-press ${
                mode === "existing"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Playlist yang Ada</span>
            </button>
          </div>

          {/* Create New Mode */}
          {mode === "create" && (
            <div className="space-y-2.5 animate-fade-in pt-1">
              <label className="block text-xs font-medium text-slate-300">
                Nama Playlist Baru
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                placeholder="Nama playlist..."
                className="w-full bg-card border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                MirrorSong akan membuat playlist berstatus privat di {targetName} Anda dan memasukkan seluruh lagu yang cocok ke dalamnya.
              </p>
            </div>
          )}

          {/* Add to Existing Mode */}
          {mode === "existing" && (
            <div className="space-y-2.5 animate-fade-in pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Pilih Playlist Tujuan
                </label>
                <button
                  onClick={loadDestinationPlaylists}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Refresh
                </button>
              </div>

              {/* Search destination playlist */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter playlist tujuan..."
                  className="w-full bg-card border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition"
                />
              </div>

              {/* List of existing playlists */}
              <div className="border border-white/[0.08] rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-white/[0.04]">
                {isLoadingPlaylists ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Memuat playlist {targetName}...</span>
                  </div>
                ) : filteredPlaylists.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Tidak ditemukan playlist yang cocok.
                  </div>
                ) : (
                  filteredPlaylists.map((pl) => {
                    const isSelected = pl.id === selectedPlaylistId;
                    return (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => setSelectedPlaylistId(pl.id)}
                        className={`w-full text-left p-2.5 flex items-center justify-between space-x-3 transition btn-press ${
                          isSelected
                            ? "bg-primary/10 text-white"
                            : "hover:bg-card-hover text-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-card border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {pl.thumbnailUrl ? (
                              <img
                                src={pl.thumbnailUrl}
                                alt={pl.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Disc3 className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-medium truncate">{pl.title}</h5>
                            <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                              {pl.trackCount} lagu
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-3 md:px-5 md:py-3.5 border-t border-white/[0.08] bg-surface-elevated flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white btn-press transition"
          >
            Batal
          </button>
          <button
            onClick={handleStart}
            disabled={trackCount === 0 || (mode === "existing" && !selectedPlaylistId)}
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:bg-card disabled:text-slate-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 btn-press transition shadow-sm"
          >
            <span>Mulai Transfer ({trackCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
