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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Container: Bottom Sheet on Mobile, Centered Modal on Desktop */}
      <div className="bg-surface border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-2xl max-h-[88dvh] flex flex-col shadow-2xl overflow-hidden glass-panel-elevated animate-fade-in">
        {/* Mobile Swipe / Sheet Handle */}
        <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-card/60">
          <div>
            <h3 className="text-sm md:text-base font-bold text-white">
              Cari & Ganti Versi Lagu
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs md:max-w-md">
              Asal: <span className="text-white font-semibold">{item.sanitizedTitle.originalTitle}</span> — {item.source.artist}
            </p>
          </div>
          <button
            onClick={() => {
              if (audioElement) audioElement.pause();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white btn-press transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar & Quick Chips */}
        <div className="p-4 border-b border-white/[0.08] bg-card/40 space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik judul lagu, artist, atau Kanji..."
                className="w-full bg-surface border border-white/[0.1] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 btn-press transition shadow-md shadow-primary/20"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Cari"}
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-slate-500 flex-shrink-0 text-[10px]">Filter cepat:</span>
            <button
              type="button"
              onClick={() => {
                setQuery(item.sanitizedTitle.originalTitle);
                handleSearch(item.sanitizedTitle.originalTitle);
              }}
              className="px-2.5 py-1 rounded-lg bg-card hover:bg-card-hover border border-white/[0.08] text-slate-300 hover:text-white flex-shrink-0 btn-press transition"
            >
              Judul: {item.sanitizedTitle.originalTitle}
            </button>
            <button
              type="button"
              onClick={() => {
                const combined = `${item.sanitizedTitle.originalTitle} ${item.source.artist}`;
                setQuery(combined);
                handleSearch(combined);
              }}
              className="px-2.5 py-1 rounded-lg bg-card hover:bg-card-hover border border-white/[0.08] text-slate-300 hover:text-white flex-shrink-0 btn-press transition"
            >
              Judul + Artist
            </button>
            {item.sanitizedTitle.subtitle && (
              <button
                type="button"
                onClick={() => {
                  setQuery(item.sanitizedTitle.subtitle!);
                  handleSearch(item.sanitizedTitle.subtitle);
                }}
                className="px-2.5 py-1 rounded-lg bg-card hover:bg-card-hover border border-white/[0.08] text-slate-300 hover:text-white flex-shrink-0 btn-press transition"
              >
                Subtitle: {item.sanitizedTitle.subtitle}
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {isSearching ? (
            <div className="py-14 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span>Mencari di katalog Apple Music...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-500">
              Tidak ditemukan lagu untuk kata kunci "{query}". Coba cari dengan variasi judul lain.
            </div>
          ) : (
            results.map((candidate) => {
              const isSelected = item.selectedCandidate?.id === candidate.id;
              const isPlaying = playingPreviewId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className={`p-3 rounded-xl border flex items-center justify-between space-x-3 transition btn-press ${
                    isSelected
                      ? "bg-primary/10 border-primary/50 shadow-sm"
                      : "bg-card/80 border-white/[0.06] hover:border-slate-500/50"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Artwork + Play Preview */}
                    <div className="relative group w-12 h-12 rounded-xl bg-surface border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
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
                          className="absolute inset-0 bg-black/60 flex items-center justify-center transition"
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
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatMillis(candidate.durationInMillis)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {candidate.artistName} {candidate.albumName && `• ${candidate.albumName}`}
                      </p>
                    </div>
                  </div>

                  {/* Choose Track Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (audioElement) audioElement.pause();
                      onSelectAlternative(item, candidate);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 btn-press transition ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-card hover:bg-card-hover border border-white/[0.08] text-slate-200"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Terpilih
                      </>
                    ) : (
                      "Pilih Ini"
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
