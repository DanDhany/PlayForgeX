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
import { useLanguage } from "../../context/LanguageContext";

interface ActivityViewProps {
  activityLogs: ActivityLogItem[];
  onRefresh: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activityLogs,
  onRefresh,
}) => {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "partial">("all");

  const filtered = activityLogs.filter((log) => {
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.workflowName.toLowerCase().includes(q) ||
      log.destinationAlias.toLowerCase().includes(q) ||
      (log.username && log.username.toLowerCase().includes(q)) ||
      log.sourceAliases.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full pb-32 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
            {t("activity.title")}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {t("activity.desc")}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-text-primary font-medium flex items-center gap-1.5 btn-press self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-text-secondary" />
          <span>{t("activity.refresh")}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-text-secondary" />
          <input
            type="text"
            placeholder={t("activity.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-base sm:text-xs text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none touch-pan-x">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors btn-press ${
              statusFilter === "all"
                ? "bg-accent/20 text-accent border border-accent/30 font-semibold"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("activity.filterAll")} ({activityLogs.length})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors btn-press ${
              statusFilter === "completed"
                ? "bg-status-success/20 text-status-success border border-status-success/30 font-semibold"
                : "bg-surface border border-border text-text-secondary hover:text-status-success"
            }`}
          >
            {t("activity.filterCompleted")}
          </button>
          <button
            onClick={() => setStatusFilter("failed")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors btn-press ${
              statusFilter === "failed"
                ? "bg-status-danger/20 text-status-danger border border-status-danger/30 font-semibold"
                : "bg-surface border border-border text-text-secondary hover:text-status-danger"
            }`}
          >
            {t("activity.filterFailed")}
          </button>
        </div>
      </div>

      {/* Activity Log List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border space-y-3 bg-surface/50">
          <History className="w-8 h-8 text-text-secondary/50 mx-auto" />
          <div className="text-xs text-text-secondary">{t("activity.empty")}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const isSuccess = log.status === "completed";
            return (
              <div
                key={log.id}
                className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/90 transition-colors shadow-sm"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border ${
                        isSuccess
                          ? "bg-status-success/15 text-status-success border-status-success/25"
                          : "bg-status-danger/15 text-status-danger border-status-danger/25"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span>{log.status.toUpperCase()}</span>
                    </span>

                    <span className="text-[11px] font-mono text-text-secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>

                    {log.username && (
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-accent border border-white/[0.08] text-[10px] font-mono">
                        @{log.username}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
                    {log.workflowName}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-text-secondary flex-wrap">
                    <span className="font-medium text-text-primary">
                      {log.sourceAliases.join(", ")}
                    </span>
                    <ArrowRight className="w-3 h-3 text-accent flex-shrink-0" />
                    <span className="font-medium text-text-primary">
                      {log.destinationAlias}
                    </span>
                    <span className="text-text-muted">({log.destinationPlatform === "apple" ? "Apple Music" : "YouTube Music"})</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-status-success">
                      {log.successCount} / {log.totalTracks}
                    </span>
                    <span className="text-[11px] text-text-secondary ml-1">{isEn ? "tracks" : "lagu"}</span>
                  </div>
                  {log.failedCount > 0 && (
                    <span className="text-[10px] text-status-danger font-mono">
                      {log.failedCount} {isEn ? "unmatched" : "tak cocok"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
