import React from "react";
import {
  Users,
  Smartphone,
  Database,
  Headphones,
  Check,
  Sparkles,
} from "lucide-react";

interface FeatureCard {
  icon: React.FC<{ className?: string }>;
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  detailPoints: string[];
}

const FEATURES: FeatureCard[] = [
  {
    icon: Users,
    tag: "Multi-Akun YouTube",
    tagColor: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
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
    tag: "Verifikasi Audio",
    tagColor: "border-rose-500/30 text-rose-400 bg-rose-500/10",
    title: "Audio Preview & Pembersih Duplikat Cerdas",
    description:
      "Sering kali lagu di YouTube adalah versi rekaman panggung atau cover yang berbeda dari rekaman studio. Sebelum diekspor ke Apple Music, dengarkan pratinjau audio 30 detik. Sistem juga mendeteksi judul serupa dan membuang lagu duplikat secara otomatis.",
    detailPoints: [
      "Pemutar audio mengambang dengan scrubber interaktif",
      "Pembersih duplikat otomatis saat menggabungkan banyak sumber",
      "Daftar alternatif lagu jika versi otomatis belum sesuai selera",
    ],
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section
      id="features-section"
      className="w-full py-16 md:py-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto text-left"
    >
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-white/[0.08] mb-4">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Solusi Nyata Tanpa Kompromi
          </span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary leading-tight">
          Dibangun untuk Penikmat Musik yang Memiliki Banyak Akun.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
          Kami memecahkan kerepotan nyata saat berpindah ekosistem: sesi akun yang tercecer, lagu
          ganda yang mengotori playlist, dan ketergantungan pada layanan cloud pihak ketiga.
        </p>
      </div>

      {/* Grid of 4 Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-[#12141A]/90 border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden"
            >
              {/* Subtle hover background highlight */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/10 transition-colors" />

              <div className="relative z-10">
                {/* Header Icon + Tag */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-white/[0.08] flex items-center justify-center text-accent shadow-sm group-hover:scale-105 transition-transform">
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
              <div className="pt-4 border-t border-white/[0.06] space-y-2 relative z-10">
                {feature.detailPoints.map((point, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2.5 text-xs text-text-muted">
                    <div className="w-4 h-4 rounded-full bg-status-success/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-status-success stroke-[2.5]" />
                    </div>
                    <span className="text-text-secondary">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
