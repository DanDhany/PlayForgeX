import React, { useState, useRef } from "react";
import {
  X,
  KeyRound,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Code2,
} from "lucide-react";
import { copyToClipboard } from "../utils/ui-helpers";
import { generateDirectLoginScript } from "../utils/bookmarklet-generator";

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
  const [showTutorial, setShowTutorial] = useState(false);
  const [scriptFormat, setScriptFormat] = useState<"console" | "bookmarklet">("console");
  const [copiedState, setCopiedState] = useState<"idle" | "script" | "cli">("idle");
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3080";
  const userToken = typeof window !== "undefined" ? localStorage.getItem("playforgex_token") : null;
  const targetAlias = service === "youtube" ? "Koleksi Utama (YouTube)" : "Koleksi Utama (Apple)";

  const rawScript = generateDirectLoginScript(origin, service, targetAlias, userToken);
  const activeScript = scriptFormat === "bookmarklet" ? `javascript:${rawScript}` : rawScript;

  const targetSiteUrl = service === "youtube" ? "https://music.youtube.com" : "https://music.apple.com";
  const cliCommand =
    service === "youtube"
      ? `npm run auth:yt -- --alias "${targetAlias}" --server "${origin}"`
      : `npm run auth:apple -- --alias "${targetAlias}" --server "${origin}"`;

  const handleCopyScript = async () => {
    const ok = await copyToClipboard(activeScript);
    if (ok) {
      setCopiedState("script");
      setTimeout(() => setCopiedState("idle"), 2500);
    } else if (scriptTextareaRef.current) {
      scriptTextareaRef.current.focus();
      scriptTextareaRef.current.select();
    }
  };

  const handleCopyCli = async () => {
    const ok = await copyToClipboard(cliCommand);
    if (ok) {
      setCopiedState("cli");
      setTimeout(() => setCopiedState("idle"), 2500);
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

      <div className="bg-surface border-t md:border border-white/[0.1] rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-4 md:p-6 space-y-4 max-h-[92dvh] overflow-y-auto animate-sheet-up md:animate-dialog-in pb-safe">
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
                Pilih metode sinkronisasi sesi yang paling nyaman untuk Anda
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

        {/* METODE 1: In-Page Script Browser (Console DevTools F12 / Safari Bookmarklet) */}
        <div className="p-3.5 rounded-xl bg-card border border-accent/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Code2 className="w-4 h-4" />
              <span>Script Browser 1-Klik (Bebas CORS & Mixed-Content)</span>
            </div>

            {/* Format Switcher */}
            <div className="flex items-center p-0.5 bg-surface rounded-md border border-border text-[10px]">
              <button
                type="button"
                onClick={() => setScriptFormat("console")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  scriptFormat === "console"
                    ? "bg-accent/20 text-accent font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Console (F12)
              </button>
              <button
                type="button"
                onClick={() => setScriptFormat("bookmarklet")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  scriptFormat === "bookmarklet"
                    ? "bg-accent/20 text-accent font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Bookmarklet
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {scriptFormat === "console" ? (
              <>
                Buka tab baru di{" "}
                <a href={targetSiteUrl} target="_blank" rel="noreferrer" className="text-accent underline font-mono">
                  {targetSiteUrl.replace("https://", "")}
                </a>
                , tekan <kbd className="px-1 py-0.5 bg-surface rounded border border-border font-mono text-[10px]">F12</kbd> (Inspect &gt; Console), lalu tempel script ini dan tekan Enter.
              </>
            ) : (
              <>
                Simpan script ini sebagai bookmark di browser Safari / Chrome HP Anda saat membuka tab{" "}
                <a href={targetSiteUrl} target="_blank" rel="noreferrer" className="text-accent underline font-mono">
                  {targetSiteUrl.replace("https://", "")}
                </a>
                .
              </>
            )}
          </p>

          {/* Copy Script & Open Target Site */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyScript}
              className="flex-1 py-2 px-3 bg-accent text-background font-semibold text-xs rounded-lg flex items-center justify-center gap-2 btn-press transition shadow-sm hover:brightness-110"
            >
              {copiedState === "script" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Script Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {scriptFormat === "console" ? "Salin Script Console (F12)" : "Salin Kode Bookmarklet"}
                  </span>
                </>
              )}
            </button>

            <a
              href={targetSiteUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 bg-surface hover:bg-surface-elevated text-slate-200 border border-border text-xs font-medium rounded-lg flex items-center gap-1.5 btn-press transition"
            >
              <span>Buka Situs</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          {/* Code box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{scriptFormat === "console" ? "Kode JavaScript Console:" : "Kode URL Bookmarklet:"}</span>
              <button
                type="button"
                onClick={() => {
                  if (scriptTextareaRef.current) {
                    scriptTextareaRef.current.focus();
                    scriptTextareaRef.current.select();
                  }
                }}
                className="text-accent hover:underline"
              >
                Pilih Semua
              </button>
            </div>
            <textarea
              ref={scriptTextareaRef}
              readOnly
              rows={3}
              value={activeScript}
              onClick={() => {
                if (scriptTextareaRef.current) {
                  scriptTextareaRef.current.focus();
                  scriptTextareaRef.current.select();
                }
              }}
              className="w-full bg-surface border border-border rounded-lg p-2 text-[10px] font-mono text-slate-300 resize-none focus:outline-none focus:border-accent select-all break-all leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowTutorial(!showTutorial)}
            className="text-[11px] text-accent hover:underline flex items-center gap-1 pt-0.5"
          >
            <span>{showTutorial ? "Sembunyikan petunjuk" : "Lihat cara menjalankan script ini"}</span>
            {showTutorial ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTutorial && (
            <div className="bg-surface p-3 rounded-lg border border-border text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-text-primary">Langkah Menggunakan:</p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                <li>Buka tab <a href={targetSiteUrl} target="_blank" rel="noreferrer" className="text-accent underline font-mono">{targetSiteUrl.replace("https://", "")}</a> dan pastikan akun Anda sudah masuk.</li>
                <li>
                  {scriptFormat === "console" ? (
                    <>Buka Developer Tools (tekan <b>F12</b> atau klik kanan &gt; <b>Inspect</b> &gt; pilih tab <b>Console</b>).</>
                  ) : (
                    <>Buat penanda/bookmark baru di Safari/Chrome, lalu tempel kode script ke kolom URL bookmark.</>
                  )}
                </li>
                <li>
                  {scriptFormat === "console" ? (
                    <>Tempel script yang disalin ke Console lalu tekan <b>Enter</b>.</>
                  ) : (
                    <>Ketuk penanda bookmark tersebut saat sedang berada di tab YouTube/Apple Music.</>
                  )}
                </li>
                <li>Sesi login otomatis dikirim via navigasi form aman ke PlayForgeX dan browser akan dialihkan kembali dengan status terhubung.</li>
              </ol>
            </div>
          )}
        </div>

        {/* METODE 2: Terminal Mac / CLI */}
        <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-primary">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span>Opsi Terminal Host (Otomatis &amp; Terisolasi)</span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Jalankan perintah ini di Terminal host untuk meluncurkan profil Chrome terpisah yang langsung merekam sesi Anda:
          </p>

          <div className="bg-surface border border-border rounded-lg p-2 flex items-center justify-between font-mono text-[11px] text-emerald-300">
            <code className="truncate mr-2">{cliCommand}</code>
            <button
              onClick={handleCopyCli}
              className="p-1 text-slate-400 hover:text-white transition btn-press flex-shrink-0"
              title="Salin perintah"
            >
              {copiedState === "cli" ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* METODE 3: Manual Input */}
        <div className="border-t border-white/[0.08] pt-2">
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition"
          >
            <span>Input Kredensial Manual</span>
            {showManual ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showManual && (
            <form onSubmit={handleSubmitManual} className="space-y-2.5 pt-2">
              {service === "youtube" ? (
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Cookie SAPISID / Full Cookie YouTube Music
                  </label>
                  <textarea
                    value={cookieString}
                    onChange={(e) => setCookieString(e.target.value)}
                    placeholder="SAPISID=...; __Secure-3PAPISID=..."
                    rows={3}
                    className="w-full bg-surface border border-border rounded-lg p-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-accent"
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
                    className="w-full bg-surface border border-border rounded-lg p-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-accent text-background hover:brightness-110 disabled:opacity-50 rounded-lg text-xs font-semibold btn-press transition"
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