import React from "react";
import { CheckCircle2, AlertCircle, RefreshCw, ExternalLink, X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Transferring to Apple Music</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
              Playlist: <span className="text-slate-200 font-medium">{playlistTitle}</span>
            </p>
          </div>
          {isFinished && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-card text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar & Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Progress</span>
            <span className="font-mono text-slate-200">{percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-card rounded-full overflow-hidden border border-border">
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
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>
              {progress.current} of {progress.total} tracks processed
            </span>
            <span>
              {progress.success} added • {progress.failed} failed
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="p-3 rounded-lg bg-card border border-border flex items-center space-x-3 text-xs">
          {status === "processing" ? (
            <>
              <RefreshCw className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              <span className="text-slate-300">
                Adding tracks to Apple Music library in rate-limited batches...
              </span>
            </>
          ) : status === "completed" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-emerald-300 font-medium">
                Playlist successfully created in your Apple Music library!
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="text-rose-300">Transfer finished with some errors.</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {isFinished && appleMusicPlaylistId && (
            <a
              href={`https://music.apple.com/library/playlist/${appleMusicPlaylistId}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-surface hover:bg-card-hover border border-border text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Apple Music Web
            </a>
          )}
          {isFinished && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-medium transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
