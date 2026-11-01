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
        className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-border/90 transition-colors shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                acc.platform === "youtube"
                  ? "bg-red-500/15 text-red-400 border border-red-500/20"
                  : "bg-accent/15 text-accent border border-accent/20"
              }`}
            >
              {acc.platform === "youtube" ? "YTM" : "APM"}
            </div>
            <div className="min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editAliasValue}
                    onChange={(e) => setEditAliasValue(e.target.value)}
                    className="px-2 py-0.5 rounded bg-surface-elevated border border-accent text-xs text-text-primary focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename(acc.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button
                    onClick={() => handleSaveRename(acc.id)}
                    className="p-1 rounded bg-accent/20 text-accent hover:bg-accent/30 btn-press"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded bg-surface-hover text-text-secondary hover:text-text-primary btn-press"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group">
                  <h4 className="text-xs md:text-sm font-semibold text-text-primary truncate">
                    {acc.localAlias}
                  </h4>
                  <button
                    onClick={() => startEditing(acc)}
                    className="opacity-60 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-opacity"
                    title="Ubah nama alias akun"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="text-[11px] text-text-secondary mt-0.5">
                {acc.playlistCount !== undefined ? `${acc.playlistCount} playlist` : "Memuat..."}
                {acc.storefront ? ` · Storefront: ${acc.storefront.toUpperCase()}` : ""}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 flex-shrink-0 ${
              acc.status === "connected"
                ? "bg-status-success/15 text-status-success border border-status-success/20"
                : "bg-status-danger/15 text-status-danger border border-status-danger/20"
            }`}
          >
            {acc.status === "connected" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span>{acc.status}</span>
          </span>
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <button
            onClick={() => onViewPlaylists(acc.id)}
            className="text-text-secondary hover:text-accent font-medium flex items-center gap-1 text-[11px] btn-press"
          >
            <span>Buka Library</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTest(acc.id)}
              disabled={isTesting}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-hover border border-border text-[11px] text-text-primary font-medium flex items-center gap-1 btn-press disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin text-accent" : "text-text-secondary"}`} />
              <span>{isTesting ? "Menguji..." : "Test"}</span>
            </button>

            {isConfirmingDelete ? (
              <div className="flex items-center gap-1 bg-status-danger/10 p-0.5 rounded-md border border-status-danger/30">
                <span className="text-[10px] text-status-danger px-1">Yakin?</span>
                <button
                  onClick={async () => {
                    await onDeleteAccount(acc.id);
                    setDeletingId(null);
                  }}
                  className="px-1.5 py-0.5 rounded bg-status-danger text-white text-[10px] font-medium btn-press"
                >
                  Ya
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-1.5 py-0.5 rounded bg-surface text-text-secondary text-[10px] btn-press"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeletingId(acc.id)}
                className="p-1 rounded-md text-text-secondary hover:text-status-danger hover:bg-status-danger/10 transition-colors btn-press"
                title="Hapus koneksi akun"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full pb-24 md:pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-text-primary">
            Koneksi Akun Musik
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Kelola multi-akun YouTube Music dan Apple Music. Kredensial tersimpan secara aman dan terisolasi pada server lokal Anda.
          </p>
        </div>
        <button
          onClick={onOpenAddAccount}
          className="px-4 py-2 rounded-lg bg-accent text-background font-medium text-xs md:text-sm flex items-center gap-2 hover:bg-accent/90 btn-press shadow-sm flex-shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* YouTube Music Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="text-sm font-semibold text-text-primary">YouTube Music</h3>
            <span className="text-xs text-text-secondary font-mono">({ytAccounts.length})</span>
          </div>
        </div>

        {ytAccounts.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-2">
            <p className="text-xs text-text-secondary">Belum ada akun YouTube Music terhubung.</p>
            <button
              onClick={onOpenAddAccount}
              className="text-xs text-accent hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Hubungkan YouTube Music
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ytAccounts.map(renderAccountCard)}
          </div>
        )}
      </div>

      {/* Apple Music Accounts Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Apple Music</h3>
            <span className="text-xs text-text-secondary font-mono">({appleAccounts.length})</span>
          </div>
        </div>

        {appleAccounts.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-2">
            <p className="text-xs text-text-secondary">Belum ada akun Apple Music terhubung.</p>
            <button
              onClick={onOpenAddAccount}
              className="text-xs text-accent hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Hubungkan Apple Music
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appleAccounts.map(renderAccountCard)}
          </div>
        )}
      </div>
    </div>
  );
};
