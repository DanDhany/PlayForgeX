import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { PlaylistSidebar } from "./components/PlaylistSidebar";
import { ReviewStudio } from "./components/ReviewStudio";
import { AlternativePickerModal } from "./components/AlternativePickerModal";
import { TransferProgressModal } from "./components/TransferProgressModal";
import { AuthModalWeb } from "./components/AuthModalWeb";
import {
  ServiceAuthStatus,
  PlaylistSummary,
  TransferTrackItem,
  AppleMusicTrack,
  TransferJob,
} from "../shared/types";

export const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<ServiceAuthStatus>({
    youtube: { connected: false },
    apple: { connected: false },
  });

  const [isLoadingYt, setIsLoadingYt] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [playlistSource, setPlaylistSource] = useState<"youtube" | "apple">("youtube");
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistSummary | null>(null);
  const [trackItems, setTrackItems] = useState<TransferTrackItem[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const [editingItem, setEditingItem] = useState<TransferTrackItem | null>(null);
  const [transferJob, setTransferJob] = useState<TransferJob | null>(null);
  const [webAuthService, setWebAuthService] = useState<"youtube" | "apple" | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check if running in Electron environment
  const isElectron = typeof window !== "undefined" && !!window.api;

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    if (!isElectron) {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const status = await res.json();
          setAuthStatus(status);
          // If YTM has 0 playlists but Apple has playlists, default to Apple tab
          if (!status.youtube.connected && status.apple.connected) {
            setPlaylistSource("apple");
            loadPlaylistsWeb("apple");
          } else {
            loadPlaylistsWeb(playlistSource);
          }
        }
      } catch (err) {
        console.warn("Web API not reachable:", err);
      }
      return;
    }

    try {
      const status = await window.api.getStatus();
      setAuthStatus(status);
      if (status.youtube.connected) {
        loadPlaylistsElectron();
      }
    } catch (err) {
      console.error("Error getting status:", err);
    }
  };

  const loadPlaylistsElectron = async () => {
    setIsLoadingPlaylists(true);
    try {
      const list = await window.api.fetchPlaylists();
      setPlaylists(list);
    } catch (err) {
      console.error("Failed to load playlists:", err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const loadPlaylistsWeb = async (source = playlistSource) => {
    setIsLoadingPlaylists(true);
    try {
      const res = await fetch(`/api/playlists?source=${source}`);
      if (res.ok) {
        const list = await res.json();
        setPlaylists(list);
      }
    } catch (err) {
      console.error("Failed to load playlists via web API:", err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleChangePlaylistSource = (source: "youtube" | "apple") => {
    setPlaylistSource(source);
    setSelectedPlaylist(null);
    setTrackItems([]);
    loadPlaylistsWeb(source);
  };

  const handleLoginYouTube = async () => {
    if (!isElectron) {
      setWebAuthService("youtube");
      return;
    }
    setIsLoadingYt(true);
    try {
      const res = await window.api.loginYouTube();
      if (res.success) {
        await refreshStatus();
      } else if (res.error) {
        alert(`YouTube Music login: ${res.error}`);
      }
    } catch (err: any) {
      alert(`YouTube login error: ${err.message}`);
    } finally {
      setIsLoadingYt(false);
    }
  };

  const handleLoginApple = async () => {
    if (!isElectron) {
      setWebAuthService("apple");
      return;
    }
    setIsLoadingApple(true);
    try {
      const res = await window.api.loginApple();
      if (res.success) {
        await refreshStatus();
      } else if (res.error) {
        alert(`Apple Music login: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Apple login error: ${err.message}`);
    } finally {
      setIsLoadingApple(false);
    }
  };

  const handleSubmitWebYouTube = async (cookieString: string) => {
    const res = await fetch("/api/auth/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookieString }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save YouTube cookie");
    await refreshStatus();
  };

  const handleSubmitWebApple = async (musicUserToken: string, developerToken?: string) => {
    const res = await fetch("/api/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicUserToken, developerToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save Apple Music token");
    await refreshStatus();
  };

  const handleLogout = async (service: "youtube" | "apple") => {
    if (isElectron) {
      await window.api.logout(service);
    } else {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
    }
    await refreshStatus();
  };

  const handleSelectPlaylist = async (playlist: PlaylistSummary) => {
    setSelectedPlaylist(playlist);
    setIsMatching(true);

    if (!isElectron) {
      try {
        const tracksRes = await fetch(`/api/playlists/${playlist.id}/tracks?source=${playlistSource}`);
        if (!tracksRes.ok) throw new Error("Failed to fetch tracks");
        const tracks = await tracksRes.json();

        if (playlistSource === "apple") {
          // It is an Apple Music playlist: map directly into view
          const items: TransferTrackItem[] = tracks.map((t: any) => ({
            source: t,
            sanitizedTitle: {
              rawTitle: t.title,
              originalTitle: t.title,
              cleanTitle: t.title,
              hasNonLatin: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(t.title),
            },
            match: {
              status: "EXACT_MATCH",
              totalScore: 100,
              titleScore: 100,
              artistScore: 100,
              albumScore: 100,
            },
            selectedCandidate: {
              id: t.videoId,
              name: t.title,
              artistName: t.artist,
              albumName: t.album,
              durationInMillis: t.durationSeconds ? t.durationSeconds * 1000 : undefined,
              artworkUrl: t.thumbnailUrl,
            },
            excluded: false,
          }));
          setTrackItems(items);
          setIsMatching(false);
          return;
        }

        const matchRes = await fetch("/api/tracks/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracks }),
        });
        if (!matchRes.ok) throw new Error("Failed to match tracks");
        const matched = await matchRes.json();
        setTrackItems(matched);
      } catch (err) {
        console.error("Web match error:", err);
      } finally {
        setIsMatching(false);
      }
      return;
    }

    try {
      const tracks = await window.api.fetchTracks(playlist.id);
      const matched = await window.api.matchTracks(tracks);
      setTrackItems(matched);
    } catch (err) {
      console.error("Error matching tracks:", err);
    } finally {
      setIsMatching(false);
    }
  };

  const handleToggleExclude = (item: TransferTrackItem) => {
    setTrackItems((prev) =>
      prev.map((t) => (t === item ? { ...t, excluded: !t.excluded } : t))
    );
  };

  const handleSelectAlternative = (item: TransferTrackItem, candidate: AppleMusicTrack) => {
    setTrackItems((prev) =>
      prev.map((t) => {
        if (t === item) {
          return {
            ...t,
            selectedCandidate: candidate,
            excluded: false,
            match: {
              ...t.match,
              status: "EXACT_MATCH",
              totalScore: 1.0,
              reason: "Manually selected alternative",
            },
          };
        }
        return t;
      })
    );
  };

  const handleSearchAppleCatalog = async (query: string): Promise<AppleMusicTrack[]> => {
    if (!isElectron) {
      try {
        const res = await fetch("/api/search/apple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.error("Web catalog search error:", err);
      }
      return [];
    }
    return window.api.searchAppleCatalog(query);
  };

  const handleStartTransfer = async () => {
    if (!selectedPlaylist) return;

    const job: TransferJob = {
      playlistId: selectedPlaylist.id,
      playlistTitle: selectedPlaylist.title,
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

    if (!isElectron) {
      // Poll progress in web mode
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
            playlistTitle: selectedPlaylist.title,
            items: trackItems,
          }),
        });
        const data = await res.json();
        setTransferJob((prev) =>
          prev
            ? {
                ...prev,
                status: res.ok ? "completed" : "failed",
                appleMusicPlaylistId: data.createdPlaylistId,
              }
            : null
        );
      } catch (err: any) {
        setTransferJob((prev) => (prev ? { ...prev, status: "failed" } : null));
      } finally {
        clearInterval(interval);
      }
      return;
    }

    // Electron mode
    const unsubscribe = window.api.onTransferProgress((p) => {
      setTransferJob((prev) => (prev ? { ...prev, progress: p } : null));
    });

    try {
      const res = await window.api.executeTransfer(selectedPlaylist.title, trackItems);
      setTransferJob((prev) =>
        prev
          ? {
              ...prev,
              status: res.success ? "completed" : "failed",
              appleMusicPlaylistId: res.createdPlaylistId,
            }
          : null
      );
    } catch (err: any) {
      setTransferJob((prev) => (prev ? { ...prev, status: "failed" } : null));
    } finally {
      unsubscribe();
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-screen bg-background overflow-x-hidden text-slate-100 font-sans selection:bg-primary selection:text-white">
      <Header
        authStatus={authStatus}
        isLoadingYt={isLoadingYt}
        isLoadingApple={isLoadingApple}
        onLoginYouTube={handleLoginYouTube}
        onLoginApple={handleLoginApple}
        onLogout={handleLogout}
        onRefresh={refreshStatus}
        onToggleMobileDrawer={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <PlaylistSidebar
          playlists={playlists}
          selectedPlaylistId={selectedPlaylist?.id || null}
          onSelectPlaylist={handleSelectPlaylist}
          isLoading={isLoadingPlaylists}
          onRefreshPlaylists={() => (isElectron ? loadPlaylistsElectron() : loadPlaylistsWeb(playlistSource))}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          activeSource={playlistSource}
          onChangeSource={handleChangePlaylistSource}
          youtubeCount={authStatus.youtube.playlistCount}
          appleCount={authStatus.apple.playlistCount}
        />

        <ReviewStudio
          selectedPlaylist={selectedPlaylist}
          items={trackItems}
          isMatching={isMatching}
          isTransferring={transferJob?.status === "processing"}
          onToggleExclude={handleToggleExclude}
          onOpenAlternativePicker={setEditingItem}
          onStartTransfer={handleStartTransfer}
          onReMatch={() => selectedPlaylist && handleSelectPlaylist(selectedPlaylist)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
      </div>

      {/* Alternative Song Picker Modal */}
      <AlternativePickerModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSelectAlternative={handleSelectAlternative}
        onSearchCatalog={handleSearchAppleCatalog}
      />

      {/* Transfer Execution Modal */}
      <TransferProgressModal
        job={transferJob}
        onClose={() => setTransferJob(null)}
      />

      {/* Web / Docker Mode Connect Modal */}
      <AuthModalWeb
        service={webAuthService}
        onClose={() => setWebAuthService(null)}
        onSubmitYouTube={handleSubmitWebYouTube}
        onSubmitApple={handleSubmitWebApple}
      />
    </div>
  );
};
