import React, { useState } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  Check,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Layers,
  Search,
} from "lucide-react";
import { AccountConnection } from "../../../shared/types";
import { useLanguage } from "../../context/LanguageContext";
import { getPlatformMeta } from "../../utils/platform-meta";

interface AccountsViewProps {
  accounts: AccountConnection[];
  onOpenAddAccount: () => void;
  onTestAccount: (id: string) => Promise<void>;
  onRenameAccount: (id: string, newAlias: string) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onViewPlaylists: (accountId: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onOpenAddAccount,
  onTestAccount,
  onRenameAccount,
  onDeleteAccount,
  onViewPlaylists,
}) => {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAliasValue, setEditAliasValue] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const startEditing = (acc: AccountConnection) => {
    setEditingId(acc.id);
    setEditAliasValue(acc.localAlias);
  };

  const handleSaveRename = async (id: string) => {
    if (!editAliasValue.trim()) return;
    await onRenameAccount(id, editAliasValue.trim());
    setEditingId(null);
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTestAccount(id);
    } finally {
      setTestingId(null);
    }
  };

  // Unique platforms that currently have connected accounts
  const presentPlatforms = Array.from(new Set(accounts.map((a) => a.platform)));

  // Filter accounts by search query and active platform tab
  const filteredAccounts = accounts.filter((acc) => {
    const matchesFilter = filterPlatform === "all" || acc.platform === filterPlatform;
    const matchesSearch =
      !searchQuery.trim() ||
      acc.localAlias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group filtered accounts by platform
  const groupedByPlatform = filteredAccounts.reduce<Record<string, AccountConnection[]>>((res, acc) => {
    const key = acc.platform || "other";
    if (!res[key]) res[key] = [];
    res[key].push(acc);
    return res;
  }, {});

  const renderAccountCard = (acc: AccountConnection) => {
    const isEditing = editingId === acc.id;
    const isTesting = testingId === acc.id;
    const isConfirmingDelete = deletingId === acc.id;
    const meta = getPlatformMeta(acc.platform);

    return (
      <div
        key={acc.id}
        className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-border/90 transition-colors shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 border ${meta.badgeBg} ${meta.badgeBorder} ${meta.textColor}`}
            >
              {meta.shortCode}
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="text"
                    value={editAliasValue}
                    onChange={(e) => setEditAliasValue(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-accent text-xs sm:text-sm text-text-primary focus:outline-none min-w-[160px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename(acc.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSaveRename(acc.id)}
                      className="p-1.5 rounded-lg bg-accent text-background hover:bg-accent-hover btn-press"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary btn-press"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group">
                  <h4 className="text-sm sm:text-base font-semibold text-text-primary break-words leading-snug">
                    {acc.localAlias}
                  </h4>
                  <button
                    onClick={() => startEditing(acc)}
                    className="opacity-70 group-hover:opacity-100 p-1 rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-opacity flex-shrink-0"
                    title={t("accounts.rename")}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="text-[11px] text-text-secondary mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-text-primary/90">
                  {meta.name}
                </span>
                <span>•</span>
                <span>
                  {acc.playlistCount !== undefined
                    ? t("library.tracksCount", { count: acc.playlistCount })
                    : "0 playlists"}
                </span>
                {acc.syncType === "snapshot" && (
                  <span className="px-1.5 py-0.5 text-[9px] rounded bg-accent/15 text-accent border border-accent/25 font-mono">
                    {t("accounts.mobileSync") || "Snapshot / Ingestion"}
                  </span>
                )}
                {acc.storefront ? <span>· Storefront: {acc.storefront.toUpperCase()}</span> : ""}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`self-start px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 flex-shrink-0 border ${
              acc.status === "connected"
                ? "bg-status-success/15 text-status-success border-status-success/25"
                : "bg-status-danger/15 text-status-danger border-status-danger/25"
            }`}
          >
            {acc.status === "connected" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span>{acc.status === "connected" ? t("accounts.connected") : t("accounts.disconnected")}</span>
          </span>
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs gap-2">
          <button
            onClick={() => onViewPlaylists(acc.id)}
            className="text-text-secondary hover:text-accent font-medium flex items-center gap-1.5 text-xs py-1 px-2 rounded-lg hover:bg-surface-hover transition-colors btn-press"
          >
            <span>{t("accounts.openLibrary")}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTest(acc.id)}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs text-text-primary font-medium flex items-center gap-1.5 btn-press transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-accent" : "text-text-secondary"}`} />
              <span>{isTesting ? t("accounts.testing") : t("accounts.test")}</span>
            </button>

            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 animate-fade-in">
                <button
                  onClick={() => onDeleteAccount(acc.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-status-danger text-white text-xs font-semibold btn-press shadow-sm"
                >
                  {t("accounts.delete")}
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-2 py-1.5 rounded-lg bg-surface-hover text-text-secondary text-xs btn-press"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeletingId(acc.id)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-status-danger hover:bg-status-danger/10 transition-colors btn-press"
                title={t("accounts.delete")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full pb-32 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
            {t("accounts.title")}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {t("accounts.desc")}
          </p>
        </div>

        <button
          onClick={onOpenAddAccount}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-accent-hover btn-press shadow-sm self-start sm:self-auto flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t("accounts.addNew")}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      {accounts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Platform Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none no-scrollbar">
            <button
              onClick={() => setFilterPlatform("all")}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors btn-press flex items-center gap-1.5 ${
                filterPlatform === "all"
                  ? "bg-accent/20 text-accent border border-accent/30 font-semibold"
                  : "bg-surface border border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua ({accounts.length})</span>
            </button>

            {presentPlatforms.map((p) => {
              const meta = getPlatformMeta(p);
              const count = accounts.filter((a) => a.platform === p).length;
              return (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors btn-press flex items-center gap-1.5 ${
                    filterPlatform === p
                      ? "bg-accent/20 text-accent border border-accent/30 font-semibold"
                      : "bg-surface border border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  <span>
                    {meta.name} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box if multiple accounts exist */}
          {accounts.length > 3 && (
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama akun..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50 text-xs text-text-secondary space-y-3">
          <p className="text-sm font-medium text-text-primary">Belum ada akun musik yang terhubung</p>
          <p className="max-w-md mx-auto text-text-secondary">
            Hubungkan akun YouTube Music, YouTube Video Playlists, Apple Music, Spotify, SoundCloud, Deezer, atau File lokal untuk memulai migrasi.
          </p>
          <button
            onClick={onOpenAddAccount}
            className="px-4 py-2 rounded-xl bg-accent text-background font-semibold hover:brightness-110 btn-press inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t("accounts.addNew")}</span>
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface/50 text-xs text-text-secondary space-y-2">
          <p>Tidak ada akun yang sesuai dengan filter atau kata kunci pencarian.</p>
          <button
            onClick={() => {
              setFilterPlatform("all");
              setSearchQuery("");
            }}
            className="text-accent hover:underline font-medium"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        /* Dynamic Grouping by Platform */
        <div className="space-y-8">
          {Object.entries(groupedByPlatform).map(([plat, groupAccounts]) => {
            const meta = getPlatformMeta(plat);
            return (
              <div key={plat} className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                    <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                      {meta.name} ({groupAccounts.length})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupAccounts.map((acc) => renderAccountCard(acc))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
