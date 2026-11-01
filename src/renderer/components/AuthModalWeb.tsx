import React, { useState } from "react";
import { X, KeyRound, ExternalLink, AlertCircle, Bookmark, Terminal, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface AuthModalWebProps {
  service: "youtube" | "apple" | null;
  onClose: () => void;
  onSubmitYouTube: (cookieString: string) => Promise<void>;
  onSubmitApple: (userToken: string, devToken?: string) => Promise<void>;
}

export const AuthModalWeb: React.FC<AuthModalWebProps> = ({
  service,
  onClose,
  onSubmitYouTube,
  onSubmitApple,
}) => {
  if (!service) return null;

  const [cookieString, setCookieString] = useState("");
  const [appleUserToken, setAppleUserToken] = useState("");
  const [appleDevToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  // 1-Click Bookmarklet Codes
  const ytBookmarkletCode = `javascript:(function(){const c=document.cookie;if(c.includes('SAPISID')||c.includes('__Secure-3PAPISID')){fetch('http://localhost:3080/api/auth/youtube',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cookieString:c})}).then(()=>{alert('🎉 YouTube Music berhasil tersinkron ke MirrorSong!');window.focus();}).catch(e=>alert('Koneksi gagal: '+e));}else{alert('Silakan login ke YouTube Music terlebih dahulu!');}})();`;

  const appleBookmarkletCode = `javascript:(function(){const m=localStorage.getItem('media-user-token')||(document.cookie.match(/media-user-token=([^;]+)/)||[])[1]||(window.MusicKit&&window.MusicKit.getInstance&&window.MusicKit.getInstance().musicUserToken);if(m){fetch('http://localhost:3080/api/auth/apple',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({musicUserToken:m})}).then(()=>{alert('🎉 Apple Music berhasil tersinkron ke MirrorSong!');window.focus();}).catch(e=>alert('Koneksi gagal: '+e));}else{alert('Silakan login ke Apple Music terlebih dahulu!');}})();`;

  const activeBookmarklet = service === "youtube" ? ytBookmarkletCode : appleBookmarkletCode;
  const targetSiteUrl = service === "youtube" ? "https://music.youtube.com" : "https://music.apple.com";
  const cliCommand = service === "youtube" ? "npm run auth:yt" : "npm run auth:apple";

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(activeBookmarklet);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (service === "youtube") {
        if (!cookieString.trim()) throw new Error("Cookie string tidak boleh kosong");
        await onSubmitYouTube(cookieString.trim());
      } else {
        if (!appleUserToken.trim()) throw new Error("Music-User-Token tidak boleh kosong");
        await onSubmitApple(appleUserToken.trim(), appleDevToken.trim() || undefined);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan kredensial");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-surface border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-5 md:p-6 space-y-5 glass-panel-elevated max-h-[90dvh] overflow-y-auto">
        {/* Mobile Handle */}
        <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                service === "youtube" ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white">
                Auto-Catch Sesi {service === "youtube" ? "YouTube Music" : "Apple Music"}
              </h3>
              <p className="text-[11px] text-slate-400">
                Otomatis tanpa perlu mencari header cookie di Network DevTools.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl btn-press">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* METHOD 1: 1-Click Bookmarklet (Paling Cepat di Browser) */}
        <div className="p-4 rounded-2xl bg-card/90 border border-white/[0.08] space-y-3 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>Metode 1: Tombol 1-Klik Bookmarklet (Browser)</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Tarik tombol di bawah ke <b>Bookmarks Bar</b> browser Anda, buka{" "}
            <a
              href={targetSiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline font-medium inline-flex items-center gap-0.5"
            >
              {service === "youtube" ? "music.youtube.com" : "music.apple.com"}{" "}
              <ExternalLink className="w-3 h-3" />
            </a>
            , lalu klik bookmarklet tersebut. Cookie langsung tersinkron otomatis!
          </p>

          <div className="flex items-center space-x-2 pt-1">
            <a
              href={activeBookmarklet}
              onClick={(e) => {
                e.preventDefault();
                alert("Tarik (drag) tombol ini ke Bookmarks Bar browser Anda!");
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 cursor-grab active:cursor-grabbing flex items-center gap-1.5 btn-press"
              title="Tarik tombol ini ke Bookmarks Bar"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              Tarik ke Bookmarks: Sync {service === "youtube" ? "YTM" : "Apple"}
            </a>

            <button
              onClick={handleCopyBookmarklet}
              className="p-2 bg-surface hover:bg-card-hover border border-white/[0.08] rounded-xl text-slate-300 hover:text-white text-xs flex items-center gap-1 btn-press transition"
              title="Salin kode javascript bookmarklet"
            >
              {copiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBookmarklet ? "Tersalin!" : "Salin"}</span>
            </button>
          </div>
        </div>

        {/* METHOD 2: Auto-Catch Popup Browser (Puppeteer Script) */}
        <div className="p-4 rounded-2xl bg-card/90 border border-white/[0.08] space-y-2.5 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Metode 2: Auto-Catch via Terminal (Buka Chrome Otomatis)</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Jalankan perintah ini di terminal komputer Anda. Chrome akan terbuka, Anda cukup login, dan script akan otomatis menangkap cookies:
          </p>

          <div className="bg-surface/90 border border-white/[0.08] rounded-xl p-2.5 flex items-center justify-between font-mono text-xs text-emerald-300">
            <code>{cliCommand}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(cliCommand);
                alert(`Perintah '${cliCommand}' disalin ke clipboard!`);
              }}
              className="p-1 hover:text-white transition"
              title="Salin perintah"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* METHOD 3: Collapsible Manual Input Fallback */}
        <div className="border-t border-white/[0.08] pt-2">
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition"
          >
            <span>Opsi Manual (Input Teks)</span>
            {showManual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showManual && (
            <form onSubmit={handleSubmitManual} className="space-y-3 pt-3">
              {service === "youtube" ? (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Paste Cookie Header
                  </label>
                  <textarea
                    value={cookieString}
                    onChange={(e) => setCookieString(e.target.value)}
                    placeholder="SAPISID=...; __Secure-3PAPISID=..."
                    rows={3}
                    className="w-full bg-card border border-white/[0.1] rounded-xl p-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Paste media-user-token
                    </label>
                    <textarea
                      value={appleUserToken}
                      onChange={(e) => setAppleUserToken(e.target.value)}
                      placeholder="Paste media-user-token..."
                      rows={2}
                      className="w-full bg-card border border-white/[0.1] rounded-xl p-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold btn-press transition"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Manual"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
