import React from "react";
import {
  Users,
  Smartphone,
  Shield,
  Headphones,
  Check,
  Sparkles,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { SpotlightCard } from "./SpotlightCard";
import { SanitizerPlayground } from "./SanitizerPlayground";
import { useLanguage } from "../../context/LanguageContext";

export const FeaturesSection: React.FC = () => {
  const { lang } = useLanguage();

  const isEn = lang === "en";

  const features = [
    {
      icon: Users,
      tag: isEn ? "Multi-Account Sync" : "Multi-Akun YouTube",
      tagColor: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
      spotlightColor: "rgba(99, 102, 241, 0.14)",
      title: isEn ? "Unlimited Multi-Account Bridge" : "Multi-Akun Tanpa Batas",
      description: isEn
        ? "Many of us have separate accounts for work focus playlists, personal nostalgic tracks, and collaborative links from friends. In PlayForgeX, connect them all concurrently and merge into one unified library without constantly switching logins."
        : "Banyak dari kita memiliki akun kantor untuk mendengarkan lagu fokus, akun pribadi berisi lagu nostalgia, dan tautan playlist dari teman. Di PlayForgeX, Anda dapat menghubungkan semuanya sekaligus dan meleburkannya ke satu playlist tanpa repot beralih akun.",
      detailPoints: isEn
        ? [
            "Store multiple YouTube Music account sessions side-by-side",
            "Select and merge multiple playlists concurrently",
            "Assign custom nicknames to easily recognize each library",
          ]
        : [
            "Simpan banyak sesi akun YouTube Music secara berdampingan",
            "Pilih beberapa playlist sekaligus untuk digabungkan (Merge)",
            "Beri alias nama akun khusus agar mudah dikenali",
          ],
    },
    {
      icon: Smartphone,
      tag: isEn ? "Mobile Native Sync" : "Akses Mobile",
      tagColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
      spotlightColor: "rgba(16, 185, 129, 0.14)",
      title: isEn ? "One-Touch Phone Bookmarklet" : "Sinkronisasi Mudah via Ponsel",
      description: isEn
        ? "No typing complex cookie strings or manually copying tokens. Open PlayForgeX from Safari on iPhone or Chrome on Android, tap the one-touch bookmarklet, and your account securely connects in seconds."
        : "Anda tidak perlu menyalin token secara manual. Buka antarmuka PlayForgeX dari Safari atau Chrome di smartphone, gunakan bookmarklet satu sentuhan, dan sesi akun langsung terhubung dalam hitungan detik.",
      detailPoints: isEn
        ? [
            "Touch-optimized, fluid mobile interface with native iOS feel",
            "One-tap bookmarklet securely imports active sessions",
            "Instant snapshot playlist import without permanent credentials",
          ]
        : [
            "Antarmuka responsif ramah layar sentuh dan ponsel pintar",
            "Alur bookmarklet otomatis mengekstrak sesi yang dibutuhkan",
            "Mendukung impor snapshot playlist cepat tanpa otentikasi permanen",
          ],
    },
    {
      icon: Shield,
      tag: isEn ? "Encrypted Local Storage" : "Penyimpanan Aman",
      tagColor: "border-amber-500/30 text-amber-400 bg-amber-500/10",
      spotlightColor: "rgba(245, 158, 11, 0.14)",
      title: isEn ? "100% Private Local Vault" : "Vault Penyimpanan Lokal Mandiri",
      description: isEn
        ? "Session credentials, migration logs, and match caches are encrypted strictly inside your local private vault. When you close the app or restart your computer, your data stays intact and fully under your ownership."
        : "Kredensial sesi, log riwayat migrasi, dan cache pencocokan lagu disimpan di vault lokal mandiri komputer Anda. Ketika aplikasi ditutup atau komputer dimatikan, semua data Anda tetap utuh di penyimpanan pribadi.",
      detailPoints: isEn
        ? [
            "Isolated local data storage with zero cloud retention",
            "Cryptographically secure multi-user authentication",
            "Comprehensive audit history available anytime offline",
          ]
        : [
            "Penyimpanan lokal terisolasi tanpa tracking cloud pihak ketiga",
            "Otentikasi pengguna terenkripsi aman secara mandiri",
            "Riwayat transfer lengkap dapat ditinjau kapan saja",
          ],
    },
    {
      icon: Headphones,
      tag: isEn ? "Audio Fidelity" : "Presisi Suara",
      tagColor: "border-rose-500/30 text-rose-400 bg-rose-500/10",
      spotlightColor: "rgba(250, 45, 72, 0.14)",
      title: isEn ? "Audio Preview & Smart Deduplication" : "Audio Preview & Pembersih Duplikat",
      description: isEn
        ? "Never worry about migrating the wrong low-quality remix or acoustic cover. PlayForgeX includes a built-in 30-second audio preview player to audition matches directly, paired with an intelligent deduplicator to keep your library lean."
        : "Tak perlu takut salah mentransfer lagu cover atau remix aneh. PlayForgeX dilengkapi pemutar pratinjau audio 30 detik untuk mendengarkan langsung kecocokan lagu, ditambah pembersih duplikat cerdas yang menjaga ukuran playlist Anda tetap ramping.",
      detailPoints: isEn
        ? [
            "Listen to real-time audio clips before confirming transfer",
            "Automatic cleaning of messy titles ('Official Video 4K', etc.)",
            "Multi-playlist duplicate detection to prevent duplicate tracks",
          ]
        : [
            "Dengarkan cuplikan audio sebelum transfer disetujui",
            "Pembersihan otomatis judul berantakan ('Official Video 4K', dsb)",
            "Deteksi kesamaan lagu antar-playlist untuk mencegah file ganda",
          ],
    },
  ];

  return (
    <section
      id="features-section"
      className="w-full py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <Reveal>
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-white/[0.08] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {isEn ? "Precision & Craft" : "Solusi Nyata Tanpa Kompromi"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary leading-tight">
            {isEn
              ? "Built for True Music Collectors with Multiple Accounts."
              : "Dibangun untuk Penikmat Musik yang Memiliki Banyak Akun."}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
            {isEn
              ? "Move playlists across ecosystems with zero tracking, lossless precision matching, and complete data sovereignty."
              : "Solusi mandiri untuk memindahkan playlist antar-ekosistem musik tanpa tracking cloud, tanpa batas kuota, dan sepenuhnya di bawah kendali Anda."}
          </p>
        </div>
      </Reveal>

      {/* Interactive Title Sanitizer Playground */}
      <Reveal delay={200} className="mb-14">
        <SanitizerPlayground />
      </Reveal>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Reveal key={feature.title} delay={idx * 120}>
              <SpotlightCard
                className="p-6 sm:p-8 rounded-2xl flex flex-col justify-between h-full bg-[#12141A] border border-white/[0.08] hover:border-white/[0.18] transition-all group"
                spotlightColor={feature.spotlightColor}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={`text-xs px-3 py-1 rounded-full border font-semibold ${feature.tagColor}`}
                    >
                      {feature.tag}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/[0.08] flex items-center justify-center text-text-secondary group-hover:text-text-primary group-hover:border-white/[0.2] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary tracking-tight group-hover:text-accent transition-colors">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2">
                  {feature.detailPoints.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-2.5 text-xs text-text-secondary"
                    >
                      <div className="w-4 h-4 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};
