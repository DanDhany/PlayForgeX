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
import { PlaylistSummary, PlatformType } from "../../shared/types";
import { useLanguage } from "../context/LanguageContext";
import { getPlatformMeta } from "../utils/platform-meta";

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
  targetPlatform: PlatformType | string;
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

  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [mode, setMode] = useState<"create" | "existing">("create");
  const [playlistTitle, setPlaylistTitle] = useState(defaultTitle);
  const [existingPlaylists, setExistingPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const targetName = getPlatformMeta(targetPlatform).name;

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
        alert(t("modal.selectDestWarn"));
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

      <div className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[82dvh] animate-sheet-up md:animate-dialog-in pb-safe">
        {/* iOS Drag Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="px-4 py-3 md:px-5 md:py-3.5 border-b border-border flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <ListPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-text-primary">
                {t("modal.exportTitle", { platform: targetName })}
              </h3>
              <p className="text-[11px] text-text-secondary">
                {t("common.tracks", { count: trackCount })} {isEn ? "ready to transfer" : "siap ditransfer"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover btn-press transition-colors"
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
                {isEn
                  ? `Matching is still in progress in background. You will transfer the ${trackCount} songs currently ready.`
                  : `Pencocokan masih berjalan di latar belakang. Anda akan mentransfer ${trackCount} lagu yang sudah siap saat ini.`}
              </span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 p-0.5 bg-surface-elevated rounded-lg border border-border text-xs">
            <button
              onClick={() => setMode("create")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium transition-colors btn-press ${
                mode === "create"
                  ? "bg-accent text-background font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isEn ? "Create New Playlist" : "Buat Playlist Baru"}</span>
            </button>
            <button
              onClick={() => setMode("existing")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium transition-colors btn-press ${
                mode === "existing"
                  ? "bg-accent text-background font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>{isEn ? "Existing Playlist" : "Playlist yang Ada"}</span>
            </button>
          </div>

          {/* Create New Mode */}
          {mode === "create" && (
            <div className="space-y-2.5 animate-fade-in pt-1">
              <label className="block text-xs font-medium text-text-secondary">
                {isEn ? "New Playlist Name" : "Nama Playlist Baru"}
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                placeholder={isEn ? "Enter playlist title..." : "Masukkan judul playlist..."}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs md:text-sm text-text-primary focus:outline-none focus:border-accent transition"
                autoFocus
              />
              <p className="text-[11px] text-text-secondary">
                {isEn
                  ? `A new playlist will be created automatically in your ${targetName} account containing ${trackCount} selected tracks.`
                  : `Playlist baru akan dibuat otomatis di akun ${targetName} Anda dan diisi ${trackCount} lagu terpilih.`}
              </p>
            </div>
          )}

          {/* Existing Playlist Mode */}
          {mode === "existing" && (
            <div className="space-y-2.5 animate-fade-in pt-1">
              <label className="block text-xs font-medium text-text-secondary">
                {t("modal.selectDest", { platform: targetName })}
              </label>

              {/* Search box for existing playlists */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder={t("sidebar.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Playlist List */}
              <div className="border border-border rounded-xl bg-surface-elevated max-h-52 overflow-y-auto divide-y divide-border">
                {isLoadingPlaylists ? (
                  <div className="p-6 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>{isEn ? `Loading ${targetName} playlists...` : `Memuat daftar playlist ${targetName}...`}</span>
                  </div>
                ) : filteredPlaylists.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-secondary">
                    {isEn ? "No playlists match your search." : "Tidak ada playlist yang cocok."}
                  </div>
                ) : (
                  filteredPlaylists.map((p) => {
                    const isSelected = selectedPlaylistId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlaylistId(p.id)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors btn-press ${
                          isSelected ? "bg-accent/15" : "hover:bg-surface-hover"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {p.thumbnailUrl ? (
                              <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <Disc3 className="w-4 h-4 text-text-secondary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-medium text-text-primary truncate">{p.title}</h4>
                            <p className="text-[10px] text-text-secondary">
                              {p.trackCount !== undefined ? t("common.tracks", { count: p.trackCount }) : "Playlist"}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {selectedPlaylist && (
                <div className="p-2.5 rounded-lg bg-surface border border-border text-[11px] text-text-secondary flex items-center gap-2">
                  <span className="text-accent font-medium">{t("common.tracks", { count: trackCount })}</span> {isEn ? "will be added to playlist " : "akan ditambahkan ke playlist "}
                  <strong className="text-text-primary truncate">&quot;{selectedPlaylist.title}&quot;</strong>.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 border-t border-border flex items-center justify-end space-x-2.5 bg-surface-elevated">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover btn-press transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleStart}
            disabled={mode === "existing" && !selectedPlaylistId}
            className="px-4 py-2 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 flex items-center space-x-1.5 btn-press shadow-sm"
          >
            <span>{mode === "create" ? (isEn ? "Create & Transfer" : "Buat & Transfer") : (isEn ? "Append to Playlist" : "Gabung ke Playlist")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
