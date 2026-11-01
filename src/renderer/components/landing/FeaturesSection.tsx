import React from "react";
import {
  Users,
  Smartphone,
  Database,
  Headphones,
  Check,
  Sparkles,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { SpotlightCard } from "./SpotlightCard";

interface FeatureCard {
  icon: React.FC<{ className?: string }>;
  tag: string;
  tagColor: string;
  spotlightColor: string;
  title: string;
  description: string;
  detailPoints: string[];
}

const FEATURES: FeatureCard[] = [
  {
    icon: Users,
    tag: "Multi-Akun YouTube",
    tagColor: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
    spotlightColor: "rgba(99, 102, 241, 0.14)",
    title: "Multi-Akun Tanpa Batas",
    description:
      "Banyak dari kita memiliki akun Google kantor untuk mendengarkan lagu fokus, akun pribadi berisi lagu nostalgia tahun 2000-an, dan tautan playlist dari teman. Di TuneBridge, Anda dapat menghubungkan semuanya sekaligus dan meleburkannya ke satu playlist Apple Music tanpa repot beralih akun.",
    detailPoints: [
      "Simpan banyak sesi akun YouTube Music secara berdampingan",
      "Pilih beberapa playlist sekaligus untuk digabungkan (Merge)",
      "Beri alias nama akun khusus agar mudah dikenali",
    ],
  },
  {
    icon: Smartphone,
    tag: "Akses Mobile",
    tagColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    spotlightColor: "rgba(16, 185, 129, 0.14)",
    title: "Input Mudah via HP (Tanpa Terminal)",
    description:
      "Anda tidak perlu membuka terminal SSH atau shell Docker setiap kali ingin menambahkan akun baru. Buka antarmuka TuneBridge dari Safari atau Chrome di smartphone, gunakan bookmarklet satu sentuhan, dan sesi akun langsung terhubung dalam hitungan detik.",
    detailPoints: [
      "Antarmuka responsif ramah layar sentuh dan ponsel pintar",
      "Alur bookmarklet otomatis mengekstrak cookie sesi yang dibutuhkan",
      "Mendukung impor snapshot playlist cepat tanpa otentikasi permanen",
    ],
  },
  {
    icon: Database,
    tag: "Penyimpanan Andal",
    tagColor: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    spotlightColor: "rgba(245, 158, 11, 0.14)",
    title: "Database Persisten MySQL",
    description:
      "Kredensial sesi, log riwayat migrasi, dan cache pencocokan lagu disimpan di database MySQL lokal Anda. Ketika kontainer direstart atau laptop dimatikan, semua data Anda tetap utuh di volume penyimpanan mandiri.",
    detailPoints: [
      "Penyimpanan database relasional dengan skema terstruktur",
      "Otentikasi pengguna berbasis scrypt terenkripsi aman",
      "Riwayat transfer lengkap dapat ditinjau kapan saja",
    ],
  },
  {
    icon: Headphones,
    tag: "Presisi Suara",
    tagColor: "border-rose-500/30 text-rose-400 bg-rose-500/10",
    spotlightColor: "rgba(250, 45, 72, 0.14)",
    title: "Audio Preview & Pembersih Duplikat",
    description:
      "Tak perlu takut salah mentransfer lagu cover atau remix aneh. TuneBridge dilengkapi pemutar pratinjau audio 30 detik untuk mendengarkan langsung kecocokan lagu, ditambah pembersih duplikat cerdas yang menjaga ukuran playlist Anda tetap ramping.",
    detailPoints: [
      "Dengarkan cuplikan audio sebelum transfer disetujui",
      "Pembersihan otomatis judul berantakan ('Official Video 4K', dsb)",
      "Deteksi kesamaan lagu antar-playlist untuk mencegah file ganda",
    ],
  },
];

export const FeaturesSection: React.FC = () => {
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
              Solusi Nyata Tanpa Kompromi
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary leading-tight">
            Dibangun untuk Penikmat Musik yang Memiliki Banyak Akun.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
            Kami memecahkan kerepotan nyata saat berpindah ekosistem: sesi akun yang tercecer, lagu
            ganda yang mengotori playlist, dan ketergantungan pada layanan cloud pihak ketiga.
          </p>
        </div>
      </Reveal>

      {/* Grid of 4 Feature Pillars with Spotlight Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Reveal key={idx} delay={idx * 80}>
              <SpotlightCard
                spotlightColor={feature.spotlightColor}
                className="h-full flex flex-col justify-between group"
              >
                <div>
                  {/* Header Icon + Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-white/[0.08] flex items-center justify-center text-accent shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${feature.tagColor}`}
                    >
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight mb-2.5">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                {/* Bullet checklist */}
                <div className="pt-4 border-t border-white/[0.06] space-y-2">
                  {feature.detailPoints.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs text-text-muted">
                      <div className="w-4 h-4 rounded-full bg-status-success/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-status-success stroke-[2.5]" />
                      </div>
                      <span className="text-text-secondary">{point}</span>
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
