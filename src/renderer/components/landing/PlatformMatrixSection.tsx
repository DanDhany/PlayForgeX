import React from "react";
import { Radio, Shield, RefreshCw, Sparkles } from "lucide-react";
import { Reveal } from "./Reveal";
import { SpotlightCard } from "./SpotlightCard";
import { useLanguage } from "../../context/LanguageContext";

export const PlatformMatrixSection: React.FC = () => {
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  const platforms = [
    {
      id: "ytmusic",
      name: "YouTube Music",
      brandColor: "#FF0000",
      status: "active",
      category: isEn ? "Streaming & Uploads" : "Streaming & Video",
      summary: isEn
        ? "Full multi-account support: read private & public playlists, import mobile snapshots, and extract high-accuracy original titles."
        : "Dukungan multi-akun penuh: membaca playlist pribadi & publik, impor snapshot ponsel, dan ekstraksi judul asli berakurasi tinggi.",
      capabilities: isEn
        ? [
            "Multi-Account Concurrent Login",
            "One-Tap Mobile Bookmarklet",
            "Auto-Sanitization of Video Titles",
          ]
        : [
            "Multi-Akun Bersamaan",
            "Bookmarklet Impor Cepat dari HP",
            "Pembersihan Otomatis Judul Video",
          ],
    },
    {
      id: "applemusic",
      name: "Apple Music",
      brandColor: "#FC3C44",
      status: "active",
      category: isEn ? "Lossless Streaming" : "Hi-Res Audio",
      summary: isEn
        ? "Lossless Apple Music catalog matching, 30-second audio previews, and instant playlist creation directly in your library."
        : "Integrasi katalog resmi Apple Music, pemutar pratinjau audio 30 detik, dan ekspor playlist langsung ke library Anda.",
      capabilities: isEn
        ? [
            "Official Catalog Precision Matching",
            "Real-Time 30s Audio Audition",
            "Instant Lossless Playlist Creation",
          ]
        : [
            "Pencocokan Katalog Resmi",
            "Audio Preview 30 Detik",
            "Ekspor Playlist Instan",
          ],
    },
    {
      id: "spotify",
      name: "Spotify",
      brandColor: "#1DB954",
      status: "planned",
      category: isEn ? "Streaming" : "Streaming",
      summary: isEn
        ? "Seamless import of Spotify curated playlists, Liked Songs library synchronization, and cross-platform artist mapping."
        : "Impor playlist kurasi Spotify, sinkronisasi koleksi Liked Songs, dan pemetaan artis lintas platform.",
      capabilities: isEn
        ? [
            "OAuth 2.0 PKCE Sync",
            "Curated Playlist Extraction",
            "Collaborative Library Bridge",
          ]
        : [
            "Koneksi OAuth 2.0 Aman",
            "Ekstraksi Playlist Kurasi",
            "Jembatan Koleksi Kolaboratif",
          ],
    },
    {
      id: "tidal",
      name: "Tidal",
      brandColor: "#00FFFF",
      status: "planned",
      category: isEn ? "Lossless Hi-Fi" : "Lossless Hi-Fi",
      summary: isEn
        ? "Preserve pristine Hi-Fi and master audio metadata for audiophiles demanding uncompromised sound fidelity."
        : "Migrasi audio lossless HiFi bagi pendengar yang mengutamakan kualitas audio beresolusi tinggi.",
      capabilities: isEn
        ? [
            "Hi-Res Metadata Preservation",
            "Master Audio Edition Matching",
            "Lossless Catalog Resolver",
          ]
        : [
            "Preservasi Metadata Hi-Res",
            "Pencocokan Edisi Master Audio",
            "Katalog Lossless Terpadu",
          ],
    },
    {
      id: "deezer",
      name: "Deezer",
      brandColor: "#A238FF",
      status: "planned",
      category: isEn ? "Global Catalog" : "Katalog Global",
      summary: isEn
        ? "Synchronize Deezer flow collections, custom playlists, and regional international releases."
        : "Sinkronisasi pustaka Deezer, koleksi Flow, dan pencocokan katalog FLAC global.",
      capabilities: isEn
        ? [
            "FLAC Quality Mapping",
            "Flow Playlist Migration",
            "Global Regional Catalog",
          ]
        : [
            "Pemetaan Kualitas FLAC",
            "Migrasi Playlist Flow",
            "Katalog Regional Global",
          ],
    },
    {
      id: "soundcloud",
      name: "SoundCloud",
      brandColor: "#FF5500",
      status: "planned",
      category: isEn ? "Indie & DJ Mixes" : "Indie & DJ Mix",
      summary: isEn
        ? "Bridge rare indie tracks, live DJ sets, bootleg remixes, and independent releases unavailable on commercial streaming."
        : "Menjembatani lagu indie unik, set DJ, bootleg remix, dan rilisan independen yang tidak tersedia di layanan komersial.",
      capabilities: isEn
        ? [
            "Live DJ Mix Support",
            "Independent Artist Matching",
            "Bootleg & Remix Resolver",
          ]
        : [
            "Dukungan Set DJ & Live Mix",
            "Pencocokan Rilisan Independen",
            "Deteksi Versi Remix & Bootleg",
          ],
    },
    {
      id: "subsonic",
      name: "Subsonic / Navidrome",
      brandColor: "#0080FF",
      status: "planned",
      category: isEn ? "Self-Hosted Music" : "Server Mandiri",
      summary: isEn
        ? "Bring streaming playlists directly into your personal home music server (Navidrome, Jellyfin, LMS) for true offline ownership."
        : "Bawa playlist streaming komersial langsung ke server musik pribadi di rumah Anda (Navidrome, LMS, atau Jellyfin).",
      capabilities: isEn
        ? [
            "Self-Hosted Server Sync",
            "True Offline Media Ownership",
            "Navidrome & Subsonic API",
          ]
        : [
            "Sinkronisasi Server Pribadi",
            "Kepemilikan Musik 100% Offline",
            "Dukungan Navidrome & Subsonic",
          ],
    },
  ];

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
              {isEn ? "Universal Platform Ecosystem" : "Matriks Platform & Integrasi"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary leading-tight">
            {t("landing.matrixHeading")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
            {t("landing.matrixSubheading")}
          </p>
        </div>
      </Reveal>

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {platforms.map((platform, idx) => {
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
                      {isActive ? t("landing.statusActive") : t("landing.statusComingSoon")}
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
                    {isEn ? "Capabilities" : "Kapabilitas"}
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

      {/* User-Centric Data Sovereignty Card (Clean, no technical jargon) */}
      <Reveal delay={200} className="mt-10">
        <SpotlightCard
          spotlightColor="rgba(105, 214, 175, 0.12)"
          className="p-6 sm:p-8 rounded-3xl bg-[#0E1218]/90 border border-white/[0.1] shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2 text-accent">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                  {isEn ? "True Library Ownership" : "Kepemilikan Musik Penuh"}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                {isEn ? "One Universal Standard. Zero Vendor Lock-in." : "Satu Standar Universal. Nol Keterikatan Vendor."}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                {isEn
                  ? "Your music curation shouldn't be locked inside closed ecosystems. TuneBridge maintains lossless song metadata and preserves curated track orders, allowing you to move freely between streaming platforms whenever you choose."
                  : "Daftar putar lagu yang telah Anda kurasi bertahun-tahun tidak boleh terkunci di satu layanan saja. TuneBridge menjaga metadata lagu secara utuh dan teratur, memberi Anda kebebasan berpindah platform kapan pun Anda inginkan."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto lg:min-w-[280px]">
              <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-white/[0.06]">
                <Shield className="w-4 h-4 text-emerald-400 mb-1.5" />
                <span className="text-xs font-semibold text-text-primary block">
                  {isEn ? "Private Local Vault" : "Vault Lokal Privat"}
                </span>
                <span className="text-[11px] text-text-muted">
                  {isEn ? "Zero cloud retention" : "Kredensial disimpan terenkripsi"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-elevated/60 border border-white/[0.06]">
                <RefreshCw className="w-4 h-4 text-accent mb-1.5" />
                <span className="text-xs font-semibold text-text-primary block">
                  {isEn ? "Precision Matcher" : "Pencocokan Cerdas"}
                </span>
                <span className="text-[11px] text-text-muted">
                  {isEn ? "Kanji, Hangul & Live editions" : "Akurasi judul & audio preview"}
                </span>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </Reveal>
    </section>
  );
};
