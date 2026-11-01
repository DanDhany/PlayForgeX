import React, { useState } from "react";
import {
  ShieldCheck,
  Server,
  Database,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

interface SettingsViewProps {
  onRefresh?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [lyricsCheckEnabled, setLyricsCheckEnabled] = useState(true);

  const lanUrl = typeof window !== "undefined" ? window.location.origin : "http://192.168.1.42:3080";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-text-primary">
          Pengaturan & Diagnostik
        </h2>
        <p className="text-xs md:text-sm text-text-secondary mt-1">
          Konfigurasi algoritma pencocokan lagu, status proteksi anti-ban, dan endpoint self-hosted.
        </p>
      </div>

      {/* Section 1: Algoritma Matching & Deteksi Varian */}
      <div className="p-5 rounded-xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">
            Algoritma Pencocokan Lagu (Matching Engine)
          </h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Pencocokan lagu menggunakan normalisasi judul sanitasi ganda (menghilangkan tag remux, official audio, feat.), deteksi kemiripan artis berbasis Levenshtein/Jaro-Winkler, dan proteksi pembeda varian lagu.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border text-xs">
            <div>
              <div className="font-medium text-text-primary">Prioritas Judul & Artis (Non-Latin)</div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Mencocokkan judul kanji/hangul/arab ke transliterasi romaji/latin resmi di katalog.
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-status-success font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aktif</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border text-xs">
            <div>
              <div className="font-medium text-text-primary">Proteksi Versi Live, Acoustic & Remix</div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Mencegah versi live/remix tertimpa atau terhapus sebagai duplikat lagu studio biasa.
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-status-success font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aktif</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border text-xs">
            <div>
              <div className="font-medium text-text-primary">Verifikasi Lirik Tambahan</div>
              <div className="text-[11px] text-text-secondary mt-0.5">
                Memvalidasi kecocokan lirik saat terdapat beberapa artis dengan judul lagu serupa.
              </div>
            </div>
            <button
              onClick={() => setLyricsCheckEnabled(!lyricsCheckEnabled)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                lyricsCheckEnabled ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                  lyricsCheckEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Anti-Ban & Rate-Limit Stealth */}
      <div className="p-5 rounded-xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-status-success" />
          <h3 className="text-sm font-semibold text-text-primary">
            Sistem Keamanan & Anti-Ban (Stealth Guard)
          </h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Melindungi akun dari rate-limit dan deteksi bot otomatis menggunakan jitter acak, circuit breaker cooldown cerdas, serta penundaan natural antar request.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1">
            <span className="text-[11px] text-text-secondary">Circuit Breaker</span>
            <div className="text-xs font-semibold text-status-success flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span>Siaga & Protektif</span>
            </div>
            <p className="text-[10px] text-text-secondary/70">
              Otomatis melakukan cooling down saat respon 429 terdeteksi tanpa memutus transfer.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1">
            <span className="text-[11px] text-text-secondary">Jitter & Delay Antarmuka</span>
            <div className="text-xs font-semibold text-text-primary">
              250ms – 1200ms per request
            </div>
            <p className="text-[10px] text-text-secondary/70">
              Meniru pola navigasi pengguna asli untuk menjaga reputasi sesi browser.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Self-Hosted LAN Access */}
      <div className="p-5 rounded-xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">
            Akses Jaringan Lokal (Self-Hosted LAN)
          </h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          TuneBridge dapat diakses dari perangkat apa pun di jaringan rumah Anda (iPhone, iPad, Mac, PC, Android) melalui URL lokal:
        </p>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-elevated border border-border font-mono text-xs text-accent">
          <span className="flex-1 truncate">{lanUrl}</span>
          <button
            onClick={handleCopyUrl}
            className="px-2.5 py-1 rounded bg-surface-hover hover:bg-border text-text-primary flex items-center gap-1 text-[11px] font-sans btn-press"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? "Tersalin" : "Salin URL"}</span>
          </button>
        </div>
      </div>

      {/* Section 4: Local Storage & Data Privacy */}
      <div className="p-5 rounded-xl bg-surface border border-border space-y-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">
            Privasi & Penyimpanan Data Lokal
          </h3>
        </div>
        <div className="text-xs text-text-secondary space-y-1 leading-relaxed">
          <p>
            • Semua data disimpan di direktori lokal <code className="text-text-primary font-mono text-[11px]">./data/</code>
          </p>
          <p>
            • Metadata akun (<code className="text-text-primary font-mono text-[11px]">accounts.json</code>) dipisahkan dari kredensial rahasia (<code className="text-text-primary font-mono text-[11px]">secrets.json</code>).
          </p>
          <p>
            • Tidak ada pelacakan analitik, data telemetri pihak ketiga, atau biaya server pengembang.
          </p>
        </div>
      </div>
    </div>
  );
};
