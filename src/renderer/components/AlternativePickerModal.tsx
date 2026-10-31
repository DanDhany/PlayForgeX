import React, { useState, useEffect } from "react";
import { X, Search, Disc, Play, Pause, Check, RefreshCw } from "lucide-react";
import { TransferTrackItem, AppleMusicTrack } from "../../shared/types";
import { formatMillis } from "../utils/ui-helpers";

interface AlternativePickerModalProps {
  item: TransferTrackItem | null;
  onClose: () => void;
  onSelectAlternative: (item: TransferTrackItem, candidate: AppleMusicTrack) => void;
  onSearchCatalog: (query: string) => Promise<AppleMusicTrack[]>;
}

export const AlternativePickerModal: React.FC<AlternativePickerModalProps> = ({
  item,
  onClose,
  onSelectAlternative,
  onSearchCatalog,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Select Apple Music Track Alternative
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Source: <span className="text-white font-medium">{item.sanitizedTitle.originalTitle}</span> — {item.source.artist}
            </p>
          </div>
          <button
            onClick={() => {
              if (audioElement) audioElement.pause();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-surface text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-border bg-card/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search song title, artist, or Kanji name..."
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary transition"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-[10px] text-slate-500">Quick queries:</span>
            <button
              type="button"
              onClick={() => {
                setQuery(item.sanitizedTitle.originalTitle);
                handleSearch(item.sanitizedTitle.originalTitle);
              }}
              className="text-[10px] bg-card hover:bg-card-hover px-2 py-0.5 rounded border border-border text-slate-300 transition"
            >
              Title: {item.sanitizedTitle.originalTitle}
            </button>
            <button
              type="button"
              onClick={() => {
                const combined = `${item.sanitizedTitle.originalTitle} ${item.source.artist}`;
                setQuery(combined);
                handleSearch(combined);
              }}
              className="text-[10px] bg-card hover:bg-card-hover px-2 py-0.5 rounded border border-border text-slate-300 transition"
            >
              Title + Artist
            </button>
            {item.sanitizedTitle.subtitle && (
              <button
                type="button"
                onClick={() => {
                  setQuery(item.sanitizedTitle.subtitle!);
                  handleSearch(item.sanitizedTitle.subtitle);
                }}
                className="text-[10px] bg-card hover:bg-card-hover px-2 py-0.5 rounded border border-border text-slate-300 transition"
              >
                Subtitle: {item.sanitizedTitle.subtitle}
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isSearching ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              <span>Searching Apple Music catalog...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No results found for "{query}". Try searching with different keywords.
            </div>
          ) : (
            results.map((candidate) => {
              const isSelected = item.selectedCandidate?.id === candidate.id;
              const isPlaying = playingPreviewId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className={`p-3 rounded-lg border flex items-center justify-between space-x-3 transition ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 shadow-sm"
                      : "bg-card border-border hover:border-slate-600/70"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Artwork + Play Preview */}
                    <div className="relative group w-11 h-11 rounded bg-surface border border-border/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {candidate.artworkUrl ? (
                        <img
                          src={candidate.artworkUrl}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc className="w-5 h-5 text-slate-600" />
                      )}

                      {candidate.previewUrl && (
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(candidate.previewUrl, candidate.id)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 text-primary fill-primary" />
                          ) : (
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-semibold text-slate-100 truncate">
                          {candidate.name}
                        </h4>
                        {candidate.durationInMillis && (
                          <span className="text-[10px] font-mono text-slate-500">
                            {formatMillis(candidate.durationInMillis)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {candidate.artistName} {candidate.albumName && `• ${candidate.albumName}`}
                      </p>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (audioElement) audioElement.pause();
                      onSelectAlternative(item, candidate);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      isSelected
                        ? "bg-primary text-white cursor-default"
                        : "bg-surface hover:bg-card-hover border border-border text-slate-200"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </>
                    ) : (
                      "Choose This"
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
