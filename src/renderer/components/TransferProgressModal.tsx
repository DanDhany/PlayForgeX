import React from "react";
import { CheckCircle2, AlertCircle, RefreshCw, ExternalLink, X, Sparkles } from "lucide-react";
import { TransferJob } from "../../shared/types";

interface TransferProgressModalProps {
  job: TransferJob | null;
  onClose: () => void;
}

export const TransferProgressModal: React.FC<TransferProgressModalProps> = ({ job, onClose }) => {
  if (!job) return null;

  const { playlistTitle, progress, status, appleMusicPlaylistId } = job;
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isFinished = status === "completed" || status === "failed";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-surface border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-5 md:p-6 space-y-6 glass-panel-elevated animate-fade-in">
        {/* Mobile Handle */}
        <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Transfer ke Apple Music</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                Playlist: <span className="text-white font-semibold">{playlistTitle}</span>
              </p>
            </div>
          </div>
          {isFinished && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white btn-press transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar & Indicators */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Proses Transfer</span>
            <span className="font-mono text-white font-bold">{percent}%</span>
          </div>
          <div className="w-full h-3 bg-card rounded-full overflow-hidden border border-white/[0.08] p-0.5">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                status === "completed"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30"
                  : status === "failed"
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-red-500 via-rose-500 to-primary shadow-md shadow-primary/30"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>
              {progress.current} dari {progress.total} lagu diproses
            </span>
            <span className="text-slate-300">
              {progress.success} berhasil • {progress.failed} gagal
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="p-3.5 rounded-xl bg-card/80 border border-white/[0.06] flex items-center space-x-3 text-xs">
          {status === "processing" ? (
            <>
              <RefreshCw className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              <span className="text-slate-300">
                Menyuntikkan lagu ke katalog Apple Music secara bertahap (rate-limit safe)...
              </span>
            </>
          ) : status === "completed" ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-emerald-300 font-bold">Transfer Berhasil Selesai!</p>
                <p className="text-[11px] text-slate-400">
                  Playlist baru telah dibuat di perpustakaan Apple Music Anda.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-rose-300 font-bold">Transfer Selesai dengan Beberapa Catatan</p>
                <p className="text-[11px] text-slate-400">Beberapa lagu mungkin tidak tersedia di storefront.</p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2.5 pt-2">
          {isFinished && appleMusicPlaylistId && (
            <a
              href={`https://music.apple.com/library/playlist/${appleMusicPlaylistId}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-card hover:bg-card-hover border border-white/[0.1] text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 btn-press transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              Buka di Apple Music
            </a>
          )}
          {isFinished && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold btn-press transition shadow-lg shadow-primary/25"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
