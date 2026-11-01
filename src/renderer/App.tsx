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
import { MusicPlayerBar } from "./components/MusicPlayerBar";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthModal } from "./components/auth/AuthModal";
import {
  AccountConnection,
  ActivityLogItem,
  PlaylistSummary,
  TransferTrackItem,
  AppleMusicTrack,
  TransferJob,
  PlaylistDraft,
  User,
} from "../shared/types";
import {
  IS_PAGES_OR_STATIC,
  DEMO_ACCOUNTS,
  DEMO_PLAYLISTS,
  DEMO_ACTIVITY,
} from "./demoData";

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<"studio" | "landing">(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash.startsWith("#landing") || IS_PAGES_OR_STATIC) {
        return "landing";
      }
    }
    return "studio";
  });
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [accounts, setAccounts] = useState<AccountConnection[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<
    (PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: "youtube" | "apple" })[]
  >([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

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
    checkUserSession();
    loadAccounts();
    loadActivity();

    // Detect redirect callback params from bookmarklet form submission
    const hash = window.location.hash;
    const search = window.location.search;
    const queryStr = search || (hash.includes("?") ? hash.substring(hash.indexOf("?")) : hash.replace(/^#/, "?"));
    const params = new URLSearchParams(queryStr);

    if (params.get("tab") === "transfer" || hash.includes("tab=transfer")) {
      setActiveTab("transfer");
    } else if (params.get("tab") === "accounts" || hash.includes("tab=accounts")) {
      setActiveTab("accounts");
    }

    if (params.get("status") === "success" || params.get("status") === "imported") {
      const aliasName = params.get("alias") || "Akun baru";
      const isImport = params.get("status") === "imported";
      setSuccessBanner(
        isImport
          ? `🎉 Playlist dari "${aliasName}" berhasil diimpor langsung dari HP!`
          : `Koneksi akun "${aliasName}" berhasil ditambahkan!`
      );
      setTimeout(() => setSuccessBanner(null), 6000);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#landing")) {
        setViewMode("landing");
      } else if (hash.startsWith("#studio") || !hash) {
        setViewMode("studio");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleOpenStudio = () => {
    setViewMode("studio");
    if (window.location.hash.startsWith("#landing")) {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  const handleOpenLanding = () => {
    setViewMode("landing");
    window.location.hash = "#landing";
  };

  const checkUserSession = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tunebridge_token") : null;
    try {
      const res = await fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        } else if (token) {
          localStorage.removeItem("tunebridge_token");
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.warn("Failed checking user session:", err);
    }
  };

  const handleAuthSuccess = (user: User, token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tunebridge_token", token);
    }
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setSuccessBanner(`Selamat datang kembali, ${user.username}!`);
    setTimeout(() => setSuccessBanner(null), 4000);
    loadAccounts();
    loadActivity();
  };

  const handleLogoutUser = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tunebridge_token") : null;
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ token }),
      });
    } catch (err) {
      console.warn("Logout error:", err);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("tunebridge_token");
    }
    setCurrentUser(null);
    await checkUserSession();
    await loadAccounts();
    setSuccessBanner("Sesi akun Anda telah ditutup.");
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const loadAccounts = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tunebridge_token") : null;
    try {
      const res = await fetch("/api/accounts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data: AccountConnection[] = await res.json();
        setAccounts(data);
        loadAllPlaylists(data);
        return;
      }
    } catch (err) {
      console.warn("Failed fetching accounts, falling back to static demo data:", err);
    }
    // Fallback for GitHub Pages or offline static demo mode
    setAccounts(DEMO_ACCOUNTS);
    setAllPlaylists(DEMO_PLAYLISTS);
  };

  const loadActivity = async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data: ActivityLogItem[] = await res.json();
        setActivityLogs(data);
        return;
      }
    } catch (err) {
      console.warn("Failed fetching activity logs, falling back to demo logs:", err);
    }
    setActivityLogs(DEMO_ACTIVITY);
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
      setTransferJob((prev) => {
        if (!prev) return null;
        const total = prev.progress.total;
        const finalProgress = data.progress || {
          current: total,
          total,
          success: typeof data.added === "number" ? data.added : total,
          failed: typeof data.failed === "number" ? data.failed : 0,
        };
        return {
          ...prev,
          status: res.ok ? "completed" : "failed",
          progress: finalProgress,
          appleMusicPlaylistId: data.destinationPlaylistId || data.createdPlaylistId,
          youtubePlaylistId: data.destinationPlaylistId || data.createdPlaylistId,
        };
      });
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

  if (viewMode === "landing") {
    return <LandingPage onOpenStudio={handleOpenStudio} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-background overflow-hidden text-text-primary font-sans selection:bg-accent selection:text-background">
      {/* Linear-Style Navigation Rail on Desktop & Mobile Tabbar */}
      <NavigationRail
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        connectedCount={accounts.length}
        onOpenLanding={handleOpenLanding}
        currentUser={currentUser}
        onOpenAuth={(tab) => {
          setAuthModalTab(tab || "login");
          setIsAuthModalOpen(true);
        }}
        onUserLogout={handleLogoutUser}
      />

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full relative">
        {IS_PAGES_OR_STATIC && (
          <div className="bg-accent/10 border-b border-accent/20 px-4 py-1.5 flex items-center justify-between text-xs text-accent select-none z-30">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>
                <strong>Mode Demonstrasi GitHub Pages:</strong> Menampilkan simulasi studio interaktif. Unduh rilis Docker lokal untuk transfer riil.
              </span>
            </span>
            <button
              onClick={handleOpenLanding}
              className="underline text-[11px] hover:text-text-primary ml-2 font-medium"
            >
              Kembali ke Landing Page
            </button>
          </div>
        )}
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />

      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onSuccess={() => {
          loadAccounts();
          loadActivity();
        }}
        existingAccounts={accounts}
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

      {/* Floating Apple Music x Linear Music Player Controller */}
      <MusicPlayerBar />
    </div>
  );
};
