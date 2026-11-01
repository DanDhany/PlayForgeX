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
} from "lucide-react";
import { AccountConnection } from "../../../shared/types";
import { useLanguage } from "../../context/LanguageContext";

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

  const ytAccounts = accounts.filter((a) => a.platform === "youtube");
  const appleAccounts = accounts.filter((a) => a.platform === "apple");

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

  const renderAccountCard = (acc: AccountConnection) => {
    const isEditing = editingId === acc.id;
    const isTesting = testingId === acc.id;
    const isConfirmingDelete = deletingId === acc.id;

    return (
      <div
        key={acc.id}
        className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-border/90 transition-colors shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                acc.platform === "youtube"
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "bg-accent/15 text-accent border border-accent/20"
              }`}
            >
              {acc.platform === "youtube" ? "YTM" : "APM"}
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
                <span>{acc.playlistCount !== undefined ? t("library.tracksCount", { count: acc.playlistCount }) : "Loading..."}</span>
                {acc.syncType === "snapshot" && (
                  <span className="px-1.5 py-0.5 text-[9px] rounded bg-accent/15 text-accent border border-accent/25 font-mono">
                    {t("accounts.mobileSync")}
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full pb-32 md:pb-8">
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

      {/* Section 1: YouTube Music Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">
              YouTube Music ({ytAccounts.length})
            </h3>
          </div>
        </div>

        {ytAccounts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface/50 text-xs text-text-secondary space-y-2">
            <p>{t("accounts.emptyYt")}</p>
            <button
              onClick={onOpenAddAccount}
              className="text-accent hover:underline font-medium"
            >
              + {t("accounts.addNew")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ytAccounts.map((acc) => renderAccountCard(acc))}
          </div>
        )}
      </div>

      {/* Section 2: Apple Music Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">
              Apple Music ({appleAccounts.length})
            </h3>
          </div>
        </div>

        {appleAccounts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface/50 text-xs text-text-secondary space-y-2">
            <p>{t("accounts.emptyApple")}</p>
            <button
              onClick={onOpenAddAccount}
              className="text-accent hover:underline font-medium"
            >
              + {t("accounts.addNew")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appleAccounts.map((acc) => renderAccountCard(acc))}
          </div>
        )}
      </div>
    </div>
  );
};
