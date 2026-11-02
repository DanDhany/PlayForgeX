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
import { AuthScreen } from "./components/auth/AuthScreen";
import { UsersView } from "./components/views/UsersView";
import { useLanguage } from "./context/LanguageContext";
import {
  AccountConnection,
  ActivityLogItem,
  PlaylistSummary,
  TransferTrackItem,
  AppleMusicTrack,
  TransferJob,
  PlaylistDraft,
  User,
  PlatformType,
  TrackMetadata,
} from "../shared/types";
import {
  IS_PAGES_OR_STATIC,
  DEMO_ACCOUNTS,
  DEMO_PLAYLISTS,
  DEMO_ACTIVITY,
} from "./demoData";
import { getPlatformMeta } from "./utils/platform-meta";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("playforgex_token");
}

function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("playforgex_token", token);
  } else {
    localStorage.removeItem("playforgex_token");
  }
}

export const App: React.FC = () => {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [viewMode, setViewMode] = useState<"studio" | "landing" | "auth">(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash.startsWith("#auth")) {
        return "auth";
      }
      if (window.location.hash.startsWith("#studio")) {
        const token = getStoredToken();
        return token ? "studio" : "auth";
      }
      if (window.location.hash.startsWith("#landing") || IS_PAGES_OR_STATIC) {
        return "landing";
      }
      const token = getStoredToken();
      if (!token) {
        return "landing";
      }
    }
    return "studio";
  });
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [accounts, setAccounts] = useState<AccountConnection[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<
    (PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: string })[]
  >([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  // Transfer & Review states
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistSummary | null>(null);
  const [selectedTargetPlatform, setSelectedTargetPlatform] = useState<PlatformType | string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("playforgex_target_platform");
      if (saved) return saved;
    }
    return "spotify";
  });
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
      const aliasName = params.get("alias") || (isEn ? "New account" : "Akun baru");
      const isImport = params.get("status") === "imported";
      setSuccessBanner(
        isImport
          ? (isEn ? `🎉 Playlists from "${aliasName}" successfully imported directly from phone!` : `🎉 Playlist dari "${aliasName}" berhasil diimpor langsung dari HP!`)
          : (isEn ? `Account connection "${aliasName}" added successfully!` : `Koneksi akun "${aliasName}" berhasil ditambahkan!`)
      );
      setTimeout(() => setSuccessBanner(null), 6000);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const token = getStoredToken();
      if (hash.startsWith("#landing")) {
        setViewMode("landing");
      } else if (hash.startsWith("#auth")) {
        setViewMode("auth");
      } else if (hash.startsWith("#studio")) {
        setViewMode(token ? "studio" : "auth");
      } else if (!hash) {
        setViewMode(token ? "studio" : "landing");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleOpenStudio = () => {
    const token = getStoredToken();
    if (token) {
      setViewMode("studio");
      window.location.hash = "#studio";
    } else {
      setViewMode("auth");
      window.location.hash = "#auth";
    }
  };

  const handleOpenLanding = () => {
    setViewMode("landing");
    window.location.hash = "#landing";
  };

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token = getStoredToken();
    return {
      ...extra,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const checkUserSession = async () => {
    const token = getStoredToken();
    try {
      const res = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        } else if (token) {
          setStoredToken(null);
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.warn("Failed checking user session:", err);
    }
  };

  const handleAuthSuccess = (user: User, token: string) => {
    setStoredToken(token);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setViewMode("studio");
    window.location.hash = "#studio";
    setSuccessBanner(t("auth.welcomeBack", { username: user.username }));
    setTimeout(() => setSuccessBanner(null), 4000);
    setTimeout(() => {
      loadAccounts();
      loadActivity();
    }, 50);
  };

  const handleLogoutUser = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.warn("Logout error:", err);
      }
      setStoredToken(null);
    }
    setCurrentUser(null);
    setAccounts([]);
    setAllPlaylists([]);
    setActivityLogs([]);
    setSuccessBanner(t("auth.sessionClosed"));
    setTimeout(() => setSuccessBanner(null), 4000);
    setViewMode("auth");
    window.location.hash = "#auth";
  };

  const loadAccounts = async () => {
    const token = getStoredToken();
    if (!token && !IS_PAGES_OR_STATIC) {
      setAccounts([]);
      setAllPlaylists([]);
      return;
    }
    try {
      const res = await fetch("/api/accounts", {
        headers: getAuthHeaders(),
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
    if (IS_PAGES_OR_STATIC) {
      setAccounts(DEMO_ACCOUNTS);
      setAllPlaylists(DEMO_PLAYLISTS);
    } else {
      setAccounts([]);
      setAllPlaylists([]);
    }
  };

  const loadActivity = async () => {
    const token = getStoredToken();
    if (!token && !IS_PAGES_OR_STATIC) {
      setActivityLogs([]);
      return;
    }
    try {
      const res = await fetch("/api/activity", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data: ActivityLogItem[] = await res.json();
        setActivityLogs(data);
        return;
      }
    } catch (err) {
      console.warn("Failed fetching activity logs, falling back to demo logs:", err);
    }
    if (IS_PAGES_OR_STATIC) {
      setActivityLogs(DEMO_ACTIVITY);
    } else {
      setActivityLogs([]);
    }
  };

  const loadAllPlaylists = async (accList = accounts) => {
    const token = getStoredToken();
    if (!token && !IS_PAGES_OR_STATIC) {
      setAllPlaylists([]);
      return;
    }
    setIsLoadingPlaylists(true);
    const combined: (PlaylistSummary & { accountId?: string; accountAlias?: string; platform?: string })[] = [];

    for (const acc of accList) {
      try {
        const res = await fetch(`/api/accounts/${acc.id}/playlists`, {
          headers: getAuthHeaders(),
        });
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
      const res = await fetch(`/api/accounts/${id}/test`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        alert(isEn ? `Account connection "${data.localAlias}" is active & healthy!` : `Koneksi akun "${data.localAlias}" berhasil dan aktif!`);
      } else {
        alert(isEn ? `Account connection failed: ${data.error || "Unknown error"}` : `Koneksi akun gagal: ${data.error || "Unknown error"}`);
      }
      await loadAccounts();
    } catch (err: any) {
      alert(isEn ? `Connection test failed: ${err.message}` : `Koneksi gagal: ${err.message}`);
    }
  };

  const handleRenameAccount = async (id: string, newAlias: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadAccounts();
      }
    } catch (err) {
      console.error("Delete account failed:", err);
    }
  };

  const handleSelectPlaylistForTransfer = async (
    playlist: PlaylistSummary,
    force: boolean = false,
    options?: {
      targetPlatform?: PlatformType | string;
      targetAccountId?: string;
      presetTracks?: TrackMetadata[];
    }
  ) => {
    stopMatchingPoller();
    setSelectedPlaylist(playlist);
    setTotalTracksToMatch(playlist.trackCount || 0);
    setActiveTab("transfer");

    const sourcePl = allPlaylists.find((p) => p.id === playlist.id);
    const sourcePlatform = sourcePl?.platform || playlist.platform || "youtube";

    const explicitTarget = options?.targetPlatform || selectedTargetPlatform;
    if (options?.targetPlatform && options.targetPlatform !== selectedTargetPlatform) {
      setSelectedTargetPlatform(options.targetPlatform as PlatformType);
      if (typeof window !== "undefined") {
        localStorage.setItem("playforgex_target_platform", options.targetPlatform);
      }
    }

    const targetPlatform =
      explicitTarget === sourcePlatform
        ? (accounts.find((a) => a.platform !== sourcePlatform)?.platform ||
           (sourcePlatform === "spotify" ? "youtube" : "spotify"))
        : explicitTarget;

    try {
      let draft: PlaylistDraft | null = null;
      let isRunning = false;

      if (!force) {
        try {
          const draftRes = await fetch(`/api/drafts/${sourcePlatform}/${playlist.id}`, {
            headers: getAuthHeaders(),
          });
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
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          sourceAccountId: sourcePl?.accountId,
          targetAccountId: options?.targetAccountId,
          sourcePlatform,
          targetPlatform,
          playlist,
          force,
          presetTracks: options?.presetTracks,
        }),
      });

      if (startRes.ok) {
        const poller = setInterval(async () => {
          try {
            const pRes = await fetch(`/api/drafts/${sourcePlatform}/${playlist.id}`, {
              headers: getAuthHeaders(),
            });
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
      } else if (IS_PAGES_OR_STATIC || !startRes.ok) {
        const demoTitles = [
          { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", dur: 244 },
          { title: "Starboy", artist: "The Weeknd", album: "Starboy", dur: 230 },
          { title: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories", dur: 248 },
          { title: "One More Time", artist: "Daft Punk", album: "Discovery", dur: 320 },
          { title: "Instant Crush", artist: "Daft Punk ft. Julian Casablancas", album: "Random Access Memories", dur: 337 },
          { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", dur: 200 },
          { title: "Save Your Tears", artist: "The Weeknd", album: "After Hours", dur: 215 },
          { title: "Resonance", artist: "HOME", album: "Odyssey", dur: 212 },
        ];

        const generated: TransferTrackItem[] = (options?.presetTracks || demoTitles).map((t, idx) => ({
          source: {
            id: `src_trk_${idx}`,
            videoId: `src_vid_${idx}`,
            title: t.title,
            artist: t.artist,
            album: (t as any).album || playlist.title,
            durationSeconds: (t as any).durationSeconds || (t as any).dur || 210,
          },
          sanitizedTitle: {
            originalTitle: t.title,
            cleanTitle: t.title,
            hasNonLatin: false,
          },
          selectedCandidate: {
            id: `cand_${targetPlatform}_${idx}`,
            name: t.title,
            artistName: t.artist,
            albumName: (t as any).album || playlist.title,
            durationInMillis: ((t as any).durationSeconds || (t as any).dur || 210) * 1000,
          },
          match: {
            status: "EXACT_MATCH",
            totalScore: 0.98,
            titleScore: 1.0,
            artistScore: 0.96,
            albumScore: 0.95,
          },
          excluded: false,
        }));

        setTrackItems(generated);
        setTotalTracksToMatch(generated.length);
        setIsMatching(false);
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
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
    targetPlatform?: PlatformType | string;
    targetAccountId?: string;
  }) => {
    if (!selectedPlaylist) return;
    setIsExportModalOpen(false);

    const sourcePl = allPlaylists.find((p) => p.id === selectedPlaylist.id);
    const sourcePlatform = sourcePl?.platform || selectedPlaylist.platform || "youtube";
    const targetPlatform = options.targetPlatform || effectiveTargetPlatform;
    const targetAccountId = options.targetAccountId;

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
        const pRes = await fetch("/api/transfer/progress", {
          headers: getAuthHeaders(),
        });
        if (pRes.ok) {
          const p = await pRes.json();
          setTransferJob((prev) => (prev ? { ...prev, progress: p } : null));
        }
      } catch {}
    }, 1000);

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          playlistTitle: options.playlistTitle,
          items: trackItems,
          targetPlatform,
          targetAccountId,
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
      if (res.ok) {
        const meta = getPlatformMeta(targetPlatform);
        setSuccessBanner(
          isEn
            ? `Successfully exported to ${meta.name}!`
            : `Berhasil mengekspor ke ${meta.name}!`
        );
        setTimeout(() => setSuccessBanner(null), 4000);
      }
      await loadActivity();
    } catch {
      if (IS_PAGES_OR_STATIC) {
        const total = trackItems.filter((t) => !t.excluded && t.selectedCandidate).length || 5;
        setTransferJob((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                progress: { current: total, total, success: total, failed: 0 },
              }
            : null
        );
        const meta = getPlatformMeta(targetPlatform);
        setSuccessBanner(
          isEn
            ? `Successfully exported to ${meta.name}!`
            : `Berhasil mengekspor ke ${meta.name}!`
        );
        setTimeout(() => setSuccessBanner(null), 4000);
      } else {
        setTransferJob((prev) => (prev ? { ...prev, status: "failed" } : null));
      }
    } finally {
      clearInterval(interval);
    }
  };

  const handleUpdateTargetPlatform = (platform: PlatformType | string) => {
    setSelectedTargetPlatform(platform);
    if (typeof window !== "undefined") {
      localStorage.setItem("playforgex_target_platform", platform);
    }
    if (selectedPlaylist) {
      handleSelectPlaylistForTransfer(selectedPlaylist, true, { targetPlatform: platform });
    }
  };

  const currentSourcePl = selectedPlaylist
    ? allPlaylists.find((p) => p.id === selectedPlaylist.id)
    : null;
  const currentSourcePlatform = currentSourcePl?.platform || selectedPlaylist?.platform || "youtube";
  const effectiveTargetPlatform =
    selectedTargetPlatform === currentSourcePlatform
      ? (accounts.find((a) => a.platform !== currentSourcePlatform)?.platform ||
         (currentSourcePlatform === "spotify" ? "youtube" : "spotify"))
      : selectedTargetPlatform;

  if (viewMode === "landing") {
    return <LandingPage onOpenStudio={handleOpenStudio} />;
  }

  // Standalone AuthScreen: unauthenticated visitors NEVER see the dashboard sidebar!
  if (!currentUser && !IS_PAGES_OR_STATIC) {
    return (
      <AuthScreen
        onLoginSuccess={handleAuthSuccess}
        onBackToLanding={handleOpenLanding}
      />
    );
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
                {t("app.pagesDemoNotice")}
              </span>
            </span>
            <button
              onClick={handleOpenLanding}
              className="underline text-[11px] hover:text-text-primary ml-2 font-medium flex-shrink-0"
            >
              {t("app.backToLanding")}
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
        <>
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
                targetPlatform={effectiveTargetPlatform}
                onSelectPlaylist={handleSelectPlaylistForTransfer}
                onToggleExclude={handleToggleExclude}
                onOpenAlternativePicker={setEditingItem}
                onStartTransfer={() => setIsExportModalOpen(true)}
                onReMatch={() => selectedPlaylist && handleSelectPlaylistForTransfer(selectedPlaylist, true)}
                onNavigateAccounts={() => setActiveTab("accounts")}
                onChangeTargetPlatform={handleUpdateTargetPlatform}
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

            {activeTab === "users" && currentUser?.role === "admin" && (
              <UsersView currentUser={currentUser} onRefreshStats={loadAccounts} />
            )}
        </>
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
        targetPlatform={effectiveTargetPlatform}
        availableAccounts={accounts}
        onChangeTargetPlatform={handleUpdateTargetPlatform}
        trackCount={trackItems.filter((t) => !t.excluded && t.selectedCandidate).length}
        isMatching={isMatching}
      />

      <AlternativePickerModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSelectAlternative={handleSelectAlternative}
        onSearchCatalog={handleSearchCandidateCatalog}
        targetPlatform={effectiveTargetPlatform}
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
