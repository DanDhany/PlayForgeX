import React, { useState } from "react";
import { X, KeyRound, AlertCircle, ChevronDown, ChevronUp, Copy, Check, Smartphone, Monitor } from "lucide-react";

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
  const ytBookmarkletCode = `javascript:(function(){const c=document.cookie;if(c.includes('SAPISID')||c.includes('__Secure-3PAPISID')){fetch('${origin}/api/auth/youtube',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cookieString:c})}).then(()=>{alert('🎉 YouTube Music berhasil tersinkron ke MirrorSong!');window.location.href='${origin}';}).catch(e=>alert('Koneksi gagal: '+e));}else{alert('Silakan login ke YouTube Music terlebih dahulu!');}})();`;

  const appleBookmarkletCode = `javascript:(function(){const m=localStorage.getItem('media-user-token')||(document.cookie.match(/media-user-token=([^;]+)/)||[])[1]||(window.MusicKit&&window.MusicKit.getInstance&&window.MusicKit.getInstance().musicUserToken);if(m){fetch('${origin}/api/auth/apple',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({musicUserToken:m})}).then(()=>{alert('🎉 Apple Music berhasil tersinkron ke MirrorSong!');window.location.href='${origin}';}).catch(e=>alert('Koneksi gagal: '+e));}else{alert('Silakan login ke Apple Music terlebih dahulu!');}})();`;

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
      <div className="bg-surface border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-5 md:p-6 space-y-4 glass-panel-elevated max-h-[90dvh] overflow-y-auto">
        {/* Mobile Handle */}
        <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
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
                Hubungkan {service === "youtube" ? "YouTube Music" : "Apple Music"}
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih metode koneksi yang paling mudah bagi Anda.
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

        {/* METODE UTAMA (PALING REKOMENDASI UNTUK SETUP SERVER MAC + HP) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-card/90 to-card/90 border border-emerald-500/30 space-y-2.5 shadow-md">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <Monitor className="w-4 h-4" />
            <span>Paling Mudah: Login 1x di Terminal Mac Server</span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            Karena Mac bertindak sebagai server, Anda cukup jalankan satu perintah ini di Terminal Mac. Jendela browser akan terbuka otomatis di Mac, login, dan <b>layar HP Anda akan langsung terdeteksi login secara otomatis!</b>
          </p>

          <div className="bg-surface/90 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between font-mono text-xs text-emerald-300">
            <code>{cliCommand}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(cliCommand);
                alert(`Perintah '${cliCommand}' telah disalin! Jalankan di Terminal Mac Anda.`);
              }}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Salin perintah"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* METODE 2: CARA BILA INGIN LEWAT HP (BOOKMARKLET SAFARI) */}
        <div className="p-4 rounded-2xl bg-card/90 border border-white/[0.08] space-y-3 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
            <Smartphone className="w-4 h-4" />
            <span>Metode 2: Menggunakan iPhone Safari (Bookmarklet)</span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
            <p className="text-[11px] text-amber-300/90 font-medium">
              ⚠️ Catatan: Di HP, isi bookmark <b>BUKAN</b> URL IP <code>http://192.168...</code>, melainkan script sinkronisasi khusus di bawah ini:
            </p>

            <button
              onClick={handleCopyBookmarklet}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 btn-press transition mt-2"
            >
              {copiedBookmarklet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedBookmarklet ? "Kode Script Berhasil Disalin!" : "Salin Kode Script Sinkronisasi"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIosTutorial(!showIosTutorial)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 pt-1"
            >
              <span>{showIosTutorial ? "Sembunyikan panduan iPhone" : "Lihat cara pasang di Safari iPhone"}</span>
              {showIosTutorial ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showIosTutorial && (
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-300 bg-surface/70 p-3 rounded-xl border border-white/[0.06] mt-2">
                <li>Buka Safari di iPhone, simpan halaman ini ke Bookmark (tombol Share ➔ <b>Tambah Penanda</b>).</li>
                <li>Buka menu Bookmark (ikon buku), tekan <b>Edit</b> pada bookmark tadi.</li>
                <li>Ubah namanya jadi <b>Sync {service === "youtube" ? "YTM" : "Apple"}</b>.</li>
                <li><b>Hapus URL-nya yang lama</b>, lalu paste kode script yang tadi sudah disalin. Simpan.</li>
                <li>Buka tab <a href={targetSiteUrl} target="_blank" rel="noreferrer" className="text-primary underline">{service === "youtube" ? "music.youtube.com" : "music.apple.com"}</a> (pastikan sudah login).</li>
                <li>Buka Bookmarks dan ketuk bookmark <b>Sync</b> tadi. Browser akan otomatis mengirim sesi ke MirrorSong!</li>
              </ol>
            )}
          </div>
        </div>

        {/* METODE 3: MANUAL INPUT FALLBACK */}
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
                    Paste Cookie Header (SAPISID)
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
