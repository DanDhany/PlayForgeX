import React from "react";
import {
  ArrowRightLeft,
  Users,
  ListMusic,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Disc3,
  History,
  Layers,
} from "lucide-react";
import { AccountConnection, ActivityLogItem } from "../../../shared/types";
import { NavTab } from "../NavigationRail";
import { useLanguage } from "../../context/LanguageContext";
import { getPlatformMeta } from "../../utils/platform-meta";

interface OverviewViewProps {
  accounts: AccountConnection[];
  activityLogs: ActivityLogItem[];
  onNavigate: (tab: NavTab) => void;
  onOpenAddAccount: () => void;
  onTestAccount: (id: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  accounts,
  activityLogs,
  onNavigate,
  onOpenAddAccount,
  onTestAccount,
}) => {
  const { t } = useLanguage();
  const totalPlaylists = accounts.reduce((acc, curr) => acc + (curr.playlistCount || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full pb-32 md:pb-8">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-surface border border-border p-5 md:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Account Music Migration Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-text-primary leading-snug">
            {t("overview.bannerTitle")}
          </h2>
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
            {t("overview.bannerDesc")}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
            <button
              onClick={() => onNavigate("transfer")}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-accent/90 btn-press shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{t("overview.startTransfer")}</span>
            </button>
            <button
              onClick={onOpenAddAccount}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary font-medium text-xs md:text-sm flex items-center justify-center gap-2 btn-press"
            >
              <Plus className="w-4 h-4 text-text-secondary" />
              <span>{t("overview.addAccount")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-text-secondary font-medium">
              {t("overview.statConnected")}
            </span>
            <div className="text-xl font-semibold text-text-primary">
              {accounts.length}{" "}
              <span className="text-xs font-normal text-text-secondary">
                ({accounts.length} {t("nav.accounts")})
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-text-secondary font-medium">
              {t("overview.statPlaylists")}
            </span>
            <div className="text-xl font-semibold text-text-primary">
              {totalPlaylists}{" "}
              <span className="text-xs font-normal text-text-secondary">
                {t("overview.statPlaylistsDesc")}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-status-success">
            <ListMusic className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-text-secondary font-medium">
              {t("overview.statActivity")}
            </span>
            <div className="text-xl font-semibold text-text-primary">
              {activityLogs.length}{" "}
              <span className="text-xs font-normal text-text-secondary">
                {t("overview.statActivityDesc")}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-secondary">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Connected Accounts vs Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Accounts Snapshot */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span>{t("overview.connectedAccounts")}</span>
            </h3>
            <button
              onClick={() => onNavigate("accounts")}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t("overview.manageAll")}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed border-border rounded-lg">
              <Disc3 className="w-8 h-8 text-text-secondary/50 mx-auto" />
              <p className="text-xs text-text-secondary">{t("overview.noAccounts")}</p>
              <button
                onClick={onOpenAddAccount}
                className="text-xs text-accent hover:underline font-medium"
              >
                {t("overview.addAccount")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-lg bg-surface-elevated border border-border flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {(() => {
                      const meta = getPlatformMeta(acc.platform);
                      return (
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[10px] flex-shrink-0 border ${meta.badgeBg} ${meta.badgeBorder} ${meta.textColor}`}
                        >
                          {meta.shortCode}
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <div className="font-medium text-text-primary truncate">{acc.localAlias}</div>
                      <div className="text-[11px] text-text-secondary">
                        {acc.playlistCount || 0} playlists
                        {acc.storefront ? ` · Storefront: ${acc.storefront.toUpperCase()}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                        acc.status === "connected"
                          ? "bg-status-success/15 text-status-success"
                          : "bg-status-danger/15 text-status-danger"
                      }`}
                    >
                      {acc.status === "connected" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      <span>{acc.status}</span>
                    </span>
                    <button
                      onClick={() => onTestAccount(acc.id)}
                      className="px-2 py-1 rounded bg-surface-hover hover:bg-border text-text-secondary hover:text-text-primary text-[11px] btn-press"
                    >
                      Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Snapshot */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <History className="w-4 h-4 text-text-secondary" />
              <span>{t("overview.recentActivity")}</span>
            </h3>
            <button
              onClick={() => onNavigate("activity")}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t("overview.viewFullLog")}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed border-border rounded-lg">
              <History className="w-8 h-8 text-text-secondary/50 mx-auto" />
              <p className="text-xs text-text-secondary">{t("overview.noActivity")}</p>
              <p className="text-[11px] text-text-secondary/70">
                {t("overview.noActivityDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-surface-elevated border border-border flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-text-primary truncate">{log.workflowName}</div>
                    <div className="text-[11px] text-text-secondary truncate mt-0.5">
                      {log.sourceAliases.join(", ")} ➔ {log.destinationAlias}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] font-mono font-medium text-status-success">
                      {log.successCount}/{log.totalTracks}
                    </span>
                    <div className="text-[10px] text-text-secondary">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
