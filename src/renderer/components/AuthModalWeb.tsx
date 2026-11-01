import React, { useState } from "react";
import { X, KeyRound, AlertCircle, ChevronDown, ChevronUp, Copy, Check, Smartphone, Monitor } from "lucide-react";
import { copyToClipboard } from "../utils/ui-helpers";

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
  const [showIosTutorial, setShowIosTutorial] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3080";

  // 1-Click Bookmarklet Codes (uses dynamic host origin)
  const ytBookmarkletCode = `javascript:(function(){const c=document.cookie;if(c.includes('SAPISID')||c.includes('__Secure-3PAPISID')){fetch('${origin}/api/auth/youtube',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cookieString:c})}).then(()=>{alert('🎉 YouTube Music berhasil tersinkron ke TuneBridge!');window.location.href='${origin}';}).catch(e=>alert('Koneksi gagal: '+e));}else{alert('Silakan login ke YouTube Music terlebih dahulu!');}})();`;

  const appleBookmarkletCode = `javascript:(function(){const m=localStorage.getItem('media-user-token')||(document.cookie.match(/media-user-token=([^;]+)/)||[])[1]||(window.MusicKit&&window.MusicKit.getInstance&&window.MusicKit.getInstance().musicUserToken);if(m){fetch('${origin}/api/auth/apple',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({musicUserToken:m})}).then(()=>{alert('🎉 Apple Music berhasil tersinkron ke TuneBridge!');window.location.href='${origin}';}).catch(e=>alert('Koneksi gagal: '+e));}else{alert('Silakan login ke Apple Music terlebih dahulu!');}})();`;

  const activeBookmarklet = service === "youtube" ? ytBookmarkletCode : appleBookmarkletCode;
  const targetSiteUrl = service === "youtube" ? "https://music.youtube.com" : "https://music.apple.com";
  const cliCommand = service === "youtube" ? "npm run auth:yt" : "npm run auth:apple";

  const handleCopyBookmarklet = async () => {
    const ok = await copyToClipboard(activeBookmarklet);
    if (ok) {
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2000);
    }
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

  const serviceName = service === "youtube" ? "YouTube Music" : "Apple Music";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-surface border-t md:border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-4 md:p-6 space-y-4 max-h-[90dvh] overflow-y-auto animate-sheet-up md:animate-dialog-in pb-safe">
        {/* iOS Drag Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                service === "youtube" ? "bg-red-500/15 text-red-400" : "bg-primary/15 text-primary"
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-white">
                Hubungkan {serviceName}
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih opsi koneksi yang Anda inginkan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg btn-press">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* METODE UTAMA: Terminal Mac */}
        <div className="p-3.5 rounded-xl bg-card border border-emerald-500/25 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
            <Monitor className="w-3.5 h-3.5" />
            <span>Opsi Tercepat: 1x Perintah di Mac Server</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Jalankan perintah ini di Terminal Mac host. Browser akan terbuka otomatis untuk login, dan sesi akan langsung aktif di seluruh perangkat (termasuk iPhone):
          </p>

          <div className="bg-surface border border-white/[0.08] rounded-lg p-2 flex items-center justify-between font-mono text-xs text-emerald-300">
            <code>{cliCommand}</code>
            <button
              onClick={async () => {
                const ok = await copyToClipboard(cliCommand);
                if (ok) {
                  alert(`Perintah '${cliCommand}' berhasil disalin.`);
                }
              }}
              className="p-1 text-slate-400 hover:text-white transition btn-press"
              title="Salin perintah"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* METODE 2: Bookmarklet Safari HP */}
        <div className="p-3.5 rounded-xl bg-card border border-white/[0.08] space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Opsi Mobile: Bookmarklet Safari iPhone</span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
            <p className="text-[11px] text-slate-400">
              Salin kode script berikut ke bookmark Safari Anda:
            </p>

            <button
              onClick={handleCopyBookmarklet}
              className="w-full py-2 px-3 bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 btn-press transition"
            >
              {copiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBookmarklet ? "Kode Script Berhasil Disalin!" : "Salin Kode Script"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIosTutorial(!showIosTutorial)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 pt-1"
            >
              <span>{showIosTutorial ? "Sembunyikan langkah" : "Lihat 5 langkah pemasangan di Safari"}</span>
              {showIosTutorial ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showIosTutorial && (
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-300 bg-surface p-2.5 rounded-lg border border-white/[0.06] mt-1.5">
                <li>Buka Safari, tambahkan penanda/bookmark pada halaman ini.</li>
                <li>Edit penanda tersebut, ubah nama menjadi <b>Sync {service === "youtube" ? "YTM" : "Apple"}</b>.</li>
                <li>Hapus URL lama, lalu paste kode script yang tadi disalin.</li>
                <li>Buka tab <a href={targetSiteUrl} target="_blank" rel="noreferrer" className="text-primary underline">{service === "youtube" ? "music.youtube.com" : "music.apple.com"}</a> (pastikan sudah login).</li>
                <li>Buka Bookmark dan ketuk penanda <b>Sync</b> tadi.</li>
              </ol>
            )}
          </div>
        </div>

        {/* METODE 3: Manual Input */}
        <div className="border-t border-white/[0.08] pt-2">
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition"
          >
            <span>Input Teks Manual (Lanjutan)</span>
            {showManual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showManual && (
            <form onSubmit={handleSubmitManual} className="space-y-2.5 pt-2">
              {service === "youtube" ? (
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Cookie SAPISID YouTube Music
                  </label>
                  <textarea
                    value={cookieString}
                    onChange={(e) => setCookieString(e.target.value)}
                    placeholder="SAPISID=...; __Secure-3PAPISID=..."
                    rows={3}
                    className="w-full bg-card border border-white/[0.08] rounded-lg p-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-white/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Token media-user-token Apple Music
                  </label>
                  <textarea
                    value={appleUserToken}
                    onChange={(e) => setAppleUserToken(e.target.value)}
                    placeholder="Paste media-user-token..."
                    rows={2}
                    className="w-full bg-card border border-white/[0.08] rounded-lg p-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-white/20"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-xs font-medium btn-press transition"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Kredensial"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
