import React, { useState } from "react";
import {
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";
import { ActivityLogItem } from "../../../shared/types";

interface ActivityViewProps {
  activityLogs: ActivityLogItem[];
  onRefresh: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activityLogs,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "partial">("all");

  const filtered = activityLogs.filter((log) => {
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.workflowName.toLowerCase().includes(q) ||
      log.destinationAlias.toLowerCase().includes(q) ||
      log.sourceAliases.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-text-primary">
            Riwayat Aktivitas
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Catatan audit proses transfer dan merge playlist yang pernah dieksekusi.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-text-primary font-medium flex items-center gap-1.5 btn-press self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-text-secondary" />
          <span>Refresh Riwayat</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-text-secondary" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama workflow atau akun..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface-elevated rounded-lg border border-border text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors btn-press ${
              statusFilter === "all" ? "bg-accent/20 text-accent font-semibold" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Semua ({activityLogs.length})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors btn-press ${
              statusFilter === "completed" ? "bg-status-success/20 text-status-success font-semibold" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Selesai
          </button>
          <button
            onClick={() => setStatusFilter("failed")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors btn-press ${
              statusFilter === "failed" ? "bg-status-danger/20 text-status-danger font-semibold" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Gagal
          </button>
        </div>
      </div>

      {/* Audit Trail List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border space-y-3 bg-surface/50">
          <History className="w-8 h-8 text-text-secondary/50 mx-auto" />
          <div className="text-xs text-text-secondary">Tidak ada catatan aktivitas yang cocok.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const dateStr = new Date(log.timestamp).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-surface border border-border space-y-3 hover:border-border/90 transition-colors shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                        log.status === "completed"
                          ? "bg-status-success/15 text-status-success border border-status-success/20"
                          : "bg-status-danger/15 text-status-danger border border-status-danger/20"
                      }`}
                    >
                      {log.status === "completed" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span>{log.status === "completed" ? "Sukses" : "Gagal"}</span>
                    </span>
                    <h3 className="text-xs md:text-sm font-semibold text-text-primary">
                      {log.workflowName}
                    </h3>
                  </div>

                  <span className="text-[11px] text-text-secondary font-mono">
                    {dateStr}
                  </span>
                </div>

                {/* Source & Destination Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[11px] text-text-secondary">Sumber:</span>
                    {log.sourceAliases.map((src, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-[11px] text-text-primary font-medium"
                      >
                        {src}
                      </span>
                    ))}
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-text-secondary">Tujuan:</span>
                    <span className="px-2 py-0.5 rounded bg-accent/15 border border-accent/25 text-accent text-[11px] font-medium">
                      {log.destinationAlias} ({log.destinationPlatform === "apple" ? "Apple Music" : "YouTube Music"})
                    </span>
                  </div>
                </div>

                {/* Counts / Stats Bar */}
                <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-[11px] text-text-secondary font-mono">
                  <div className="flex items-center gap-4">
                    <span>
                      Berhasil: <strong className="text-status-success">{log.successCount}</strong> / {log.totalTracks}
                    </span>
                    {log.duplicatesRemoved > 0 && (
                      <span className="text-accent">
                        Duplikat Dieliminasi: {log.duplicatesRemoved}
                      </span>
                    )}
                    {log.failedCount > 0 && (
                      <span className="text-status-danger">
                        Gagal: {log.failedCount}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-text-secondary/70">
                    ID: {log.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
