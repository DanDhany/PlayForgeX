import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Layers,
  Sparkles,
  ListMusic,
  Check,
  Plus,
} from "lucide-react";
import {
  AccountConnection,
  PlaylistSummary,
  TransferTrackItem,
  SourcePlaylistSelection,
} from "../../../shared/types";
import { ReviewStudio } from "../ReviewStudio";
import { useLanguage } from "../../context/LanguageContext";
import { getPlatformMeta } from "../../utils/platform-meta";
import { getSelectableExportPlatforms } from "../../utils/export-guardrails";

interface TransferStudioViewProps {
  accounts: AccountConnection[];
  allPlaylists: (PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: string })[];
  selectedPlaylist: PlaylistSummary | null;
  trackItems: TransferTrackItem[];
  isMatching: boolean;
  totalTracksToMatch: number;
  isTransferring: boolean;
  sourcePlatform: string;
  targetPlatform: string;
  targetAccountId?: string;
  onSelectPlaylist: (
    playlist: PlaylistSummary,
    force?: boolean,
    options?: { targetPlatform?: string; targetAccountId?: string; presetTracks?: any[] }
  ) => void;
  onToggleExclude: (item: TransferTrackItem) => void;
  onOpenAlternativePicker: (item: TransferTrackItem) => void;
  onStartTransfer: () => void;
  onReMatch: () => void;
  onNavigateAccounts: () => void;
  onChangeTargetPlatform?: (platform: string) => void;
  onChangeTargetAccount?: (accountId: string, platform?: string) => void;
}

export const TransferStudioView: React.FC<TransferStudioViewProps> = ({
  accounts,
  allPlaylists,
  selectedPlaylist,
  trackItems,
  isMatching,
  totalTracksToMatch,
  isTransferring,
  sourcePlatform,
  targetPlatform,
  targetAccountId,
  onSelectPlaylist,
  onToggleExclude,
  onOpenAlternativePicker,
  onStartTransfer,
  onReMatch,
  onNavigateAccounts,
  onChangeTargetPlatform,
  onChangeTargetAccount,
}) => {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";

  const selectableDestinations = getSelectableExportPlatforms(accounts);
  const currentPlatformAccounts = accounts.filter((a) => a.platform === targetPlatform);
  const activeTargetAccount =
    accounts.find((a) => a.id === targetAccountId) || currentPlatformAccounts[0];
  const [studioMode, setStudioMode] = useState<"quick" | "merge">("quick");
  const [mobileQuickTab, setMobileQuickTab] = useState<"picker" | "review">("picker");

  useEffect(() => {
    if (selectedPlaylist) {
      setMobileQuickTab("review");
    }
  }, [selectedPlaylist?.id]);

  // Merge Mode States
  const [selectedPlaylistSelections, setSelectedPlaylistSelections] = useState<SourcePlaylistSelection[]>([]);
  const [destinationAccountId, setDestinationAccountId] = useState<string>("");
  const [dedupPolicy, setDedupPolicy] = useState<"remove_exact" | "keep_all">("remove_exact");
  const [isGeneratingMerge, setIsGeneratingMerge] = useState(false);
  const [mergeStats, setMergeStats] = useState<{
    totalDiscovered: number;
    uniqueCount: number;
    duplicatesCount: number;
  } | null>(null);

  // Initialize destination account if available based on targetPlatform
  useEffect(() => {
    if (!destinationAccountId && accounts.length > 0) {
      const matchingAcc = accounts.find((a) => a.platform === targetPlatform);
      if (matchingAcc) {
        setDestinationAccountId(matchingAcc.id);
      } else {
        const nonSourceAcc = accounts.find((a) => a.platform !== sourcePlatform);
        setDestinationAccountId(nonSourceAcc ? nonSourceAcc.id : accounts[0].id);
      }
    }
  }, [accounts, targetPlatform, sourcePlatform]);

  // When a playlist is selected, default to review view on mobile and retain active target platform
  const handlePickPlaylist = (pl: PlaylistSummary) => {
    onSelectPlaylist(pl, false, { targetPlatform });
    setMobileQuickTab("review");
  };

  const handleTogglePlaylistSelection = (
    pl: PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: string }
  ) => {
    if (!pl.accountId) return;
    const exists = selectedPlaylistSelections.some(
      (s) => s.accountId === pl.accountId && s.playlistId === pl.id
    );

    if (exists) {
      setSelectedPlaylistSelections((prev) =>
        prev.filter((s) => !(s.accountId === pl.accountId && s.playlistId === pl.id))
      );
    } else {
      setSelectedPlaylistSelections((prev) => [
        ...prev,
        {
          accountId: pl.accountId!,
          accountAlias: pl.accountAlias || (isEn ? "Account" : "Akun"),
          platform: pl.platform || "youtube",
          playlistId: pl.id,
          playlistTitle: pl.title,
          trackCount: pl.trackCount || 0,
        },
      ]);
    }
  };

  const handleRunMergePreview = async () => {
    if (selectedPlaylistSelections.length === 0) return;
    setIsGeneratingMerge(true);

    try {
      const res = await fetch("/api/workflows/merge/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceSelections: selectedPlaylistSelections,
          deduplicationPolicy: dedupPolicy,
        }),
      });

      if (!res.ok) throw new Error("Failed generating preview");
      const data = await res.json();
      setMergeStats({
        totalDiscovered: data.totalDiscovered,
        uniqueCount: data.uniqueCount,
        duplicatesCount: data.duplicatesCount,
      });

      // Synthesize a virtual playlist for Review Studio
      const virtualPlaylistId = data.virtualPlaylistId || `virtual_merge_${Date.now()}`;
      const virtualPlaylist: PlaylistSummary = {
        id: virtualPlaylistId,
        title: isEn
          ? `Merged Collection (${selectedPlaylistSelections.length} Playlists)`
          : `Merge Koleksi (${selectedPlaylistSelections.length} Playlist)`,
        trackCount: data.uniqueCount,
        platform: "merge",
      };

      // Determine target destination platform
      const destAcc = accounts.find((a) => a.id === destinationAccountId);
      const targetPlat = destAcc?.platform || targetPlatform || "spotify";

      // Switch to quick mode / review tab immediately
      setStudioMode("quick");
      setMobileQuickTab("review");

      // Call onSelectPlaylist with destination details and preset tracks
      onSelectPlaylist(virtualPlaylist, true, {
        targetPlatform: targetPlat,
        targetAccountId: destinationAccountId,
        presetTracks: data.uniqueTracks,
      });
    } catch (err) {
      console.error("Merge preview error:", err);
      alert(isEn ? "Failed to generate playlist merge preview" : "Gagal memproses penggabungan playlist");
    } finally {
      setIsGeneratingMerge(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-background pb-24 md:pb-8">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto text-accent shadow-md">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            {isEn ? "No Accounts Connected Yet" : "Belum Ada Akun Terhubung"}
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            {isEn
              ? "To begin transferring or merging music playlists, connect at least one source and one destination account in the Accounts view."
              : "Untuk memulai transfer atau penggabungan playlist musik, hubungkan setidaknya satu akun sumber dan satu akun tujuan di menu Akun."}
          </p>
          <button
            onClick={onNavigateAccounts}
            className="px-4 py-2 rounded-lg bg-accent text-background font-medium text-xs hover:bg-accent/90 btn-press inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? "Connect Account Now" : "Hubungkan Akun Sekarang"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Studio Top Control Ribbon */}
      <div className="min-h-[48px] py-1.5 bg-surface border-b border-border px-3 sm:px-6 flex items-center justify-between gap-2 flex-shrink-0 select-none overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-surface-elevated rounded-lg border border-border text-xs">
            <button
              onClick={() => setStudioMode("quick")}
              className={`px-2.5 sm:px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 btn-press ${
                studioMode === "quick"
                  ? "bg-accent/20 text-accent font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{t("transfer.mode1to1")}</span>
            </button>
            <button
              onClick={() => setStudioMode("merge")}
              className={`px-2.5 sm:px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 btn-press ${
                studioMode === "merge"
                  ? "bg-accent text-background font-semibold shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t("transfer.modeMerge")}</span>
              <span className="text-[10px] px-1 py-0.2 bg-white/20 rounded font-bold">
                NEW
              </span>
            </button>
          </div>

          {/* Prominent Export Target Destination & Account Selector (Guardrailed: only connected accounts) */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-xs flex-shrink-0">
            <span className="text-[10px] sm:text-[11px] font-medium text-text-secondary whitespace-nowrap">
              {isEn ? "Target:" : "Tujuan:"}
            </span>
            <select
              value={targetPlatform}
              onChange={(e) => {
                const newPlat = e.target.value;
                const firstAcc = accounts.find((a) => a.platform === newPlat);
                if (firstAcc) {
                  onChangeTargetAccount?.(firstAcc.id, newPlat);
                } else {
                  onChangeTargetPlatform?.(newPlat);
                }
              }}
              className="bg-transparent text-xs font-semibold text-accent focus:outline-none cursor-pointer max-w-[110px] sm:max-w-none truncate"
            >
              {selectableDestinations.length === 0 ? (
                <option value={targetPlatform} disabled>
                  {isEn ? "No accounts added" : "Belum ada akun"}
                </option>
              ) : (
                selectableDestinations.map((d) => (
                  <option key={d.platform} value={d.platform} className="bg-surface text-text-primary">
                    {d.meta.name}
                  </option>
                ))
              )}
            </select>

            {currentPlatformAccounts.length > 0 && (
              <>
                <span className="text-text-muted">|</span>
                <select
                  value={activeTargetAccount?.id || currentPlatformAccounts[0]?.id}
                  onChange={(e) => onChangeTargetAccount?.(e.target.value, targetPlatform)}
                  className="bg-transparent text-xs font-medium text-text-primary focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] truncate"
                >
                  {currentPlatformAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-surface text-text-primary">
                      {acc.localAlias}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {selectedPlaylist && (
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-text-secondary">
            <span>{t("transfer.sourceTracks")}:</span>
            <span className="text-text-primary font-medium truncate max-w-xs">
              {selectedPlaylist.title}
            </span>
          </div>
        )}
      </div>

      {/* Main Studio Body */}
      {studioMode === "quick" ? (
        // Mode 1: Quick Transfer (1:1) - Direct ReviewStudio layout
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
          {/* Mobile Sub-Segmented Control: Playlist List vs Review Studio */}
          <div className="md:hidden flex items-center justify-between p-2 bg-surface border-b border-border flex-shrink-0">
            <div className="flex items-center p-0.5 bg-surface-elevated rounded-lg border border-border text-xs w-full">
              <button
                onClick={() => setMobileQuickTab("picker")}
                className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors btn-press ${
                  mobileQuickTab === "picker"
                    ? "bg-accent/20 text-accent font-semibold shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t("transfer.selectSource")} ({allPlaylists.length})
              </button>
              <button
                onClick={() => setMobileQuickTab("review")}
                disabled={!selectedPlaylist}
                className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors btn-press ${
                  mobileQuickTab === "review"
                    ? "bg-accent/20 text-accent font-semibold shadow-sm"
                    : "text-text-secondary disabled:opacity-40"
                }`}
              >
                {t("transfer.reviewTracks")} {selectedPlaylist ? `(${trackItems.length})` : ""}
              </button>
            </div>
          </div>

          {/* Quick Playlist Picker Sidebar */}
          <div
            className={`w-full md:w-72 bg-surface/80 border-r border-border flex-col h-full flex-shrink-0 pb-32 md:pb-0 ${
              mobileQuickTab === "picker" ? "flex" : "hidden md:flex"
            }`}
          >
            <div className="p-3 border-b border-border flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <ListMusic className="w-4 h-4 text-accent" />
                <span>{t("transfer.selectSource")}</span>
              </span>
              <span className="text-[11px] text-text-secondary font-mono">
                {allPlaylists.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {allPlaylists.map((pl) => {
                const isSelected = selectedPlaylist?.id === pl.id;
                return (
                  <button
                    key={`${pl.accountId}_${pl.id}`}
                    onClick={() => handlePickPlaylist(pl)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 btn-press ${
                      isSelected
                        ? "bg-accent/15 border border-accent/30 text-text-primary font-semibold"
                        : "hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          getPlatformMeta(pl.platform).dotColor
                        }`}
                      />
                      <span className="truncate">{pl.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-text-secondary flex-shrink-0">
                      {pl.trackCount || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Studio Stage */}
          <div
            className={`flex-1 flex-col h-full overflow-hidden ${
              mobileQuickTab === "review" ? "flex" : "hidden md:flex"
            }`}
          >
            <ReviewStudio
              selectedPlaylist={selectedPlaylist}
              items={trackItems}
              isMatching={isMatching}
              totalTracksToMatch={totalTracksToMatch}
              isTransferring={isTransferring}
              onToggleExclude={onToggleExclude}
              onOpenAlternativePicker={onOpenAlternativePicker}
              onStartTransfer={onStartTransfer}
              onReMatch={onReMatch}
              onOpenMobileSidebar={() => setMobileQuickTab("picker")}
              sourcePlatform={sourcePlatform}
              targetPlatform={targetPlatform}
              targetAccountId={targetAccountId}
              accounts={accounts}
              onChangeTargetPlatform={onChangeTargetPlatform}
              onChangeTargetAccount={onChangeTargetAccount}
            />
          </div>
        </div>
      ) : (
        // Mode 2: Multi-Source Merge Workflow Wizard
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full pb-32 md:pb-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-text-primary">
              {t("transfer.mergeTitle")}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {t("transfer.mergeDesc")}
            </p>
          </div>

          {/* Step 1: Select Source Playlists */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent text-background text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span>{t("transfer.step1")}</span>
              </h3>
              <span className="text-xs text-accent font-medium">
                {selectedPlaylistSelections.length} {isEn ? "playlists selected" : "playlist dipilih"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
              {allPlaylists.map((pl) => {
                const isChecked = selectedPlaylistSelections.some(
                  (s) => s.accountId === pl.accountId && s.playlistId === pl.id
                );

                return (
                  <div
                    key={`${pl.accountId}_${pl.id}`}
                    onClick={() => handleTogglePlaylistSelection(pl)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-2.5 btn-press ${
                      isChecked
                        ? "bg-accent/15 border-accent text-text-primary font-semibold"
                        : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by div click
                      className="mt-0.5 rounded text-accent focus:ring-0"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-text-primary">{pl.title}</div>
                      <div className="text-[11px] text-text-secondary truncate mt-0.5">
                        {pl.accountAlias} ({pl.trackCount || 0} {isEn ? "tracks" : "lagu"})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Destination Account */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-background text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>{isEn ? "Select Destination Music Account" : "Pilih Akun Musik Tujuan"}</span>
            </h3>

            {accounts.length === 0 ? (
              <div className="p-4 rounded-lg bg-surface-elevated/70 border border-dashed border-border text-center space-y-2">
                <p className="text-xs text-text-secondary">
                  {isEn
                    ? "No destination accounts connected yet. Connect an account in Account Settings to export."
                    : "Belum ada akun tujuan yang terhubung. Hubungkan akun di Pengaturan Akun untuk mengekspor."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map((acc) => {
                  const isSelected = destinationAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        setDestinationAccountId(acc.id);
                        onChangeTargetAccount?.(acc.id, acc.platform);
                      }}
                      className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between btn-press ${
                        isSelected
                          ? "bg-accent/15 border-accent text-text-primary font-semibold shadow-sm"
                          : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            getPlatformMeta(acc.platform).dotColor
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-text-primary font-medium truncate">
                            {acc.localAlias}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            {getPlatformMeta(acc.platform).name}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-accent" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Direct Platform Export Selector (Guardrailed: only connected platforms + file snapshot) */}
            <div className="pt-2 border-t border-border/60">
              <span className="text-[11px] font-medium text-text-secondary block mb-2">
                {isEn ? "Select target platform:" : "Pilih platform tujuan:"}
              </span>
              <div className="flex flex-wrap gap-2">
                {selectableDestinations.map((dest) => {
                  const isPlatActive = targetPlatform === dest.platform && !destinationAccountId;
                  return (
                    <button
                      key={dest.platform}
                      type="button"
                      onClick={() => {
                        setDestinationAccountId("");
                        const firstAcc = dest.accounts[0];
                        if (firstAcc) {
                          onChangeTargetAccount?.(firstAcc.id, dest.platform);
                        } else {
                          onChangeTargetPlatform?.(dest.platform);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition btn-press ${
                        isPlatActive
                          ? "bg-accent/15 border-accent text-accent font-semibold"
                          : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dest.meta.dotColor}`} />
                      <span>{dest.meta.name}</span>
                    </button>
                  );
                })}
                {/* File snapshot export option */}
                <button
                  type="button"
                  onClick={() => {
                    setDestinationAccountId("");
                    onChangeTargetPlatform?.("file");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition btn-press ${
                    targetPlatform === "file" && !destinationAccountId
                      ? "bg-accent/15 border-accent text-accent font-semibold"
                      : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>{isEn ? "File Snapshot (JSON)" : "Snapshot File (JSON)"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Deduplication Strategy */}
          <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-background text-xs font-bold flex items-center justify-center">
                3
              </span>
              <span>{isEn ? "Deduplication Policy" : "Kebijakan Eliminasi Duplikasi"}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div
                onClick={() => setDedupPolicy("remove_exact")}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors space-y-1 btn-press ${
                  dedupPolicy === "remove_exact"
                    ? "bg-accent/15 border-accent text-text-primary font-medium"
                    : "bg-surface-elevated border-border text-text-secondary"
                }`}
              >
                <div className="font-semibold text-text-primary flex items-center justify-between">
                  <span>{isEn ? "Eliminate Exact Duplicates (Recommended)" : "Hapus Duplikat Persis (Direkomendasikan)"}</span>
                  {dedupPolicy === "remove_exact" && <Check className="w-4 h-4 text-accent" />}
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {isEn
                    ? "Songs with matching titles and artists are included once. Live, remix, or acoustic editions are safely preserved."
                    : "Lagu dengan judul dan artis yang sama hanya dimasukkan satu kali. Versi Live, Remix, atau Akustik tetap dipertahankan."}
                </p>
              </div>

              <div
                onClick={() => setDedupPolicy("keep_all")}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors space-y-1 btn-press ${
                  dedupPolicy === "keep_all"
                    ? "bg-accent/15 border-accent text-text-primary font-medium"
                    : "bg-surface-elevated border-border text-text-secondary"
                }`}
              >
                <div className="font-semibold text-text-primary flex items-center justify-between">
                  <span>{isEn ? "Keep All Tracks" : "Pertahankan Semua Lagu"}</span>
                  {dedupPolicy === "keep_all" && <Check className="w-4 h-4 text-accent" />}
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {isEn
                    ? "All songs from each playlist are appended without deduplication checks."
                    : "Semua lagu dari setiap playlist dimasukkan tanpa pengecekan duplikasi ganda."}
                </p>
              </div>
            </div>
          </div>

          {/* Merge Stats Preview (if generated) */}
          {mergeStats && (
            <div className="p-4 rounded-xl bg-surface-elevated border border-accent/30 flex items-center justify-around text-xs">
              <div className="text-center">
                <span className="text-text-secondary text-[11px]">{isEn ? "Total Found" : "Total Ditemukan"}</span>
                <div className="text-base font-bold text-text-primary">{mergeStats.totalDiscovered}</div>
              </div>
              <div className="text-center">
                <span className="text-text-secondary text-[11px]">{isEn ? "Duplicates Eliminated" : "Duplikat Dieliminasi"}</span>
                <div className="text-base font-bold text-accent">{mergeStats.duplicatesCount}</div>
              </div>
              <div className="text-center">
                <span className="text-text-secondary text-[11px]">{isEn ? "Unique Tracks Ready" : "Lagu Unik Siap Pindah"}</span>
                <div className="text-base font-bold text-status-success">{mergeStats.uniqueCount}</div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleRunMergePreview}
              disabled={selectedPlaylistSelections.length === 0 || isGeneratingMerge}
              className="px-6 py-2.5 rounded-xl bg-accent text-background font-semibold text-xs md:text-sm flex items-center gap-2 hover:bg-accent/90 disabled:opacity-50 btn-press shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingMerge
                  ? (isEn ? "Processing Merge..." : "Memproses Penggabungan...")
                  : (isEn ? "Preview & Open Review Studio" : "Pratinjau & Buka Review Studio")}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
