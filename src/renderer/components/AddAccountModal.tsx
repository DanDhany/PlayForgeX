import React, { useState, useRef, useEffect } from "react";
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
  ArrowRight,
  ArrowLeft,
  Globe,
  Edit2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { copyToClipboard } from "../utils/ui-helpers";
import { AccountConnection } from "../../shared/types";
import { useLanguage } from "../context/LanguageContext";
import {
  generateYouTubeMobileSyncScript,
  generateAppleMobileSyncScript,
} from "../utils/bookmarklet-generator";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingAccounts?: AccountConnection[];
}

type ConnectMethod = "bookmarklet" | "cli" | "manual";
type ScriptFormat = "bookmarklet" | "console";

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingAccounts = [],
}) => {
  const { t, lang } = useLanguage();
  const isEn = lang === "en";
  if (!isOpen) return null;

  const [step, setStep] = useState<"name" | "connect">("name");
  const [platform, setPlatform] = useState<"youtube" | "youtube_video" | "apple" | "spotify" | "soundcloud" | "deezer" | "file">("youtube");
  const [alias, setAlias] = useState("");
  const [aliasTouched, setAliasTouched] = useState(false);
  const [connectMethod, setConnectMethod] = useState<ConnectMethod>("bookmarklet");
  const [scriptFormat, setScriptFormat] = useState<ScriptFormat>("console");
  const [cookieString, setCookieString] = useState("");
  const [musicUserToken, setMusicUserToken] = useState("");
  const [developerToken, setDeveloperToken] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [bookmarkletCopied, setBookmarkletCopied] = useState<"idle" | "copied" | "selected">("idle");
  const [copiedCli, setCopiedCli] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookmarkletRef = useRef<HTMLTextAreaElement>(null);
  const cliRef = useRef<HTMLDivElement>(null);

  // Reset to Step 1 whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("name");
      setAlias("");
      setAliasTouched(false);
      setError(null);
      setUrlInput("");
      setFileContent("");
      setBookmarkletCopied("idle");
      setCopiedCli(false);
    }
  }, [isOpen]);

  // Compute dynamic origin/domain
  const origin =
    typeof window !== "undefined" &&
    window.location.origin &&
    window.location.origin !== "null" &&
    !window.location.origin.startsWith("file:")
      ? window.location.origin
      : "http://localhost:3080";

  const isDomain =
    typeof window !== "undefined" &&
    window.location.hostname &&
    !["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

  const trimmedAlias = alias.trim();
  const isDuplicate = existingAccounts.some(
    (acc) =>
      acc.platform === platform &&
      acc.localAlias.trim().toLowerCase() === trimmedAlias.toLowerCase()
  );

  const canProceedToConnect = trimmedAlias.length > 0 && !isDuplicate;

  // Anti-Mixed-Content & In-Page Mobile Sync Script (Customized to validated alias & dynamic origin)
  const currentToken = typeof window !== "undefined" ? localStorage.getItem("playforgex_token") : null;
  const ytScript = generateYouTubeMobileSyncScript(origin, trimmedAlias, currentToken);
  const appleScript = generateAppleMobileSyncScript(origin, trimmedAlias, currentToken);

  const activeRawScript = platform === "youtube" ? ytScript : appleScript;
  const bookmarkletCode = `javascript:${activeRawScript}`;
  const consoleCode = activeRawScript;
  const activeScript = scriptFormat === "bookmarklet" ? bookmarkletCode : consoleCode;

  const targetSiteUrl = platform === "youtube" ? "https://music.youtube.com" : "https://music.apple.com";

  // CLI Command dynamically embeds the verified alias and dynamic server domain
  const cliCommand =
    platform === "youtube"
      ? `npm run auth:yt -- --alias "${trimmedAlias}" --server "${origin}"`
      : `npm run auth:apple -- --alias "${trimmedAlias}" --server "${origin}"`;

  const handleCopyScript = async () => {
    const success = await copyToClipboard(activeScript);
    if (success) {
      setBookmarkletCopied("copied");
      setTimeout(() => setBookmarkletCopied("idle"), 2500);
    } else {
      handleSelectBookmarklet();
    }
  };

  const handleSelectBookmarklet = () => {
    if (bookmarkletRef.current) {
      bookmarkletRef.current.focus();
      bookmarkletRef.current.select();
      bookmarkletRef.current.setSelectionRange(0, activeScript.length);
      setBookmarkletCopied("selected");
      setTimeout(() => setBookmarkletCopied("idle"), 4000);
    }
  };

  const handleCopyCli = async () => {
    const success = await copyToClipboard(cliCommand);
    if (success) {
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceedToConnect) {
      setError("Nama akun wajib diisi dan belum pernah digunakan.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        platform,
        alias: trimmedAlias,
      };

      if (platform === "youtube") {
        if (!cookieString.trim()) {
          throw new Error("Cookie string YouTube tidak boleh kosong");
        }
        payload.cookieString = cookieString.trim();
      } else if (platform === "apple") {
        if (!musicUserToken.trim()) {
          throw new Error("Music-User-Token Apple Music tidak boleh kosong");
        }
        payload.musicUserToken = musicUserToken.trim();
        if (developerToken.trim()) {
          payload.developerToken = developerToken.trim();
        }
      } else if (platform === "youtube_video") {
        if (!urlInput.trim()) {
          throw new Error("Tautan atau ID playlist YouTube video tidak boleh kosong");
        }
        payload.playlistUrl = urlInput.trim();
      } else if (platform === "spotify") {
        if (!urlInput.trim()) {
          throw new Error("Tautan atau ID playlist Spotify tidak boleh kosong");
        }
        payload.playlistUrl = urlInput.trim();
      } else if (platform === "soundcloud") {
        if (!urlInput.trim()) {
          throw new Error("Tautan set SoundCloud tidak boleh kosong");
        }
        payload.setUrl = urlInput.trim();
      } else if (platform === "deezer") {
        if (!urlInput.trim()) {
          throw new Error("Tautan atau ID playlist Deezer tidak boleh kosong");
        }
        payload.playlistId = urlInput.trim();
      } else if (platform === "file") {
        if (!fileContent.trim()) {
          throw new Error("Daftar lagu atau konten file tidak boleh kosong");
        }
        payload.content = fileContent.trim();
      }

      const token = typeof window !== "undefined"
        ? localStorage.getItem("playforgex_token")
        : null;

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

  const nameSuggestions =
    platform === "youtube"
      ? ["Koleksi Utama", "Akun Kedua", "Koleksi Kantor", "Keluarga"]
      : platform === "youtube_video"
      ? ["Playlist Video Favorit", "Klip Musik Pilihan", "DJ / Set YouTube", "Soundtrack"]
      : platform === "apple"
      ? ["Koleksi Apple", "Mobil (CarPlay)", "iPad / Rumah", "Keluarga"]
      : platform === "spotify"
      ? ["Spotify Liked", "Koleksi Spotify", "Playlist Mingguan", "Arsip Spotify"]
      : platform === "soundcloud"
      ? ["SoundCloud Mix", "DJ Sets", "Indie Tracks", "Live Bootleg"]
      : platform === "deezer"
      ? ["Deezer Flow", "Katalog Deezer", "Pustaka Deezer"]
      : ["Impor M3U", "Daftar Teks Manual", "Cadangan Soundiiz", "Snapshot JSON"];

  const platformDisplayName =
    platform === "youtube"
      ? "YouTube Music"
      : platform === "youtube_video"
      ? (isEn ? "YouTube Video (Playlist / Single Video / Multi Links)" : "YouTube Video (Playlist, Video Tunggal, atau Kumpulan Link)")
      : platform === "apple"
      ? "Apple Music"
      : platform === "spotify"
      ? "Spotify"
      : platform === "soundcloud"
      ? "SoundCloud"
      : platform === "deezer"
      ? "Deezer"
      : "File / Teks";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-surface border-t md:border border-border rounded-t-3xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-4 md:p-6 space-y-4 max-h-[92dvh] overflow-y-auto animate-sheet-up md:animate-dialog-in pb-safe">
        {/* iOS Drag Handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-semibold text-text-primary">
                  {t("modal.addAccount")}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-elevated border border-border text-text-secondary font-mono">
                  {step === "name" ? t("modal.step1") : t("modal.step2")}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary">
                {step === "name"
                  ? t("modal.step1Desc")
                  : t("modal.step2Desc")}
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

        {/* ============================================================== */}
        {/* STEP 1: NAMA AKUN & PLATFORM (User WAJIB isi sebelum ada script) */}
        {/* ============================================================== */}
        {step === "name" ? (
          <div className="space-y-4 py-1">
            {/* Platform Selector Segmented Control */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-secondary">Layanan Musik & Media</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-surface-elevated rounded-xl border border-border text-xs">
                {[
                  { id: "youtube", label: "YouTube Music", color: "bg-red-500", activeClass: "bg-red-500/20 text-red-400 border-red-500/30" },
                  { id: "youtube_video", label: "YouTube Video", color: "bg-orange-500", activeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
                  { id: "apple", label: "Apple Music", color: "bg-accent", activeClass: "bg-accent/20 text-accent border-accent/30" },
                  { id: "spotify", label: "Spotify", color: "bg-emerald-500", activeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
                  { id: "soundcloud", label: "SoundCloud", color: "bg-amber-500", activeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
                  { id: "deezer", label: "Deezer", color: "bg-purple-500", activeClass: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
                  { id: "file", label: "File / Teks", color: "bg-slate-400", activeClass: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPlatform(item.id as any)}
                    className={`py-1.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 btn-press border ${
                      platform === item.id
                        ? `${item.activeClass} shadow-sm`
                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Alias Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-text-secondary">
                  Nama / Label Akun <span className="text-accent">*</span>
                </label>
                <span className="text-[10px] text-text-secondary/70">Wajib diisi & unik</span>
              </div>
              <input
                type="text"
                autoFocus
                placeholder={
                  platform === "youtube"
                    ? "Misal: Akun Utama, Koleksi Orang B, Akun Kantor"
                    : "Misal: Koleksi Apple, Mobil (CarPlay), iPad Rumah"
                }
                value={alias}
                onChange={(e) => {
                  setAlias(e.target.value);
                  setAliasTouched(true);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canProceedToConnect) {
                    setStep("connect");
                  }
                }}
                className={`w-full px-3 py-2.5 bg-surface-elevated border rounded-lg text-xs text-text-primary focus:outline-none transition-colors placeholder:text-text-secondary/40 ${
                  isDuplicate
                    ? "border-status-danger focus:border-status-danger"
                    : canProceedToConnect
                    ? "border-status-success/60 focus:border-status-success"
                    : "border-border focus:border-accent"
                }`}
              />

              {/* Realtime Validation Feedback */}
              {isDuplicate ? (
                <div className="flex items-center gap-1.5 text-[11px] text-status-danger font-medium pt-0.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Nama &quot;{trimmedAlias}&quot; sudah digunakan di{" "}
                    {platform === "youtube" ? "YouTube Music" : "Apple Music"}. Pilih nama lain agar
                    tidak bertabrakan.
                  </span>
                </div>
              ) : canProceedToConnect ? (
                <div className="flex items-center gap-1.5 text-[11px] text-status-success font-medium pt-0.5 animate-fadeIn">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{isEn ? "Account nickname is ready to generate script." : "Nama akun siap digunakan untuk generate script."}</span>
                </div>
              ) : aliasTouched && trimmedAlias.length === 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary pt-0.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 text-text-secondary/80" />
                  <span>{isEn ? "Enter a nickname for this account before proceeding to scripts." : "Tulis nama untuk akun ini sebelum melihat script koneksi."}</span>
                </div>
              ) : (
                <p className="text-[11px] text-text-secondary/80">
                  {isEn
                    ? "This nickname will be embedded into the script to prevent multi-account conflicts."
                    : "Nama ini akan dicantumkan otomatis ke dalam script agar tidak tertukar dengan akun lain."}
                </p>
              )}

              {/* Quick Suggestions Chips */}
              <div className="pt-2">
                <span className="text-[10px] text-text-secondary/70 block mb-1.5">
                  {isEn ? "Quick nickname suggestions:" : "Inspirasi nama cepat:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {nameSuggestions.map((suggestion) => {
                    const isTaken = existingAccounts.some(
                      (acc) =>
                        acc.platform === platform &&
                        acc.localAlias.trim().toLowerCase() === suggestion.toLowerCase()
                    );
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={isTaken}
                        onClick={() => {
                          setAlias(suggestion);
                          setAliasTouched(true);
                        }}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors btn-press ${
                          isTaken
                            ? "bg-surface-elevated/40 text-text-secondary/40 border-border/40 cursor-not-allowed line-through"
                            : alias === suggestion
                            ? "bg-accent/20 border-accent/40 text-accent font-medium"
                            : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                        }`}
                      >
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Target Domain Confirmation Indicator */}
            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-border/70 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Globe className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>Target Pengiriman:</span>
              </div>
              <span className="font-mono text-text-primary font-medium truncate max-w-[220px]">
                {origin}
              </span>
            </div>

            {/* Proceed Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!canProceedToConnect}
                onClick={() => setStep("connect")}
                className="w-full py-2.5 rounded-lg bg-accent text-background text-xs font-semibold hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed btn-press flex items-center justify-center gap-2 shadow-sm transition-opacity"
              >
                <span>Lanjutkan & Siapkan Script</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* STEP 2: TAMPILKAN SCRIPT TERPERSONALISASI SESUAI NAMA TERBUAT */
          /* ============================================================== */
          <div className="space-y-4 animate-fadeIn">
            {/* Account Confirmation Banner */}
            <div className="p-3 bg-surface-elevated rounded-xl border border-border flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      platform === "youtube"
                        ? "bg-red-500"
                        : platform === "youtube_video"
                        ? "bg-orange-500"
                        : platform === "apple"
                        ? "bg-accent"
                        : platform === "spotify"
                        ? "bg-emerald-500"
                        : platform === "soundcloud"
                        ? "bg-amber-500"
                        : platform === "deezer"
                        ? "bg-purple-500"
                        : "bg-slate-400"
                    }`}
                  />
                  <span className="text-[11px] text-text-secondary font-medium">
                    {platformDisplayName}
                  </span>
                </div>
                <div className="text-xs font-semibold text-text-primary truncate mt-0.5">
                  &quot;{trimmedAlias}&quot;
                </div>
                <div className="text-[10px] text-text-secondary font-mono mt-0.5 truncate">
                  Tujuan: <span className="text-accent">{origin}</span>{" "}
                  {isDomain ? "(Domain Aktif)" : "(Host Aktif)"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("name")}
                className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1 btn-press transition-colors flex-shrink-0"
              >
                <Edit2 className="w-3 h-3 text-accent" />
                <span>Ubah Nama</span>
              </button>
            </div>

            {platform !== "youtube" && platform !== "apple" ? (
              <form onSubmit={handleSubmitManual} className="space-y-4">
                {platform === "file" ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-text-secondary">
                      {isEn ? "Paste Playlist Text / Content" : "Tempel Teks Daftar Lagu / Konten Playlist"}
                    </label>
                    <textarea
                      rows={6}
                      placeholder={
                        isEn
                          ? "Format:\nArtist - Title\nArtist - Song 2\n\nOr paste M3U, CSV, or PlayForgeX JSON content."
                          : "Format:\nArtis - Judul Lagu\nArtis - Lagu 2\n\nAtau tempel isi file M3U, CSV, atau JSON PlayForgeX."
                      }
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      className="w-full p-2.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    />
                    <div className="flex items-center justify-between text-[11px] text-text-secondary">
                      <span>{isEn ? "Supports: .m3u, .csv, plain text, and JSON" : "Mendukung: .m3u, .csv, teks biasa, dan JSON"}</span>
                      <label className="cursor-pointer text-accent hover:underline font-medium">
                        <span>{isEn ? "Upload File" : "Pilih File"}</span>
                        <input
                          type="file"
                          accept=".txt,.csv,.m3u,.m3u8,.json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const text = evt.target?.result as string;
                                if (text) setFileContent(text);
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-text-secondary">
                      {platform === "youtube_video"
                        ? isEn
                          ? "YouTube Playlist URL, Single Video URL, or Multi-line Video URLs"
                          : "Tautan Playlist, Video Tunggal (watch?v=...), atau Kumpulan Link Video YouTube"
                        : platform === "spotify"
                        ? isEn ? "Spotify Playlist Link or Access Token" : "Tautan Playlist Spotify atau Token Akses"
                        : platform === "soundcloud"
                        ? isEn ? "SoundCloud Set or Track URL" : "Tautan Set atau Playlist SoundCloud"
                        : isEn ? "Deezer Playlist URL or ID" : "Tautan Playlist Deezer atau ID"}
                    </label>
                    {platform === "youtube_video" ? (
                      <textarea
                        rows={3}
                        placeholder={
                          isEn
                            ? "Paste playlist link (playlist?list=PL...), single video (watch?v=... / youtu.be/...), or multiple URLs (one per line)..."
                            : "Tempel link playlist (list=PL...), video tunggal (watch?v=... / youtu.be/...), atau beberapa URL video sekaligus (satu per baris)..."
                        }
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="w-full px-3 py-2.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={
                          platform === "spotify"
                            ? "https://open.spotify.com/playlist/... atau Token"
                            : platform === "soundcloud"
                            ? "https://soundcloud.com/artist/sets/..."
                            : "https://www.deezer.com/playlist/... atau ID"
                        }
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="w-full px-3 py-2.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                      />
                    )}
                    <p className="text-[11px] text-text-secondary">
                      {platform === "youtube_video"
                        ? (isEn
                          ? "PlayForgeX automatically scrubs video noise ('Official Video', '4K', 'Lyrics') to recover authentic recording metadata."
                          : "PlayForgeX otomatis membersihkan embel-embel judul video ('Official Video', '4K', 'Lyrics') dan mengekstrak rekaman studio aslinya.")
                        : platform === "spotify"
                        ? (isEn
                          ? "Ingests public Spotify playlists with track title, artist, and album without requiring developer account setup."
                          : "Membaca playlist publik Spotify lengkap dengan judul lagu, artis, dan album tanpa perlu akun developer.")
                        : platform === "soundcloud"
                        ? (isEn
                          ? "Ingests indie releases, underground live sets, and custom SoundCloud collections directly into your migration queue."
                          : "Mengimpor set SoundCloud, lagu indie, dan live mix langsung ke antrean migrasi Anda.")
                        : (isEn
                          ? "Leverages Deezer's open REST API for instantaneous playlist fetching with lossless metadata."
                          : "Memanfaatkan REST API terbuka Deezer untuk membaca playlist secara seketika dengan metadata lossless.")}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-accent text-background font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 btn-press flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("modal.saving")}</span>
                    </>
                  ) : (
                    <span>{isEn ? `Import & Connect ${platformDisplayName}` : `Impor & Hubungkan ${platformDisplayName}`}</span>
                  )}
                </button>
              </form>
            ) : (
              <>
            {/* Connection Method Segmented Tabs */}
            <div className="space-y-1.5">
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

            {/* Method 1: JavaScript (Bookmarklet / Console DevTools) */}
            {connectMethod === "bookmarklet" && (
              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-accent" />
                    <h4 className="text-xs font-semibold text-text-primary">
                      Script JavaScript Browser
                    </h4>
                  </div>
                  {/* Format Toggle: Bookmarklet vs Console */}
                  <div className="flex items-center p-0.5 bg-surface rounded-md border border-border text-[10px]">
                    <button
                      type="button"
                      onClick={() => setScriptFormat("bookmarklet")}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        scriptFormat === "bookmarklet"
                          ? "bg-accent/20 text-accent font-medium"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Bookmarklet
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptFormat("console")}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        scriptFormat === "console"
                          ? "bg-accent/20 text-accent font-medium"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      Console DevTools
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Buka tab baru di{" "}
                  <span className="text-text-primary font-mono">
                    {platform === "youtube" ? "music.youtube.com" : "music.apple.com"}
                  </span>
                  , pastikan sudah login akun, lalu jalankan script ini di Safari iPhone / Chrome HP.
                  {platform === "youtube"
                    ? " Modal interaktif akan muncul langsung di layar HP untuk memilih playlist yang ingin dikirim ke PlayForgeX."
                    : ` Sesi akan otomatis dikirim sebagai akun "${trimmedAlias}".`}
                </p>

                {platform === "youtube" && (
                  <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-lg text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-accent">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{isEn ? "Smart Mobile Sync (Direct from iPhone & Android)" : "Smart Mobile Sync (Bisa Langsung dari iPhone & HP)"}</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed">
                      {isEn
                        ? "This script executes directly within your mobile YouTube Music browser tab, reading authorized sessions and playlists seamlessly without HttpOnly issues."
                        : "Script ini berjalan langsung di dalam tab YouTube Music HP Anda, menggunakan sesi terautentikasi browser untuk mengambil playlist dan lagu pilihan secara otomatis tanpa kendala HttpOnly."}
                    </p>
                  </div>
                )}

                {/* Copy / Open Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="flex-1 py-2 px-3 rounded-lg bg-surface-hover hover:bg-border border border-border text-xs text-text-primary font-medium flex items-center justify-center gap-1.5 btn-press transition-colors"
                  >
                    {bookmarkletCopied === "copied" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-status-success" />
                        <span className="text-status-success font-semibold">{isEn ? "Copied to Clipboard!" : "Tersalin ke Clipboard!"}</span>
                      </>
                    ) : bookmarkletCopied === "selected" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-accent" />
                        <span className="text-accent font-semibold">{isEn ? "Text Selected (Tap Copy)" : "Teks Terpilih (Tap Salin)"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-text-secondary" />
                        <span>
                          {scriptFormat === "bookmarklet"
                            ? t("modal.copyBookmarklet")
                            : t("modal.copyConsole")}
                        </span>
                      </>
                    )}
                  </button>
                  {scriptFormat === "bookmarklet" && (
                    <a
                      href={bookmarkletCode}
                      onClick={(e) => {
                        if (!e.metaKey && !e.ctrlKey) e.preventDefault();
                      }}
                      className="hidden md:flex py-2 px-3 rounded-lg bg-surface-elevated hover:bg-surface-hover text-text-primary text-xs font-medium border border-border items-center gap-1.5 cursor-grab active:cursor-grabbing"
                      title={isEn ? "Drag this button to your desktop browser's Bookmarks Bar" : "Tarik tombol ini ke Bookmarks Bar browser laptop/PC Anda"}
                    >
                      <span>{isEn ? "Drag to Bookmarks Bar" : "Tarik ke Bookmark Bar"}</span>
                    </a>
                  )}
                  <a
                    href={targetSiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent text-xs font-medium border border-accent/20 flex items-center gap-1.5 btn-press transition-colors"
                  >
                    <span>{t("modal.openWeb")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Direct Tap-to-Select Script Box */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-text-secondary">
                    <span>
                      {scriptFormat === "bookmarklet"
                        ? "Kode Bookmarklet (URL):"
                        : "Kode Console DevTools (F12):"}
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectBookmarklet}
                      className="text-accent hover:underline text-[10px] font-medium"
                    >
                      Pilih Semua Teks
                    </button>
                  </div>
                  <textarea
                    ref={bookmarkletRef}
                    readOnly
                    rows={3}
                    value={activeScript}
                    onClick={handleSelectBookmarklet}
                    onTouchStart={handleSelectBookmarklet}
                    className="w-full p-2.5 bg-background border border-border rounded-lg font-mono text-[11px] text-text-secondary focus:text-text-primary focus:border-accent focus:outline-none select-all break-all cursor-pointer leading-relaxed resize-none"
                  />
                </div>
              </div>
            )}

            {/* Method 2: Terminal CLI (Host/Remote Computer) */}
            {connectMethod === "cli" && (
              <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-semibold text-text-primary">
                    {isEn ? "Terminal CLI Command (Automated Multi-Account)" : "Perintah Terminal NPM (Multi-Akun Otomatis)"}
                  </h4>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {isEn
                    ? "Run this command in terminal. An isolated browser profile will launch, and your login session will be registered as account "
                    : "Jalankan perintah ini di terminal. Profil Chrome terisolasi akan dibuka otomatis dan sesi login langsung didaftarkan sebagai akun "}
                  <strong>&quot;{trimmedAlias}&quot;</strong> {isEn ? "to host " : "ke domain "}
                  <code className="text-text-primary font-mono">{origin}</code>.
                </p>
                <div
                  ref={cliRef}
                  onClick={() => {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    if (cliRef.current && selection) {
                      range.selectNodeContents(cliRef.current);
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }}
                  className="p-2.5 bg-background rounded-lg border border-border/80 font-mono text-[11px] text-text-primary break-all select-all cursor-pointer"
                >
                  {cliCommand}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  className="w-full py-2 px-3 rounded-lg bg-surface-hover hover:bg-border border border-border text-xs text-text-primary font-medium flex items-center justify-center gap-1.5 btn-press transition-colors"
                >
                  {copiedCli ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-status-success" />
                      <span>{isEn ? "Command Copied!" : "Perintah Berhasil Disalin!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{t("modal.copyCli")}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Method 3: Manual Token / Cookie Form */}
            {connectMethod === "manual" && (
              <form onSubmit={handleSubmitManual} className="space-y-3">
                {platform === "youtube" ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-text-secondary">
                      YouTube Cookie Header
                    </label>
                    <textarea
                      rows={3}
                      placeholder={isEn ? "Paste Cookie header from DevTools Network (must include SAPISID or __Secure-3PAPISID)" : "Tempel header Cookie dari DevTools Network (harus mengandung SAPISID atau __Secure-3PAPISID)"}
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
                        placeholder={isEn ? "Paste media-user-token from cookie or localStorage on music.apple.com" : "Tempel media-user-token dari cookie atau localStorage music.apple.com"}
                        value={musicUserToken}
                        onChange={(e) => setMusicUserToken(e.target.value)}
                        className="w-full p-2.5 bg-surface-elevated border border-border rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-text-secondary">
                        {isEn ? "Developer Token (Optional)" : "Developer Token (Opsional)"}
                      </label>
                      <input
                        type="text"
                        placeholder={isEn ? "Defaults to internal developer token if empty" : "Gunakan token internal jika dikosongkan"}
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
                  {isSubmitting
                    ? t("modal.saving")
                    : t("modal.saveAccount", { alias: trimmedAlias })}
                </button>
              </form>
            )}
            </>
            )}

            {/* Back Button */}
            <div className="pt-1 flex justify-start">
              <button
                type="button"
                onClick={() => setStep("name")}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5 btn-press transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isEn ? "Back to Account Name" : "Kembali ke Ganti Nama"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="flex items-start gap-1.5 text-[10px] text-text-secondary/70 pt-1">
          <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-text-secondary" />
          <span>
            {isEn
              ? "Sessions are stored 100% locally in your host data folder. No data is ever transmitted to any developer cloud."
              : "Sesi disimpan 100% lokal di folder data host instalasi Anda. Tidak ada data yang dikirim ke cloud pengembang."}
          </span>
        </div>
      </div>
    </div>
  );
};
