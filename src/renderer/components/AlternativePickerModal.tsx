import React, { useState, useEffect } from "react";
import { X, Search, Disc, Play, Pause, Check, RefreshCw } from "lucide-react";
import { TransferTrackItem, AppleMusicTrack } from "../../shared/types";
import { formatMillis } from "../utils/ui-helpers";

interface AlternativePickerModalProps {
  item: TransferTrackItem | null;
  onClose: () => void;
  onSelectAlternative: (item: TransferTrackItem, candidate: AppleMusicTrack) => void;
  onSearchCatalog: (query: string) => Promise<AppleMusicTrack[]>;
  targetPlatform?: "apple" | "youtube";
}

export const AlternativePickerModal: React.FC<AlternativePickerModalProps> = ({
  item,
  onClose,
  onSelectAlternative,
  onSearchCatalog,
  targetPlatform = "apple",
}) => {
  if (!item) return null;

  const [query, setQuery] = useState(item.sanitizedTitle.originalTitle || item.source.title);
  const [results, setResults] = useState<AppleMusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    handleSearch();
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const tracks = await onSearchCatalog(q);
      setResults(tracks);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTogglePlay = (previewUrl?: string, trackId?: string) => {
    if (!previewUrl || !trackId) return;

    if (playingPreviewId === trackId) {
      audioElement?.pause();
      setPlayingPreviewId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(previewUrl);
      audio.play();
      audio.onended = () => setPlayingPreviewId(null);
      setAudioElement(audio);
      setPlayingPreviewId(trackId);
    }
  };

  const platformTitle = targetPlatform === "youtube" ? "YouTube Music" : "Apple Music";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => {
          if (audioElement) audioElement.pause();
          onClose();
        }}
      />

      {/* Modal / Bottom Sheet Box */}
      <div className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl w-full max-w-2xl max-h-[90dvh] md:max-h-[82dvh] flex flex-col shadow-2xl overflow-hidden animate-sheet-up md:animate-dialog-in pb-safe">
        {/* iOS Drag Handle on Mobile */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="px-4 py-3 md:px-5 md:py-3.5 border-b border-border flex items-center justify-between bg-surface-elevated">
          <div className="min-w-0 pr-3">
            <h3 className="text-xs md:text-sm font-semibold text-text-primary">
              Cari Lagu di {platformTitle}
            </h3>
            <p className="text-[11px] text-text-secondary truncate mt-0.5">
              Sumber: <span className="text-text-primary">{item.sanitizedTitle.originalTitle}</span> · {item.source.artist}
            </p>
          </div>
          <button
            onClick={() => {
              if (audioElement) audioElement.pause();
              onClose();
            }}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover btn-press transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar & Quick Chips */}
        <div className="p-3 md:p-4 border-b border-border bg-surface-elevated/50 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-secondary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik judul lagu atau artis..."
                className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3.5 py-1.5 bg-accent text-background font-semibold hover:bg-accent/90 disabled:opacity-50 text-xs rounded-lg flex items-center gap-1.5 btn-press transition-colors shadow-sm"
            >
              {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Cari"}
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
            <span className="text-text-secondary/70 flex-shrink-0 text-[10px]">Cepat:</span>
            <button
              type="button"
              onClick={() => {
                setQuery(item.sanitizedTitle.originalTitle);
                handleSearch(item.sanitizedTitle.originalTitle);
              }}
              className="px-2 py-0.5 rounded-md bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary flex-shrink-0 btn-press transition-colors"
            >
              Judul: {item.sanitizedTitle.originalTitle}
            </button>
            {item.source.artist && (
              <button
                type="button"
                onClick={() => {
                  const combined = `${item.sanitizedTitle.originalTitle} ${item.source.artist}`;
                  setQuery(combined);
                  handleSearch(combined);
                }}
                className="px-2 py-0.5 rounded-md bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary flex-shrink-0 btn-press transition-colors"
              >
                Judul + Artis
              </button>
            )}
            {item.sanitizedTitle.subtitle && (
              <button
                type="button"
                onClick={() => {
                  const sub = item.sanitizedTitle.subtitle!;
                  setQuery(sub);
                  handleSearch(sub);
                }}
                className="px-2 py-0.5 rounded-md bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary flex-shrink-0 btn-press transition-colors"
              >
                Subtitle: {item.sanitizedTitle.subtitle}
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {isSearching ? (
            <div className="py-14 text-center text-xs text-text-secondary flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-accent" />
              <span>Mencari di katalog {platformTitle}...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-14 text-center text-xs text-text-secondary/60">
              Tidak ada lagu yang ditemukan untuk "{query}".
            </div>
          ) : (
            results.map((candidate) => {
              const isSelected = item.selectedCandidate?.id === candidate.id;
              const isPlaying = playingPreviewId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between space-x-3 transition btn-press ${
                    isSelected
                      ? "bg-accent/15 border-accent text-text-primary shadow-sm"
                      : "bg-surface border-border hover:bg-surface-elevated hover:border-accent/30"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Artwork / Preview Play */}
                    <div className="relative group/can w-10 h-10 rounded-lg bg-surface-elevated border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {candidate.artworkUrl ? (
                        <img
                          src={candidate.artworkUrl}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc className="w-4 h-4 text-text-secondary" />
                      )}

                      {candidate.previewUrl && (
                        <button
                          onClick={() => handleTogglePlay(candidate.previewUrl, candidate.id)}
                          className={`absolute inset-0 flex items-center justify-center transition ${
                            isPlaying
                              ? "bg-black/75 opacity-100"
                              : "bg-black/60 opacity-0 group-hover/can:opacity-100"
                          }`}
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-semibold text-text-primary truncate">
                          {candidate.name}
                        </h4>
                        {candidate.durationInMillis && (
                          <span className="text-[10px] font-mono text-text-secondary/70">
                            {formatMillis(candidate.durationInMillis)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary truncate mt-0.5">
                        {candidate.artistName}
                        {candidate.albumName ? ` · ${candidate.albumName}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Select CTA */}
                  <button
                    onClick={() => {
                      if (audioElement) audioElement.pause();
                      onSelectAlternative(item, candidate);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 flex-shrink-0 btn-press transition ${
                      isSelected
                        ? "bg-accent text-background font-semibold shadow-sm"
                        : "bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Terpilih</span>
                      </>
                    ) : (
                      <span>Pilih</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
