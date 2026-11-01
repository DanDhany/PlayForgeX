import React from "react";
import { XCircle, CheckCircle2, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "./Reveal";
import { SpotlightCard } from "./SpotlightCard";

interface ComparisonPoint {
  problem: string;
  solution: string;
}

const COMPARISONS: ComparisonPoint[] = [
  {
    problem: "Kredensial dan cookie YouTube/Apple dikirim ke server pihak ketiga di cloud.",
    solution: "100% Self-Hosted. Kredensial dan token hanya tersimpan di MySQL komputer Anda sendiri.",
  },
  {
    problem: "Biaya langganan bulanan mahal atau dibatasi transfer 500 lagu saja.",
    solution: "Bebas biaya selamanya (Open Source). Pindahkan ribuan lagu tanpa kuota atau batasan akun.",
  },
  {
    problem: "Judul lagu rusak oleh embel-embel 'Official 4K Music Video [Lyrics] HD'.",
    solution: "Filter cerdas TuneBridge otomatis membersihkan judul video dan memprioritaskan metadata lagu asli.",
  },
  {
    problem: "Lagu yang sama dari beberapa akun YouTube Music menumpuk jadi duplikat di Apple Music.",
    solution: "Mesin deduplikasi otomatis mendeteksi kesamaan lintas akun dan menggabungkannya jadi satu.",
  },
  {
    problem: "Wajib membayar Apple Developer Program $99/tahun untuk membuat token integrasi.",
    solution: "Memanfaatkan token sesi web resmi tanpa perlu registrasi akun developer berbayar.",
  },
  {
    problem: "Tidak bisa mendengarkan lagu sebelum ditransfer, sehingga salah lagu tidak ketahuan.",
    solution: "Pemutar pratinjau audio 30 detik bawaan untuk mendengarkan cuplikan sebelum komit transfer.",
  },
];

export const ComparisonSection: React.FC = () => {
  return (
    <section className="w-full py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/10 border border-status-success/25 text-xs font-semibold text-status-success mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Perbandingan Nyata</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary max-w-2xl leading-tight">
            Mengapa Memilih TuneBridge?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-xl">
            Solusi lokal yang membebaskan Anda dari langganan berbayar dan kebocoran privasi cloud.
          </p>
        </div>
      </Reveal>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Left: Traditional Cloud Tools */}
        <Reveal direction="left" delay={100}>
          <div className="rounded-2xl border border-red-500/20 bg-[#120E10]/80 p-6 sm:p-8 backdrop-blur-xl h-full flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Alat Pihak Ketiga &amp; Cloud Biasa
                  </h3>
                  <p className="text-xs text-text-muted">Risiko privasi dan biaya berulang</p>
                </div>
              </div>

              <div className="space-y-4">
                {COMPARISONS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {item.problem}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.06] text-[11px] text-red-400/80 font-mono">
              Status: Berlangganan bulanan • Data disimpan di cloud orang lain
            </div>
          </div>
        </Reveal>

        {/* Right: TuneBridge Self-Hosted */}
        <Reveal direction="right" delay={200}>
          <SpotlightCard
            spotlightColor="rgba(105, 214, 175, 0.16)"
            className="border-status-success/30 bg-[#0E1513]/90 p-6 sm:p-8 h-full flex flex-col justify-between shadow-2xl ring-1 ring-status-success/20"
          >
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-primary">
                      TuneBridge (Self-Hosted)
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-success/20 text-status-success border border-status-success/30 font-semibold">
                      REKOMENDASI
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">Privasi total di tangan Anda sendiri</p>
                </div>
              </div>

              <div className="space-y-4">
                {COMPARISONS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-text-primary font-medium leading-relaxed">
                      {item.solution}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.06] text-[11px] text-status-success font-mono flex items-center justify-between">
              <span>Status: Open Source • MySQL Lokal • Bebas Biaya</span>
              <span className="text-[10px] bg-status-success/15 px-2 py-0.5 rounded">v1.2</span>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
};
