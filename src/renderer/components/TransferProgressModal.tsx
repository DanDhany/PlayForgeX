import React from "react";
import { CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { TransferJob } from "../../shared/types";

interface TransferProgressModalProps {
  job: TransferJob | null;
  onClose: () => void;
}

export const TransferProgressModal: React.FC<TransferProgressModalProps> = ({ job, onClose }) => {
  if (!job) return null;

  const { playlistTitle, progress, status } = job;
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isFinished = status === "completed" || status === "failed";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="fixed inset-0 -z-10" onClick={isFinished ? onClose : undefined} />

      <div className="bg-surface border-t md:border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-4 md:p-6 space-y-5 animate-sheet-up md:animate-dialog-in pb-safe">
        {/* Mobile Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="min-w-0 pr-3">
            <h3 className="text-sm md:text-base font-semibold text-white">
              Transfer Playlist
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Target: <span className="text-white font-medium">{playlistTitle}</span>
            </p>
          </div>
          {isFinished && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] btn-press transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar & Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Progres Sinkronisasi</span>
            <span className="font-mono tabular-nums text-white font-semibold">{percent}%</span>
          </div>

          <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-white/[0.08]">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                status === "completed"
                  ? "bg-emerald-500"
                  : status === "failed"
                  ? "bg-rose-500"
                  : "bg-primary"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
            <span>
              {progress.current} / {progress.total} lagu diproses
            </span>
            <span className="text-slate-300">
              {progress.success} berhasil · {progress.failed} gagal
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="p-3 rounded-xl bg-card border border-white/[0.06] flex items-center space-x-3 text-xs">
          {status === "processing" ? (
            <>
              <RefreshCw className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              <span className="text-slate-300">
                Menyuntikkan lagu secara bertahap dengan jeda aman anti-ban...
              </span>
            </>
          ) : status === "completed" ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-emerald-300 font-semibold">Transfer Berhasil!</p>
                <p className="text-[11px] text-slate-400">
                  Lagu telah tersimpan ke perpustakaan akun tujuan Anda.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-rose-300 font-semibold">Transfer Selesai Sebagian</p>
                <p className="text-[11px] text-slate-400">Beberapa lagu mungkin tidak tersedia di katalog.</p>
              </div>
            </>
          )}
        </div>

        {/* Finished Action Button */}
        {isFinished && (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-card hover:bg-card-hover border border-white/[0.08] text-white rounded-xl text-xs font-semibold btn-press transition"
          >
            Selesai & Tutup
          </button>
        )}
      </div>
    </div>
  );
};
