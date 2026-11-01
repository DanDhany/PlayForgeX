import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  User as UserIcon,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown,
  Lock,
} from "lucide-react";
import { ManagedUser, User } from "../../../shared/types";
import { useLanguage } from "../../context/LanguageContext";

interface UsersViewProps {
  currentUser: User;
  onRefreshStats?: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<ManagedUser | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const token = localStorage.getItem("playforgex_token");
      const res = await fetch("/api/admin/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed loading users");
      }
      setUsers(data.users || []);
    } catch (err: any) {
      setErrorBanner(err.message || (isEn ? "Failed to load user list" : "Gagal memuat daftar pengguna"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (targetUser: ManagedUser) => {
    if (targetUser.username === "admin") {
      setErrorBanner(t("users.cantDeleteRoot"));
      return;
    }

    const nextRole = targetUser.role === "admin" ? "user" : "admin";
    setActionInProgressId(targetUser.id);
    setErrorBanner(null);

    try {
      const token = localStorage.getItem("playforgex_token");
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed updating user role");
      }
      setSuccessBanner(
        isEn
          ? `Role updated to ${nextRole} for ${targetUser.username}`
          : `Hak akses berhasil diubah menjadi ${nextRole} untuk ${targetUser.username}`
      );
      setTimeout(() => setSuccessBanner(null), 3000);
      await loadUsers();
    } catch (err: any) {
      setErrorBanner(err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteUser = async (targetUser: ManagedUser) => {
    if (targetUser.id === currentUser.id) {
      setErrorBanner(t("users.cantDeleteSelf"));
      return;
    }
    if (targetUser.username === "admin") {
      setErrorBanner(t("users.cantDeleteRoot"));
      return;
    }

    setActionInProgressId(targetUser.id);
    setErrorBanner(null);

    try {
      const token = localStorage.getItem("playforgex_token");
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed deleting user");
      }
      setSuccessBanner(
        isEn
          ? `User ${targetUser.username} and their data were permanently deleted`
          : `Pengguna ${targetUser.username} dan seluruh datanya berhasil dihapus`
      );
      setTimeout(() => setSuccessBanner(null), 3000);
      setDeleteConfirmUser(null);
      await loadUsers();
    } catch (err: any) {
      setErrorBanner(err.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const regularCount = users.filter((u) => u.role === "user").length;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full pb-32 md:pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs font-semibold text-accent mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isEn ? "Administrator Console" : "Konsol Administrator"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {t("users.title")}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {t("users.subtitle")}
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-white/[0.08] text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 btn-press"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-accent" : ""}`} />
          <span>{isEn ? "Refresh Users" : "Muat Ulang"}</span>
        </button>
      </div>

      {/* Status Alerts */}
      {errorBanner && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorBanner}</div>
        </div>
      )}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-status-success/10 border border-status-success/25 flex items-start gap-3 text-xs text-status-success animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successBanner}</div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary font-medium">{t("users.total")}</span>
            <p className="text-2xl sm:text-3xl font-bold text-text-primary font-mono mt-1">
              {users.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/[0.06] flex items-center justify-center text-accent">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary font-medium">{t("users.adminCount")}</span>
            <p className="text-2xl sm:text-3xl font-bold text-accent font-mono mt-1">
              {adminCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary font-medium">{t("users.regularCount")}</span>
            <p className="text-2xl sm:text-3xl font-bold text-text-primary font-mono mt-1">
              {regularCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/[0.06] flex items-center justify-center text-text-secondary">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isEn ? "Search users by username or role..." : "Cari pengguna berdasarkan nama atau hak akses..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/[0.08] text-base sm:text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
        />
      </div>

      {/* Users List Table */}
      <div className="rounded-2xl bg-surface border border-white/[0.08] overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-secondary">
            {isLoading ? (isEn ? "Loading users..." : "Memuat pengguna...") : (isEn ? "No users found" : "Tidak ada pengguna")}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredUsers.map((u) => {
              const isRootAdmin = u.username === "admin";
              const isCurrentSessionUser = u.id === currentUser.id;
              const initials = u.username ? u.username.slice(0, 2).toUpperCase() : "TB";
              const formattedDate = new Date(u.createdAt).toLocaleDateString(isEn ? "en-US" : "id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={u.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent/25 via-accent/10 to-transparent border border-accent/25 flex items-center justify-center text-xs font-bold font-mono text-accent flex-shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {u.username}
                        </span>
                        {isCurrentSessionUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-status-success/15 text-status-success border border-status-success/25 font-medium">
                            {isEn ? "You" : "Anda"}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            u.role === "admin"
                              ? "bg-accent/15 text-accent border-accent/30"
                              : "bg-white/[0.06] text-text-secondary border-white/[0.08]"
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : "Member"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-text-muted">
                          ID: {u.id.slice(0, 14)}...
                        </span>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-accent" />
                          <span>{u.accountCount} {isEn ? "accounts" : "akun"}</span>
                        </span>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    {!isRootAdmin && (
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={actionInProgressId === u.id}
                        className="px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-white/[0.08] text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 btn-press"
                        title={t("users.changeRole")}
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
                        <span className="hidden sm:inline">{t("users.changeRole")}</span>
                      </button>
                    )}

                    {!isRootAdmin && !isCurrentSessionUser && (
                      <button
                        onClick={() => setDeleteConfirmUser(u)}
                        disabled={actionInProgressId === u.id}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/25 transition-all btn-press"
                        title={t("users.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {isRootAdmin && (
                      <div className="flex items-center gap-1 text-[11px] text-text-muted px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <Lock className="w-3 h-3 text-accent" />
                        <span>Root Admin</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-2xl bg-surface border border-white/[0.1] shadow-2xl p-6 text-center animate-dialog-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              {isEn ? "Confirm User Deletion" : "Konfirmasi Hapus Pengguna"}
            </h3>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              {t("users.deleteConfirm", { username: deleteConfirmUser.username })}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl bg-surface-elevated border border-white/[0.08] text-xs font-semibold text-text-secondary hover:text-text-primary btn-press"
              >
                {isEn ? "Cancel" : "Batal"}
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                disabled={actionInProgressId === deleteConfirmUser.id}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors btn-press shadow-md shadow-rose-500/25"
              >
                {isEn ? "Delete Permanently" : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
