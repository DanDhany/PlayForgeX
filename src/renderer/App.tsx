import React, { useState, useEffect, useRef } from "react";
import { NavigationRail, NavTab } from "./components/NavigationRail";
import { OverviewView } from "./components/views/OverviewView";
import { TransferStudioView } from "./components/views/TransferStudioView";
import { LibraryView } from "./components/views/LibraryView";
import { AccountsView } from "./components/views/AccountsView";
import { ActivityView } from "./components/views/ActivityView";
import { SettingsView } from "./components/views/SettingsView";
import { AddAccountModal } from "./components/AddAccountModal";
import { AlternativePickerModal } from "./components/AlternativePickerModal";
import { ExportModal } from "./components/ExportModal";
import { TransferProgressModal } from "./components/TransferProgressModal";
import {
  AccountConnection,
  ActivityLogItem,
  PlaylistSummary,
  TransferTrackItem,
  AppleMusicTrack,
  TransferJob,
  PlaylistDraft,
} from "../shared/types";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [accounts, setAccounts] = useState<AccountConnection[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<
    (PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: "youtube" | "apple" })[]
  >([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Transfer & Review states
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistSummary | null>(null);
  const [trackItems, setTrackItems] = useState<TransferTrackItem[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [totalTracksToMatch, setTotalTracksToMatch] = useState(0);
  const [editingItem, setEditingItem] = useState<TransferTrackItem | null>(null);
  const [transferJob, setTransferJob] = useState<TransferJob | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const matchingPollerRef = useRef<any>(null);

  const stopMatchingPoller = () => {
    if (matchingPollerRef.current) {
      clearInterval(matchingPollerRef.current);
      matchingPollerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopMatchingPoller();
  }, []);

  useEffect(() => {
    loadAccounts();
    loadActivity();

    // Detect redirect callback params from bookmarklet form submission
    const hash = window.location.hash;
    const search = window.location.search;
    const queryStr = search || (hash.includes("?") ? hash.substring(hash.indexOf("?")) : hash.replace(/^#/, "?"));
    const params = new URLSearchParams(queryStr);

    if (params.get("tab") === "accounts" || hash.includes("tab=accounts")) {
      setActiveTab("accounts");
    }

    if (params.get("status") === "success") {
      const aliasName = params.get("alias") || "Akun baru";
      setSuccessBanner(`Koneksi akun "${aliasName}" berhasil ditambahkan!`);
      setTimeout(() => setSuccessBanner(null), 5000);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data: AccountConnection[] = await res.json();
        setAccounts(data);
        loadAllPlaylists(data);
      }
    } catch (err) {
      console.warn("Failed fetching accounts:", err);
    }
  };

  const loadActivity = async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data: ActivityLogItem[] = await res.json();
        setActivityLogs(data);
      }
    } catch (err) {
      console.warn("Failed fetching activity logs:", err);
    }
  };

  const loadAllPlaylists = async (accList = accounts) => {
    setIsLoadingPlaylists(true);
    const combined: (PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: "youtube" | "apple" })[] = [];

    for (const acc of accList) {
      try {
        const res = await fetch(`/api/accounts/${acc.id}/playlists`);
        if (res.ok) {
          const list: PlaylistSummary[] = await res.json();
          for (const item of list) {
            combined.push({
              ...item,
              accountId: acc.id,
              accountAlias: acc.localAlias,
              platform: acc.platform,
            });
          }
        }
      } catch (err) {
        console.warn(`Failed loading playlists for account ${acc.id}:`, err);
      }
    }

    setAllPlaylists(combined);
    setIsLoadingPlaylists(false);
  };

  const handleTestAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`Koneksi akun "${data.localAlias}" berhasil dan aktif!`);
      } else {
        alert(`Koneksi akun gagal: ${data.error || "Unknown error"}`);
      }
      await loadAccounts();
    } catch (err: any) {
      alert(`Koneksi gagal: ${err.message}`);
    }
  };

  const handleRenameAccount = async (id: string, newAlias: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localAlias: newAlias }),
      });
      if (res.ok) {
        await loadAccounts();
      }
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadAccounts();
      }
    } catch (err) {
      console.error("Delete account failed:", err);
    }
  };

  const handleSelectPlaylistForTransfer = async (
    playlist: PlaylistSummary,
    force: boolean = false
  ) => {
    stopMatchingPoller();
    setSelectedPlaylist(playlist);
    setTotalTracksToMatch(playlist.trackCount || 0);
    setActiveTab("transfer");

    const sourcePl = allPlaylists.find((p) => p.id === playlist.id);
    const sourcePlatform = sourcePl?.platform || "youtube";
    const targetPlatform = sourcePlatform === "youtube" ? "apple" : "youtube";

    try {
      let draft: PlaylistDraft | null = null;
      let isRunning = false;

      if (!force) {
        try {
          const draftRes = await fetch(`/api/drafts/${sourcePlatform}/${playlist.id}`);
          if (draftRes.ok) {
            const data = await draftRes.json();
            draft = data.draft;
            isRunning = data.isRunning;
            if (draft && draft.items && draft.items.length > 0) {
              setTrackItems(draft.items);
              if (draft.totalTracks) {
                setTotalTracksToMatch(draft.totalTracks);
              }
            }
          }
        } catch (e) {
          console.warn("Failed checking draft:", e);
        }
      }

      const isComplete =
        draft &&
        draft.targetPlatform === targetPlatform &&
        draft.status === "ready" &&
        draft.items.length >= (draft.totalTracks || playlist.trackCount || 1);

      if (!force && isComplete && !isRunning) {
        setIsMatching(false);
        return;
      }

      setIsMatching(true);

      const startRes = await fetch("/api/matching/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePlatform,
          targetPlatform,
          playlist,
          force,
        }),
      });

      if (startRes.ok) {
        const poller = setInterval(async () => {
          try {
            const pRes = await fetch(`/api/drafts/${sourcePlatform}/${playlist.id}`);
            if (pRes.ok) {
              const data = await pRes.json();
              if (data.draft?.items) {
                setTrackItems(data.draft.items);
                if (data.draft.totalTracks) {
                  setTotalTracksToMatch(data.draft.totalTracks);
                }
              }
              if (!data.isRunning) {
                stopMatchingPoller();
                setIsMatching(false);
              }
            }
          } catch {
            stopMatchingPoller();
            setIsMatching(false);
          }
        }, 1200);
        matchingPollerRef.current = poller;
      }
    } catch (err) {
      console.error("Failed starting matching:", err);
      setIsMatching(false);
    }
  };

  const handleToggleExclude = (item: TransferTrackItem) => {
    setTrackItems((prev) =>
      prev.map((t) => (t === item ? { ...t, excluded: !t.excluded } : t))
    );
  };

  const handleSelectAlternative = (item: TransferTrackItem, candidate: AppleMusicTrack) => {
    const updated: TransferTrackItem = {
      ...item,
      selectedCandidate: candidate,
      excluded: false,
      match: {
        ...item.match,
        status: "EXACT_MATCH",
        totalScore: 1.0,
        reason: "Manually selected alternative",
      },
    };

    setTrackItems((prev) => prev.map((t) => (t === item ? updated : t)));

    if (selectedPlaylist) {
      const sourcePl = allPlaylists.find((p) => p.id === selectedPlaylist.id);
      const sourcePlatform = sourcePl?.platform || "youtube";
      fetch(`/api/drafts/${sourcePlatform}/${selectedPlaylist.id}/item`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: updated }),
      }).catch(console.error);
    }
  };

  const handleSearchCandidateCatalog = async (query: string): Promise<AppleMusicTrack[]> => {
    const sourcePl = selectedPlaylist ? allPlaylists.find((p) => p.id === selectedPlaylist.id) : null;
    const targetPlatform = sourcePl?.platform === "apple" ? "youtube" : "apple";

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, targetPlatform }),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error("Search error:", err);
    }
    return [];
  };

  const handleExecuteTransfer = async (options: {
    mode: "create" | "existing";
    playlistTitle: string;
    existingPlaylistId?: string;
    existingPlaylistTitle?: string;
  }) => {
    if (!selectedPlaylist) return;
    setIsExportModalOpen(false);

    const sourcePl = allPlaylists.find((p) => p.id === selectedPlaylist.id);
    const sourcePlatform = sourcePl?.platform || "youtube";
    const targetPlatform = sourcePlatform === "youtube" ? "apple" : "youtube";

    const job: TransferJob = {
      playlistId: selectedPlaylist.id,
      playlistTitle:
        options.mode === "existing"
          ? options.existingPlaylistTitle || options.playlistTitle
          : options.playlistTitle,
      targetPlatform,
      mode: options.mode,
      existingPlaylistTitle: options.existingPlaylistTitle,
      tracks: trackItems,
      status: "processing",
      progress: {
        current: 0,
        total: trackItems.filter((t) => !t.excluded && t.selectedCandidate).length,
        success: 0,
        failed: 0,
      },
    };
    setTransferJob(job);

    const interval = setInterval(async () => {
      try {
        const pRes = await fetch("/api/transfer/progress");
        if (pRes.ok) {
          const p = await pRes.json();
          setTransferJob((prev) => (prev ? { ...prev, progress: p } : null));
        }
      } catch {}
    }, 1000);

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistTitle: options.playlistTitle,
          items: trackItems,
          targetPlatform,
          mode: options.mode,
          existingPlaylistId: options.existingPlaylistId,
          sourcePlaylistId: selectedPlaylist.id,
          sourcePlatform,
          sourceAliases: sourcePl?.accountAlias ? [sourcePl.accountAlias] : [],
        }),
      });

      const data = await res.json();
      setTransferJob((prev) =>
        prev
          ? {
              ...prev,
              status: res.ok ? "completed" : "failed",
              appleMusicPlaylistId: data.destinationPlaylistId || data.createdPlaylistId,
              youtubePlaylistId: data.destinationPlaylistId || data.createdPlaylistId,
            }
          : null
      );
      await loadActivity();
    } catch {
      setTransferJob((prev) => (prev ? { ...prev, status: "failed" } : null));
    } finally {
      clearInterval(interval);
    }
  };

  const currentSourcePl = selectedPlaylist
    ? allPlaylists.find((p) => p.id === selectedPlaylist.id)
    : null;
  const currentSourcePlatform = currentSourcePl?.platform || "youtube";
  const currentTargetPlatform = currentSourcePlatform === "youtube" ? "apple" : "youtube";

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-background overflow-hidden text-text-primary font-sans selection:bg-accent selection:text-background">
      {/* Linear-Style Navigation Rail on Desktop & Mobile Tabbar */}
      <NavigationRail
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        connectedCount={accounts.length}
      />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full relative">
        {successBanner && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-status-success/20 border border-status-success/40 text-status-success px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center space-x-2 animate-dialog-in text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>{successBanner}</span>
            <button
              onClick={() => setSuccessBanner(null)}
              className="ml-2 hover:opacity-75 text-sm leading-none"
            >
              &times;
            </button>
          </div>
        )}
        {activeTab === "overview" && (
          <OverviewView
            accounts={accounts}
            activityLogs={activityLogs}
            onNavigate={setActiveTab}
            onOpenAddAccount={() => setIsAddAccountModalOpen(true)}
            onTestAccount={handleTestAccount}
          />
        )}

        {activeTab === "transfer" && (
          <TransferStudioView
            accounts={accounts}
            allPlaylists={allPlaylists}
            selectedPlaylist={selectedPlaylist}
            trackItems={trackItems}
            isMatching={isMatching}
            totalTracksToMatch={totalTracksToMatch}
            isTransferring={transferJob?.status === "processing"}
            sourcePlatform={currentSourcePlatform}
            targetPlatform={currentTargetPlatform}
            onSelectPlaylist={handleSelectPlaylistForTransfer}
            onToggleExclude={handleToggleExclude}
            onOpenAlternativePicker={setEditingItem}
            onStartTransfer={() => setIsExportModalOpen(true)}
            onReMatch={() => selectedPlaylist && handleSelectPlaylistForTransfer(selectedPlaylist, true)}
            onNavigateAccounts={() => setActiveTab("accounts")}
          />
        )}

        {activeTab === "library" && (
          <LibraryView
            accounts={accounts}
            playlists={allPlaylists}
            isLoading={isLoadingPlaylists}
            onRefresh={() => loadAllPlaylists(accounts)}
            onSelectForTransfer={(pl) => handleSelectPlaylistForTransfer(pl)}
          />
        )}

        {activeTab === "accounts" && (
          <AccountsView
            accounts={accounts}
            onOpenAddAccount={() => setIsAddAccountModalOpen(true)}
            onTestAccount={handleTestAccount}
            onRenameAccount={handleRenameAccount}
            onDeleteAccount={handleDeleteAccount}
            onViewPlaylists={() => setActiveTab("library")}
          />
        )}

        {activeTab === "activity" && (
          <ActivityView activityLogs={activityLogs} onRefresh={loadActivity} />
        )}

        {activeTab === "settings" && <SettingsView onRefresh={loadAccounts} />}
      </main>

      {/* Modals & Dialogs */}
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onSuccess={() => {
          loadAccounts();
          loadActivity();
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExecuteTransfer}
        defaultTitle={selectedPlaylist?.title || "Playlist"}
        targetPlatform={currentTargetPlatform}
        trackCount={trackItems.filter((t) => !t.excluded && t.selectedCandidate).length}
        isMatching={isMatching}
      />

      <AlternativePickerModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSelectAlternative={handleSelectAlternative}
        onSearchCatalog={handleSearchCandidateCatalog}
        targetPlatform={currentTargetPlatform}
      />

      <TransferProgressModal
        job={transferJob}
        onClose={() => setTransferJob(null)}
      />
    </div>
  );
};
