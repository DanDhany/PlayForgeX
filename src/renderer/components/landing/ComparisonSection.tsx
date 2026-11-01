import React from "react";
import { XCircle, CheckCircle2, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "./Reveal";
import { SpotlightCard } from "./SpotlightCard";
import { useLanguage } from "../../context/LanguageContext";

export const ComparisonSection: React.FC = () => {
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  const comparisons = [
    {
      problem: isEn
        ? "Third-party cloud services store your sensitive streaming credentials on remote servers."
        : "Kredensial dan sesi akun streaming dikirim dan disimpan ke server pihak ketiga di cloud.",
      solution: isEn
        ? "100% Private & Self-Hosted. Credentials and session tokens never leave your personal computer."
        : "100% Mandiri & Privat. Kredensial dan token hanya tersimpan di penyimpanan lokal komputer Anda.",
    },
    {
      problem: isEn
        ? "Expensive recurring monthly subscriptions or strict 500-track limits on free tiers."
        : "Biaya langganan bulanan mahal atau dibatasi transfer kuota 500 lagu saja.",
      solution: isEn
        ? "Free and open-source forever. Transfer tens of thousands of tracks with zero quotas or paywalls."
        : "Bebas biaya selamanya. Pindahkan puluhan ribu lagu tanpa kuota atau batasan akun berbayar.",
    },
    {
      problem: isEn
        ? "Song titles cluttered with junk strings like 'Official 4K Music Video [Lyrics] HD'."
        : "Judul lagu rusak oleh embel-embel 'Official 4K Music Video [Lyrics] HD'.",
      solution: isEn
        ? "Smart Title-Priority sanitizer strips video noise and matches original studio recording metadata."
        : "Filter cerdas TuneBridge otomatis membersihkan judul video dan memprioritaskan metadata lagu asli.",
    },
    {
      problem: isEn
        ? "Identical songs across multiple source playlists accumulate into redundant duplicates in your library."
        : "Lagu yang sama dari beberapa akun YouTube Music menumpuk jadi duplikat di Apple Music.",
      solution: isEn
        ? "Multi-source deduplication engine detects cross-account overlap and unifies them into clean master playlists."
        : "Mesin deduplikasi otomatis mendeteksi kesamaan lintas akun dan menggabungkannya jadi satu.",
    },
    {
      problem: isEn
        ? "Forced to purchase Apple Developer subscriptions ($99/yr) just to get personal API tokens."
        : "Wajib membayar Apple Developer Program $99/tahun untuk membuat token integrasi.",
      solution: isEn
        ? "Seamless standard web session integration without requiring any paid developer membership."
        : "Memanfaatkan token sesi web resmi tanpa perlu registrasi akun developer berbayar.",
    },
    {
      problem: isEn
        ? "Blind transfers without previewing audio, risking accidental acoustic cover or live mismatches."
        : "Tidak bisa mendengarkan lagu sebelum ditransfer, sehingga salah versi lagu tidak ketahuan.",
      solution: isEn
        ? "Built-in 30-second audio preview player to audition matches before committing to library export."
        : "Pemutar pratinjau audio 30 detik bawaan untuk mendengarkan cuplikan sebelum komit transfer.",
    },
  ];

  return (
    <section id="comparison-section" className="w-full py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/10 border border-status-success/25 text-xs font-semibold text-status-success mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>{isEn ? "Direct Comparison" : "Perbandingan Nyata"}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary max-w-2xl leading-tight">
            {t("landing.compHeading")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-xl">
            {t("landing.compSubheading")}
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
                    {isEn ? "Traditional Cloud Tools" : "Alat Pihak Ketiga & Cloud Biasa"}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {isEn ? "Privacy risks, track limits, and monthly recurring fees" : "Risiko privasi dan biaya berulang"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {comparisons.map((item, idx) => (
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
              {isEn ? "Status: Monthly subscription • Data stored on external cloud" : "Status: Berlangganan bulanan • Data disimpan di cloud orang lain"}
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
                      {isEn ? "RECOMMENDED" : "REKOMENDASI"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {isEn ? "Complete privacy and ownership in your hands" : "Privasi total di tangan Anda sendiri"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {comparisons.map((item, idx) => (
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
              <span>{isEn ? "Status: Open Source • Encrypted Local Vault • Free Forever" : "Status: Open Source • Vault Lokal Privat • Bebas Biaya"}</span>
              <span className="text-[10px] bg-status-success/15 px-2 py-0.5 rounded">v1.2</span>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
};
