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
  Check,
  FileDown,
} from "lucide-react";
import { PlaylistSummary, PlatformType, AccountConnection } from "../../shared/types";
import { useLanguage } from "../context/LanguageContext";
import { getPlatformMeta } from "../utils/platform-meta";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    mode: "create" | "existing";
    playlistTitle: string;
    existingPlaylistId?: string;
    existingPlaylistTitle?: string;
    targetPlatform: PlatformType | string;
    targetAccountId?: string;
  }) => void;
  defaultTitle: string;
  targetPlatform: PlatformType | string;
  availableAccounts?: AccountConnection[];
  trackCount: number;
  isMatching?: boolean;
  onChangeTargetPlatform?: (platform: PlatformType | string) => void;
}

const SELECTABLE_EXPORT_PLATFORMS: { id: PlatformType; name: string }[] = [
  { id: "apple", name: "Apple Music" },
  { id: "youtube", name: "YouTube Music" },
  { id: "spotify", name: "Spotify" },
  { id: "youtube_video", name: "YouTube Video" },
  { id: "file", name: "File / Snapshot" },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle,
  targetPlatform,
  availableAccounts = [],
  trackCount,
  isMatching = false,
  onChangeTargetPlatform,
}) => {
  if (!isOpen) return null;

  const { t, lang } = useLanguage();
  const isEn = lang === "en";

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | string>(targetPlatform);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(() => {
    const acc = availableAccounts.find((a) => a.platform === targetPlatform);
    return acc?.id;
  });

  const [mode, setMode] = useState<"create" | "existing">("create");
  const [playlistTitle, setPlaylistTitle] = useState(defaultTitle);
  const [existingPlaylists, setExistingPlaylists] = useState<PlaylistSummary[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const targetMeta = getPlatformMeta(selectedPlatform);
  const targetName = targetMeta.name;

  useEffect(() => {
    setSelectedPlatform(targetPlatform);
    const acc = availableAccounts.find((a) => a.platform === targetPlatform);
    setSelectedAccountId(acc?.id);
  }, [targetPlatform, availableAccounts]);

  useEffect(() => {
    setPlaylistTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    if (selectedPlatform === "file") {
      setMode("create");
    }
  }, [selectedPlatform]);

  useEffect(() => {
    if (mode === "existing") {
      loadDestinationPlaylists();
    }
  }, [mode, selectedPlatform, selectedAccountId]);

  const loadDestinationPlaylists = async () => {
    if (selectedPlatform === "file") {
      setExistingPlaylists([]);
      return;
    }
    setIsLoadingPlaylists(true);
    try {
      const queryParam = selectedAccountId
        ? `source=${selectedPlatform}&accountId=${selectedAccountId}`
        : `source=${selectedPlatform}`;
      const res = await fetch(`/api/playlists?${queryParam}`);
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

  const handleSelectPlatform = (platId: PlatformType | string) => {
    setSelectedPlatform(platId);
    const acc = availableAccounts.find((a) => a.platform === platId);
    setSelectedAccountId(acc?.id);
    setSelectedPlaylistId(null);
    if (platId === "file") {
      setMode("create");
    }
    onChangeTargetPlatform?.(platId);
  };

  const filteredPlaylists = existingPlaylists.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPlaylist = existingPlaylists.find((p) => p.id === selectedPlaylistId);

  const accountsForCurrentPlatform = availableAccounts.filter(
    (a) => a.platform === selectedPlatform
  );

  const handleStart = () => {
    if (mode === "create") {
      const title = playlistTitle.trim() || defaultTitle;
      onConfirm({
        mode: "create",
        playlistTitle: title,
        targetPlatform: selectedPlatform,
        targetAccountId: selectedAccountId,
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
        targetPlatform: selectedPlatform,
        targetAccountId: selectedAccountId,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[85dvh] animate-sheet-up md:animate-dialog-in pb-safe">
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
                {isEn ? `Export to ${targetName}` : `Ekspor ke ${targetName}`}
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

          {/* 1. Destination Platform Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                {isEn ? "Destination Platform" : "Platform Tujuan"}
              </label>
              <span className="text-[10px] text-text-secondary/70">
                {isEn ? "Select target platform" : "Pilih target tujuan"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SELECTABLE_EXPORT_PLATFORMS.map((plat) => {
                const isSelected = selectedPlatform === plat.id;
                const meta = getPlatformMeta(plat.id);
                const accCount = availableAccounts.filter((a) => a.platform === plat.id).length;

                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => handleSelectPlatform(plat.id)}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all btn-press ${
                      isSelected
                        ? "bg-accent/15 border-accent text-text-primary shadow-sm ring-1 ring-accent/30"
                        : "bg-surface-elevated/60 hover:bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: meta.brandColor }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{meta.name}</p>
                        <p className="text-[9px] text-text-secondary truncate">
                          {plat.id === "file"
                            ? (isEn ? "Offline snapshot" : "File snapshot")
                            : accCount > 0
                            ? `${accCount} ${isEn ? "account" : "akun"}`
                            : (isEn ? "Snapshot export" : "Ekspor snapshot")}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Destination Account Picker (if multiple accounts exist) */}
          {accountsForCurrentPlatform.length > 1 && (
            <div className="space-y-1.5 p-2.5 rounded-xl bg-surface-elevated border border-border">
              <label className="text-[11px] font-medium text-text-secondary block">
                {isEn ? "Destination Account" : "Akun Tujuan"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {accountsForCurrentPlatform.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors btn-press ${
                      selectedAccountId === acc.id
                        ? "bg-accent text-background border-accent font-semibold shadow-sm"
                        : "bg-surface border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {acc.localAlias}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Mode Selector Tabs */}
          {selectedPlatform === "file" ? (
            <div className="p-3 rounded-xl bg-surface-elevated border border-border text-xs text-text-secondary flex items-start gap-2.5">
              <FileDown className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-text-primary">
                  {isEn ? "Offline Snapshot Export" : "Ekspor Snapshot Offline"}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {isEn
                    ? "Will be saved as a high-fidelity local playlist collection, ready to preview in Library and export to JSON/M3U."
                    : "Akan disimpan sebagai koleksi playlist lokal di Library PlayForgeX, siap diputar atau diekspor ke JSON/M3U."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 p-0.5 bg-surface-elevated rounded-lg border border-border text-xs">
              <button
                type="button"
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
                type="button"
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
          )}

          {/* Create New Mode */}
          {mode === "create" && (
            <div className="space-y-2.5 animate-fade-in pt-1">
              <label className="block text-xs font-medium text-text-secondary">
                {isEn ? "Playlist Name" : "Nama Playlist"}
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
                  ? `A new playlist will be created in your ${targetName} library containing ${trackCount} selected tracks.`
                  : `Playlist baru akan dibuat di library ${targetName} Anda berisi ${trackCount} lagu terpilih.`}
              </p>
            </div>
          )}

          {/* Existing Playlist Mode */}
          {mode === "existing" && selectedPlatform !== "file" && (
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
              <div className="border border-border rounded-xl bg-surface-elevated max-h-48 overflow-y-auto divide-y divide-border">
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
            disabled={mode === "existing" && !selectedPlaylistId && selectedPlatform !== "file"}
            className="px-4 py-2 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 flex items-center space-x-1.5 btn-press shadow-sm"
          >
            <span>
              {mode === "create"
                ? (isEn ? `Transfer to ${targetName}` : `Transfer ke ${targetName}`)
                : (isEn ? "Append to Playlist" : "Gabung ke Playlist")}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
