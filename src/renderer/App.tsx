import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { PlaylistSidebar } from "./components/PlaylistSidebar";
import { ReviewStudio } from "./components/ReviewStudio";
import { AlternativePickerModal } from "./components/AlternativePickerModal";
import { TransferProgressModal } from "./components/TransferProgressModal";
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

  // Check if running in Electron environment
  const isElectron = typeof window !== "undefined" && !!window.api;

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    if (!isElectron) {
      // Demo / Browser Mock for development
      setAuthStatus({
        youtube: { connected: true, playlistCount: 3 },
        apple: { connected: true, storefront: "JP" },
      });
      loadMockPlaylists();
      return;
    }

    try {
      const status = await window.api.getStatus();
      setAuthStatus(status);
      if (status.youtube.connected) {
        loadPlaylists();
      }
    } catch (err) {
      console.error("Error getting status:", err);
    }
  };

  const loadPlaylists = async () => {
    if (!isElectron) return;
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

  const loadMockPlaylists = () => {
    const mock: PlaylistSummary[] = [
      {
        id: "VLPL_jpop_heavy",
        title: "Japanese Anime & J-Pop Hits",
        trackCount: 4,
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
      },
      {
        id: "VLPL_chill_vibes",
        title: "Midnight City Pop & Covers",
        trackCount: 3,
        thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
      },
    ];
    setPlaylists(mock);
  };

  const handleLoginYouTube = async () => {
    if (!isElectron) {
      alert("Modal login runs in the native Electron app.");
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
      alert("Modal login runs in the native Electron app.");
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

  const handleLogout = async (service: "youtube" | "apple") => {
    if (isElectron) {
      await window.api.logout(service);
    }
    await refreshStatus();
  };

  const handleSelectPlaylist = async (playlist: PlaylistSummary) => {
    setSelectedPlaylist(playlist);
    setIsMatching(true);

    if (!isElectron) {
      // Demo mock match for browser testing
      setTimeout(() => {
        setTrackItems([
          {
            source: {
              title: "夜に駆ける (Racing into the Night) [Official Music Video]",
              artist: "YOASOBI",
              album: "THE BOOK",
            },
            sanitizedTitle: {
              rawTitle: "夜に駆ける (Racing into the Night) [Official Music Video]",
              originalTitle: "夜に駆ける",
              cleanTitle: "夜に駆ける",
              subtitle: "Racing into the Night",
              hasNonLatin: true,
            },
            match: {
              status: "EXACT_MATCH",
              totalScore: 0.96,
              titleScore: 1.0,
              artistScore: 1.0,
              albumScore: 0.8,
              reason: "Exact match on title and artist",
            },
            selectedCandidate: {
              id: "apple_track_1",
              name: "夜に駆ける",
              artistName: "YOASOBI",
              albumName: "THE BOOK",
              durationInMillis: 261000,
              artworkUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&h=150&fit=crop",
              previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/7e/3c/6f/7e3c6f84-f254-bca5-523e-8c3da87b089c/mzaf_10526723223689408272.plus.aac.p.m4a",
            },
            excluded: false,
          },
          {
            source: {
              title: "廻廻奇譚 / Eve (Cover by VTuber) [Audio]",
              artist: "Hoshimachi Suisei",
              album: "Hololive Covers",
            },
            sanitizedTitle: {
              rawTitle: "廻廻奇譚 / Eve (Cover by VTuber) [Audio]",
              originalTitle: "廻廻奇譚",
              cleanTitle: "廻廻奇譚",
              hasNonLatin: true,
            },
            match: {
              status: "COVER_OR_ALT",
              totalScore: 0.68,
              titleScore: 1.0,
              artistScore: 0.15,
              albumScore: 0.1,
              reason: "Cover version: Title matched, artist differs",
            },
            selectedCandidate: {
              id: "apple_track_2",
              name: "廻廻奇譚",
              artistName: "Eve",
              albumName: "Kaizin",
              durationInMillis: 220000,
              artworkUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop",
            },
            excluded: false,
          },
          {
            source: {
              title: "Unknown Doujin Track (Unavailable on major stores)",
              artist: "Indie Circle",
            },
            sanitizedTitle: {
              rawTitle: "Unknown Doujin Track",
              originalTitle: "Unknown Doujin Track",
              cleanTitle: "Unknown Doujin Track",
              hasNonLatin: false,
            },
            match: {
              status: "NOT_FOUND",
              totalScore: 0.05,
              titleScore: 0.0,
              artistScore: 0.0,
              albumScore: 0.0,
              reason: "No matches found in catalog",
            },
            excluded: true,
          },
        ]);
        setIsMatching(false);
      }, 700);
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
      return [
        {
          id: "alt_mock_1",
          name: query,
          artistName: "Official Artist",
          albumName: "Greatest Hits",
          durationInMillis: 215000,
          artworkUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop",
        },
      ];
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
      // Demo simulate progress in browser
      setTimeout(() => {
        setTransferJob((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                appleMusicPlaylistId: "pl.u-demo123",
                progress: {
                  current: prev.progress.total,
                  total: prev.progress.total,
                  success: prev.progress.total,
                  failed: 0,
                },
              }
            : null
        );
      }, 2000);
      return;
    }

    // Subscribe to progress
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
          onRefreshPlaylists={loadPlaylists}
        />

        <ReviewStudio
          selectedPlaylist={selectedPlaylist}
          items={trackItems}
          isMatching={isMatching}
          isTransferring={transferJob?.status === "processing"}
          onToggleExclude={handleToggleExclude}
          onSelectAlternative={handleSelectAlternative}
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
    </div>
  );
};
