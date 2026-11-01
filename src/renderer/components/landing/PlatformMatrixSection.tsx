import React from "react";
import {
  CheckCircle2,
  Cpu,
  Radio,
  Code2,
  Shield,
  RefreshCw,
} from "lucide-react";

interface PlatformInfo {
  id: string;
  name: string;
  brandColor: string;
  status: "active" | "planned";
  category: "Streaming" | "Lossless" | "Indie & DJ" | "Self-Hosted";
  authType: string;
  summary: string;
  capabilities: string[];
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: "youtube",
    name: "YouTube Music",
    brandColor: "#FF0000",
    status: "active",
    category: "Streaming",
    authType: "Sesi Cookie / Bookmarklet HP",
    summary:
      "Dukungan penuh untuk banyak akun bersamaan, sinkronisasi playlist privat, stealth bypass 429, dan ekstraksi lirik tersinkronisasi.",
    capabilities: [
      "Multi-Akun YouTube",
      "Impor Bookmarklet HP",
      "Pencarian Katalog Utuh",
      "Bypass Anti-Ban Otomatis",
    ],
  },
  {
    id: "apple",
    name: "Apple Music",
    brandColor: "#FA2D48",
    status: "active",
    category: "Streaming",
    authType: "MusicKit User Token",
    summary:
      "Pencocokan katalog ISRC dan fuzzy matcher dengan pratinjau audio 30 detik. Pembuatan playlist langsung ke pustaka pribadi.",
    capabilities: [
      "Pencocokan Katalog Apple",
      "Audio Preview 30 Detik",
      "Ekspor Playlist Instan",
      "Dukungan Akun Developer & Web",
    ],
  },
  {
    id: "spotify",
    name: "Spotify",
    brandColor: "#1DB954",
    status: "planned",
    category: "Streaming",
    authType: "OAuth 2.0 PKCE",
    summary:
      "Arsitektur adapter sudah terpasang di kernel. Menunggu aktivasi endpoint sinkronisasi dua arah untuk rilis berikutnya.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter SpotifyAdapter",
      "Normalisasi Metadata ISRC",
    ],
  },
  {
    id: "tidal",
    name: "Tidal",
    brandColor: "#00E5FF",
    status: "planned",
    category: "Lossless",
    authType: "OAuth / Device Code",
    summary:
      "Dukungan metadata streaming Hi-Res Master Audio dengan integritas tag album dan track list lossless.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter TidalAdapter",
      "Prioritas File Lossless",
    ],
  },
  {
    id: "deezer",
    name: "Deezer",
    brandColor: "#A238FF",
    status: "planned",
    category: "Streaming",
    authType: "Arl Token / Open API",
    summary:
      "Integrasi API katalog Deezer untuk alternatif pencocokan lagu dan pemindahan koleksi lintas benua.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter DeezerAdapter",
      "Dukungan Katalog Global",
    ],
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    brandColor: "#FF5500",
    status: "planned",
    category: "Indie & DJ",
    authType: "Client ID / OAuth",
    summary:
      "Mendukung transfer playlist lagu indie, rekaman live show, mixtape podcast, dan karya artis independen.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter SoundCloudAdapter",
      "Dukungan Trek Non-Komersial",
    ],
  },
  {
    id: "subsonic",
    name: "Subsonic / Navidrome",
    brandColor: "#3F83F8",
    status: "planned",
    category: "Self-Hosted",
    authType: "Server URL + Token Auth",
    summary:
      "Bawa playlist streaming komersial langsung ke server musik pribadi di rumah Anda (Navidrome, LMS, atau Jellyfin).",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter SubsonicAdapter",
      "Sinkronisasi Koleksi Mandiri",
    ],
  },
];

export const PlatformMatrixSection: React.FC = () => {
  return (
    <section
      id="platform-matrix-section"
      className="w-full py-16 md:py-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto text-left"
    >
      {/* Section Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-white/[0.08] mb-4">
          <Radio className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Matriks Platform & Integrasi
          </span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary leading-tight">
          Didukung Penuh Hari Ini, Terbuka untuk Layanan Esok Hari.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
          TuneBridge tidak mengunci Anda ke satu platform. Melalui sistem adapter modular,
          arsitektur aplikasi memisahkan logika antarmuka dari protokol autentikasi tiap layanan musik.
        </p>
      </div>

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => {
          const isActive = platform.status === "active";
          return (
            <div
              key={platform.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all relative flex flex-col justify-between ${
                isActive
                  ? "bg-[#12141A]/90 border-white/[0.1] hover:border-white/[0.2] shadow-xl"
                  : "bg-[#12141A]/40 border-white/[0.04] hover:border-white/[0.08] opacity-80 hover:opacity-100"
              }`}
            >
              {/* Top Row: Icon/Color Dot + Name + Status Badge */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: platform.brandColor }}
                    />
                    <h3 className="text-base font-semibold text-text-primary tracking-tight">
                      {platform.name}
                    </h3>
                  </div>

                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-success/15 border border-status-success/30 text-status-success text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                      Aktif & Didukung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium">
                      <Cpu className="w-3 h-3" />
                      Arsitektur Siap
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-text-muted border border-white/[0.06]">
                    {platform.category}
                  </span>
                  <span className="text-[11px] text-text-secondary truncate">
                    {platform.authType}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {platform.summary}
                </p>
              </div>

              {/* Capabilities checklist */}
              <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                {platform.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-text-muted">
                    <CheckCircle2
                      className={`w-3 h-3 flex-shrink-0 ${
                        isActive ? "text-status-success" : "text-text-muted"
                      }`}
                    />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical Architecture Deep Dive Card */}
      <div className="mt-8 p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-[#12141A]/70 border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 text-accent">
              <Code2 className="w-4 h-4" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                Pola Desain: PlatformAdapter Interface
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
              Satu Standar Metadata, Nol Keterikatan Vendor
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
              Setiap platform mengimplementasikan antarmuka murni:{" "}
              <code className="text-accent font-mono text-xs px-1.5 py-0.5 rounded bg-accent/10">
                fetchPlaylists()
              </code>
              ,{" "}
              <code className="text-accent font-mono text-xs px-1.5 py-0.5 rounded bg-accent/10">
                searchCatalog()
              </code>
              , dan{" "}
              <code className="text-accent font-mono text-xs px-1.5 py-0.5 rounded bg-accent/10">
                createPlaylist()
              </code>
              . Semua akun tersimpan terisolasi di database lokal, memastikan sesi satu layanan tidak
              pernah mengganggu layanan lainnya.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto lg:min-w-[280px]">
            <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-white/[0.06]">
              <Shield className="w-4 h-4 text-emerald-400 mb-1.5" />
              <span className="text-xs font-semibold text-text-primary block">
                Sesi Terisolasi
              </span>
              <span className="text-[11px] text-text-muted">Kredensial disimpan terenkripsi</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-white/[0.06]">
              <RefreshCw className="w-4 h-4 text-accent mb-1.5" />
              <span className="text-xs font-semibold text-text-primary block">
                Fuzzy Matcher
              </span>
              <span className="text-[11px] text-text-muted">Akurasi ISRC & sanitasi judul</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
