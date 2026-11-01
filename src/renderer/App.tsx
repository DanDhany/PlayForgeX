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
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistSummary | null>(null);
  const [trackItems, setTrackItems] = useState<TransferTrackItem[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  const [editingItem, setEditingItem] = useState<TransferTrackItem | null>(null);
  const [transferJob, setTransferJob] = useState<TransferJob | null>(null);
  const [webAuthService, setWebAuthService] = useState<"youtube" | "apple" | null>(null);

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
          if (status.youtube.connected) {
            loadPlaylistsWeb();
          }
        }
      } catch (err) {
        console.warn("Web API not available, loading mock data:", err);
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

  const loadPlaylistsWeb = async () => {
    setIsLoadingPlaylists(true);
    try {
      const res = await fetch("/api/playlists");
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
        const tracksRes = await fetch(`/api/playlists/${playlist.id}/tracks`);
        if (!tracksRes.ok) throw new Error("Failed to fetch tracks");
        const tracks = await tracksRes.json();

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
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden text-slate-100 font-sans">
      <Header
        authStatus={authStatus}
        isLoadingYt={isLoadingYt}
        isLoadingApple={isLoadingApple}
        onLoginYouTube={handleLoginYouTube}
        onLoginApple={handleLoginApple}
        onLogout={handleLogout}
        onRefresh={refreshStatus}
      />

      <div className="flex flex-1 overflow-hidden">
        <PlaylistSidebar
          playlists={playlists}
          selectedPlaylistId={selectedPlaylist?.id || null}
          onSelectPlaylist={handleSelectPlaylist}
          isLoading={isLoadingPlaylists}
          onRefreshPlaylists={isElectron ? loadPlaylistsElectron : loadPlaylistsWeb}
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
