import React, { useState } from "react";
import {
  X,
  KeyRound,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Smartphone,
  ExternalLink,
  Info,
} from "lucide-react";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ConnectMethod = "bookmarklet" | "cli" | "manual";

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [platform, setPlatform] = useState<"youtube" | "apple">("youtube");
  const [alias, setAlias] = useState("");
  const [connectMethod, setConnectMethod] = useState<ConnectMethod>("bookmarklet");
  const [cookieString, setCookieString] = useState("");
  const [musicUserToken, setMusicUserToken] = useState("");
  const [developerToken, setDeveloperToken] = useState("");
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3080";
  const safeAlias = alias.trim() || (platform === "youtube" ? "YouTube Music" : "Apple Music");

  // Anti-Mixed-Content Form Navigation Bookmarklet
  // Uses top-level form submission so remote clients (phones, laptops on LAN) avoid HTTPS->HTTP mixed-content blocks
  const ytBookmarklet = `javascript:(function(){try{const c=document.cookie;if(!c||(!c.includes('SAPISID')&&!c.includes('__Secure-3PAPISID'))){alert('Sesi YouTube Music belum terdeteksi! Pastikan Anda sudah login di music.youtube.com terlebih dahulu.');return;}const f=document.createElement('form');f.method='POST';f.action='${origin}/api/auth/web-catch';f.style.display='none';const a=(n,v)=>{const i=document.createElement('input');i.type='hidden';i.name=n;i.value=v;f.appendChild(i);};a('platform','youtube');a('cookieString',c);a('alias',${JSON.stringify(safeAlias)});a('returnUrl','${origin}/#tab=accounts&status=success');document.body.appendChild(f);f.submit();}catch(e){alert('Gagal mengirim sesi: '+e.message);}})();`;

  const appleBookmarklet = `javascript:(function(){try{const m=localStorage.getItem('media-user-token')||(document.cookie.match(/media-user-token=([^;]+)/)||[])[1]||(window.MusicKit&&window.MusicKit.getInstance&&window.MusicKit.getInstance().musicUserToken);if(!m){alert('Sesi Apple Music belum terdeteksi! Pastikan Anda sudah login di music.apple.com terlebih dahulu.');return;}const f=document.createElement('form');f.method='POST';f.action='${origin}/api/auth/web-catch';f.style.display='none';const a=(n,v)=>{const i=document.createElement('input');i.type='hidden';i.name=n;i.value=v;f.appendChild(i);};a('platform','apple');a('musicUserToken',m);a('alias',${JSON.stringify(safeAlias)});a('returnUrl','${origin}/#tab=accounts&status=success');document.body.appendChild(f);f.submit();}catch(e){alert('Gagal mengirim sesi: '+e.message);}})();`;

  const activeBookmarklet = platform === "youtube" ? ytBookmarklet : appleBookmarklet;
  const targetSiteUrl = platform === "youtube" ? "https://music.youtube.com" : "https://music.apple.com";

  // CLI Command for Host Machine with isolated profile support
  const cliCommand =
    platform === "youtube"
      ? `npm run auth:yt -- --alias "${safeAlias}"`
      : `npm run auth:apple -- --alias "${safeAlias}"`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(activeBookmarklet);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        platform,
        alias: alias.trim() || undefined,
      };

      if (platform === "youtube") {
        if (!cookieString.trim()) {
          throw new Error("Cookie string YouTube tidak boleh kosong");
        }
        payload.cookieString = cookieString.trim();
      } else {
        if (!musicUserToken.trim()) {
          throw new Error("Music-User-Token Apple Music tidak boleh kosong");
        }
        payload.musicUserToken = musicUserToken.trim();
        if (developerToken.trim()) {
          payload.developerToken = developerToken.trim();
        }
      }

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghubungkan akun");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menambahkan akun");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-4 md:p-6 space-y-4 max-h-[90dvh] overflow-y-auto animate-sheet-up md:animate-dialog-in pb-safe">
        {/* iOS Drag Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-text-primary">
                Tambah Koneksi Akun
              </h3>
              <p className="text-[11px] text-text-secondary">
                Hubungkan akun ke-2, ke-3, atau akun keluarga tanpa bentrok sesi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg btn-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-status-danger/10 border border-status-danger/20 rounded-lg text-status-danger text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Platform Selector Segmented Control */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-secondary">Layanan Musik</label>
          <div className="grid grid-cols-2 p-1 bg-surface-elevated rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setPlatform("youtube")}
              className={`py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 btn-press ${
                platform === "youtube"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>YouTube Music</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform("apple")}
              className={`py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 btn-press ${
                platform === "apple"
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Apple Music</span>
            </button>
          </div>
        </div>

        {/* Account Alias Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-secondary">
            Nama / Label Akun
          </label>
          <input
            type="text"
            placeholder={
              platform === "youtube"
                ? "Contoh: Koleksi Orang B, Akun Pasangan, Koleksi Kantor"
                : "Contoh: Mobil (Apple Music), Head Unit, iPad"
            }
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary/40"
          />
        </div>

        {/* Connection Method Segmented Tabs */}
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-medium text-text-secondary">
            Pilih Cara Menghubungkan
          </label>
          <div className="grid grid-cols-3 p-1 bg-surface-elevated rounded-lg border border-border text-[11px]">
            <button
              type="button"
              onClick={() => setConnectMethod("bookmarklet")}
              className={`py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 btn-press ${
                connectMethod === "bookmarklet"
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>HP / Browser</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectMethod("cli")}
              className={`py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 btn-press ${
                connectMethod === "cli"
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal CLI</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectMethod("manual")}
              className={`py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 btn-press ${
                connectMethod === "manual"
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>
          </div>
        </div>

        {/* Method 1: Bookmarklet (Ideal for Remote Clients, Mobile Phones, Tablets on LAN) */}
        {connectMethod === "bookmarklet" && (
          <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-accent" />
              <h4 className="text-xs font-semibold text-text-primary">
                1-Click Bookmarklet (Bisa dari HP & Client Lain)
              </h4>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Mendukung koneksi langsung dari browser HP atau komputer lain di jaringan LAN. Buka tab baru di{" "}
              <span className="text-text-primary font-mono">{platform === "youtube" ? "music.youtube.com" : "music.apple.com"}</span>, pastikan sudah login, lalu jalankan bookmarklet ini. Browser otomatis mengirim sesi ke TuneBridge tanpa hambatan Mixed-Content HTTPS.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyBookmarklet}
                className="flex-1 py-1.5 px-3 rounded-lg bg-surface-hover hover:bg-border border border-border text-xs text-text-primary font-medium flex items-center justify-center gap-1.5 btn-press"
              >
                {copiedBookmarklet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-status-success" />
                    <span>Script Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Salin Kode Bookmarklet</span>
                  </>
                )}
              </button>
              <a
                href={targetSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent text-xs font-medium border border-accent/20 flex items-center gap-1.5 btn-press"
              >
                <span>Buka Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Method 2: Terminal CLI (Host Computer) */}
        {connectMethod === "cli" && (
          <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" />
              <h4 className="text-xs font-semibold text-text-primary">
                Perintah Terminal Host (Multi-Akun Otomatis)
              </h4>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Jalankan perintah ini di terminal komputer host yang menjalankan TuneBridge. Chrome akan otomatis membuka profil terisolasi baru sehingga akun ke-2 atau ke-3 Anda tidak akan menimpa akun utama.
            </p>
            <div className="p-2.5 bg-background rounded-lg border border-border/80 font-mono text-[11px] text-text-primary break-all select-all">
              {cliCommand}
            </div>
            <button
              type="button"
              onClick={handleCopyCli}
              className="w-full py-1.5 px-3 rounded-lg bg-surface-hover hover:bg-border border border-border text-xs text-text-primary font-medium flex items-center justify-center gap-1.5 btn-press"
            >
              {copiedCli ? (
                <>
                  <Check className="w-3.5 h-3.5 text-status-success" />
                  <span>Perintah Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Salin Perintah Terminal</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Method 3: Manual Token / Cookie Form */}
        {connectMethod === "manual" && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {platform === "youtube" ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary">
                  YouTube Cookie Header
                </label>
                <textarea
                  rows={3}
                  placeholder="Tempel header Cookie dari DevTools Network (harus mengandung SAPISID atau __Secure-3PAPISID)"
                  value={cookieString}
                  onChange={(e) => setCookieString(e.target.value)}
                  className="w-full p-2.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-secondary">
                    Apple Music-User-Token
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tempel media-user-token dari cookie atau localStorage music.apple.com"
                    value={musicUserToken}
                    onChange={(e) => setMusicUserToken(e.target.value)}
                    className="w-full p-2.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-secondary">
                    Developer Token (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Gunakan token internal jika dikosongkan"
                    value={developerToken}
                    onChange={(e) => setDeveloperToken(e.target.value)}
                    className="w-full p-2 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-lg bg-accent text-background font-medium text-xs hover:bg-accent/90 disabled:opacity-50 btn-press"
            >
              {isSubmitting ? "Menyimpan Koneksi..." : "Simpan Koneksi Akun"}
            </button>
          </form>
        )}

        {/* Privacy Note */}
        <div className="flex items-start gap-1.5 text-[10px] text-text-secondary/70 pt-1">
          <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-text-secondary" />
          <span>
            Sesi disimpan 100% lokal di folder data host instalasi Anda. Tidak ada data yang dikirim ke cloud pengembang.
          </span>
        </div>
      </div>
    </div>
  );
};
