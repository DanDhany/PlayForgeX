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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-card border border-white/[0.12] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-surface/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
                Pilihan Ekspor ke {targetName}
              </h3>
              <p className="text-[11px] text-slate-400">
                {trackCount} lagu siap ditransfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Note if matching is still running */}
          {isMatching && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-amber-400" />
              <span>
                Pencocokan masih berjalan di background. Anda akan mentransfer {trackCount} lagu yang sudah siap saat ini.
              </span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2.5 p-1 bg-surface rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setMode("create")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                mode === "create"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Baru</span>
            </button>
            <button
              onClick={() => setMode("existing")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                mode === "existing"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FolderInput className="w-4 h-4" />
              <span>Tambah ke Existing</span>
            </button>
          </div>

          {/* Create New Mode */}
          {mode === "create" && (
            <div className="space-y-3 animate-fade-in">
              <label className="block text-xs font-medium text-slate-300">
                Nama Playlist Baru di {targetName}
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                placeholder="Contoh: My Favorite Hits"
                className="w-full bg-surface border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                MirrorSong akan membuat playlist baru di akun {targetName} Anda dan memasukkan seluruh lagu yang cocok ke dalamnya.
              </p>
            </div>
          )}

          {/* Add to Existing Mode */}
          {mode === "existing" && (
            <div className="space-y-3 animate-fade-in flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Pilih Playlist Tujuan di {targetName}
                </label>
                <button
                  onClick={loadDestinationPlaylists}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Refresh
                </button>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari playlist tujuan..."
                  className="w-full bg-surface border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                />
              </div>

              {/* Playlist List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-white/[0.06] rounded-xl p-1.5 bg-surface/40">
                {isLoadingPlaylists ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Memuat playlist {targetName}...</span>
                  </div>
                ) : filteredPlaylists.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Tidak ada playlist yang ditemukan di {targetName}.
                  </div>
                ) : (
                  filteredPlaylists.map((pl) => {
                    const isSelected = selectedPlaylistId === pl.id;
                    return (
                      <div
                        key={pl.id}
                        onClick={() => setSelectedPlaylistId(pl.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? "bg-primary/15 border-primary/40 text-white"
                            : "bg-card/60 hover:bg-card border-white/[0.04] text-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-surface border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {pl.thumbnailUrl ? (
                              <img src={pl.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Disc3 className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-white">
                              {pl.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {pl.trackCount !== undefined ? `${pl.trackCount} lagu` : "Playlist"}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {selectedPlaylist && (
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    Lagu akan ditambahkan ke playlist <strong>"{selectedPlaylist.title}"</strong> tanpa menghapus lagu yang sudah ada sebelumnya.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] bg-surface/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Batal
          </button>

          <button
            onClick={handleStart}
            disabled={mode === "existing" && !selectedPlaylistId}
            className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/25 flex items-center gap-2 btn-press transition"
          >
            <span>Mulai Transfer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
