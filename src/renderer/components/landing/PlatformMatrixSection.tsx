import React from "react";
import {
  Radio,
  Code2,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { SpotlightCard } from "./SpotlightCard";

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
      "Arsitektur adapter siap untuk integrasi Web API Spotify. Dukungan membaca daftar putar dan sinkronisasi lintas platform.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter SpotifyAdapter",
      "Perluasan Kredensial Mandiri",
    ],
  },
  {
    id: "tidal",
    name: "Tidal",
    brandColor: "#00FFFF",
    status: "planned",
    category: "Lossless",
    authType: "OAuth / Token Auth",
    summary:
      "Persiapan migrasi audio lossless HiFi/MQA bagi pendengar yang mengutamakan kualitas audio beresolusi tinggi.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter TidalAdapter",
      "Pencocokan Metadata Hi-Res",
    ],
  },
  {
    id: "deezer",
    name: "Deezer",
    brandColor: "#A238FF",
    status: "planned",
    category: "Streaming",
    authType: "ARL Cookie / Web API",
    summary:
      "Dukungan adapter modular untuk sinkronisasi pustaka Deezer dan pencocokan katalog FLAC global.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter DeezerAdapter",
      "Ekstraksi Playlist Berkas",
    ],
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    brandColor: "#FF5500",
    status: "planned",
    category: "Indie & DJ",
    authType: "OAuth 2.0 / Client ID",
    summary:
      "Menjembatani lagu indie unik, set DJ, bootleg remix, dan rilisan independen yang tidak tersedia di platform komersial.",
    capabilities: [
      "Arsitektur Siap",
      "Struktur Adapter SoundCloudAdapter",
      "Dukungan DJ Mixes & Remaster",
    ],
  },
  {
    id: "subsonic",
    name: "Subsonic / Navidrome",
    brandColor: "#0080FF",
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
      className="w-full py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto text-left"
    >
      {/* Section Header */}
      <Reveal>
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-white/[0.08] mb-4">
            <Radio className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Matriks Platform &amp; Integrasi
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary leading-tight">
            Didukung Penuh Hari Ini, Terbuka untuk Layanan Esok Hari.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
            TuneBridge tidak mengunci Anda ke satu platform. Melalui sistem adapter modular,
            arsitektur aplikasi memisahkan logika antarmuka dari protokol autentikasi tiap layanan musik.
          </p>
        </div>
      </Reveal>

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PLATFORMS.map((platform, idx) => {
          const isActive = platform.status === "active";
          return (
            <Reveal key={platform.id} delay={idx * 60}>
              <SpotlightCard
                spotlightColor={isActive ? "rgba(169, 155, 255, 0.16)" : "rgba(255, 255, 255, 0.06)"}
                className={`h-full flex flex-col justify-between ${
                  isActive
                    ? "border-white/[0.12] bg-[#12141A]/90 shadow-xl"
                    : "border-white/[0.05] bg-[#12141A]/50 opacity-90 hover:opacity-100"
                }`}
              >
                <div>
                  {/* Top Row */}
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

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                        isActive
                          ? "bg-status-success/15 text-status-success border-status-success/30"
                          : "bg-white/[0.05] text-text-muted border-white/[0.08]"
                      }`}
                    >
                      {isActive ? "Aktif &amp; Terintegrasi" : "Arsitektur Siap"}
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {platform.summary}
                  </p>
                </div>

                {/* Capabilities list */}
                <div className="pt-3.5 border-t border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted block mb-1">
                    Kapabilitas
                  </span>
                  {platform.capabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      <span className="truncate">{cap}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>

      {/* Technical Architecture Deep Dive Card */}
      <Reveal delay={200} className="mt-10">
        <SpotlightCard
          spotlightColor="rgba(105, 214, 175, 0.12)"
          className="p-6 sm:p-8 rounded-3xl bg-[#0E1218]/90 border border-white/[0.1] shadow-2xl"
        >
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
                <span className="text-[11px] text-text-muted">Akurasi ISRC &amp; sanitasi judul</span>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
};
