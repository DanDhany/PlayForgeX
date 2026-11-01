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

      <div className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-4 md:p-6 space-y-5 animate-sheet-up md:animate-dialog-in pb-safe">
        {/* Mobile Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="min-w-0 pr-3">
            <h3 className="text-sm md:text-base font-semibold text-text-primary">
              Transfer Playlist
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 truncate">
              Target: <span className="text-text-primary font-medium">{playlistTitle}</span>
            </p>
          </div>
          {isFinished && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover btn-press transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar & Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">Progres Sinkronisasi</span>
            <span className="font-mono tabular-nums text-text-primary font-semibold">{percent}%</span>
          </div>

          <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden border border-border">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                status === "completed"
                  ? "bg-status-success"
                  : status === "failed"
                  ? "bg-status-danger"
                  : "bg-accent"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-text-secondary font-mono tabular-nums">
            <span>
              {progress.current} / {progress.total} lagu diproses
            </span>
            <span className="text-text-primary">
              {progress.success} berhasil · {progress.failed} gagal
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center space-x-3 text-xs">
          {status === "processing" ? (
            <>
              <RefreshCw className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
              <span className="text-text-secondary">
                Menyuntikkan lagu secara bertahap dengan jeda aman anti-ban...
              </span>
            </>
          ) : status === "completed" ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-status-success font-semibold">Transfer Berhasil!</p>
                <p className="text-[11px] text-text-secondary">
                  Lagu telah tersimpan ke perpustakaan akun tujuan Anda.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-status-danger font-semibold">Transfer Selesai Sebagian</p>
                <p className="text-[11px] text-text-secondary">Beberapa lagu mungkin tidak tersedia di katalog.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {isFinished && (
          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent/90 btn-press shadow-sm"
            >
              Selesai & Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
