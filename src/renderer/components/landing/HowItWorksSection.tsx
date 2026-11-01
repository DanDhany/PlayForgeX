import React, { useState } from "react";
import { Link2, Sparkles, CheckCircle2 } from "lucide-react";
import { Reveal } from "./Reveal";

interface StepData {
  number: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  tag: string;
  preview: {
    title: string;
    description: string;
    items: { label: string; value: string; badge?: string }[];
    codeSnippet?: string;
  };
}

const STEPS: StepData[] = [
  {
    number: "01",
    title: "Hubungkan Sumber Musik",
    subtitle:
      "Sambungkan akun YouTube Music (kantor, pribadi, atau teman) dan Apple Music tanpa biaya developer $99/tahun.",
    icon: Link2,
    tag: "Multi-Akun Instan",
    preview: {
      title: "Koneksi Akun Aktif",
      description: "2 Akun YouTube Music + 1 Akun Apple Music terhubung di database lokal",
      items: [
        { label: "Akun 1", value: "YouTube Kantor (32 Playlist)", badge: "Aktif" },
        { label: "Akun 2", value: "YouTube Pribadi (45 Playlist)", badge: "Aktif" },
        { label: "Tujuan", value: "Apple Music Pribadi", badge: "Siap Tulis" },
      ],
      codeSnippet: "mysql> SELECT id, platform, label FROM accounts WHERE is_active = 1;\n+-------------------+----------+--------------------------+\n| id                | platform | label                    |\n| acc_ytm_kantor    | youtube  | YouTube Kantor           |\n| acc_ytm_pribadi   | youtube  | YouTube Pribadi          |\n| acc_apple_primary | apple    | Apple Music Pribadi      |\n+-------------------+----------+--------------------------+",
    },
  },
  {
    number: "02",
    title: "Pembersihan & Pencocokan Cerdas",
    subtitle:
      "Algoritma TuneBridge membuang noise judul video ('Official 4K', 'Lyrics') dan menggabungkan lagu duplikat.",
    icon: Sparkles,
    tag: "Title-Priority Matcher",
    preview: {
      title: "Hasil Deduplikasi Real-Time",
      description: "3 Playlist sumber digabung • 68 Lagu total disaring menjadi 54 Lagu unik",
      items: [
        { label: "Sheila On 7 — Dan", value: "Ditemukan di 2 playlist", badge: "Duplikat Digabung" },
        { label: "Dewa 19 — Kangen", value: "Judul 'Official Remastered' dibersihkan", badge: "Judul Asli" },
        { label: "Tulus — Hati-Hati di Jalan", value: "Cocok 100% di Apple Music Catalog", badge: "Exact Match" },
      ],
      codeSnippet: "[Matcher] Sanitized: 'Sheila On 7 - Dan (Official 4K Video)' -> 'Dan'\n[Matcher] Candidate: Apple Music id=1440842823 (Confidence: 99.4%)\n[Deduplicator] Found duplicate across 'Focus Session' and 'Roadtrip Mix'. Merged.",
    },
  },
  {
    number: "03",
    title: "Review & Sinkronisasi Utuh",
    subtitle:
      "Dengarkan pratinjau audio 30 detik untuk verifikasi sebelum playlist ditulis langsung ke library Apple Music Anda.",
    icon: CheckCircle2,
    tag: "Verifikasi Audio Langsung",
    preview: {
      title: "Library Apple Music Diperbarui",
      description: "Playlist berhasil dibuat di akun Apple Music Anda secara utuh",
      items: [
        { label: "Status Eksekusi", value: "Selesai 100%", badge: "Sukses" },
        { label: "Lagu Berhasil", value: "54 dari 54 lagu cocok", badge: "100%" },
        { label: "Penyimpanan", value: "Tersimpan di MySQL Host", badge: "Persisten" },
      ],
      codeSnippet: "[AppleClient] POST /v1/me/library/playlists\n[AppleClient] Created: 'Nusantara Essentials (Merged)'\n[AppleClient] Appended 54 tracks via batch queue.\n[AuditLog] Session recorded to MySQL table 'activity_logs'.",
    },
  },
];

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const current = STEPS[activeStep];

  return (
    <section id="how-it-works" className="w-full py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs font-semibold text-accent mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alur Kerja Tiga Langkah</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary max-w-2xl leading-tight">
            Bagaimana TuneBridge Menyatukan Musik Anda.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary max-w-xl">
            Dari multi-akun yang terpisah hingga menjadi satu playlist rapi di Apple Music tanpa perantara cloud.
          </p>
        </div>
      </Reveal>

      {/* Step Selector & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Step Buttons List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <Reveal key={step.number} delay={idx * 100}>
                <button
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 btn-press relative overflow-hidden ${
                    isActive
                      ? "bg-surface-elevated border-accent/40 shadow-xl shadow-accent/10 ring-1 ring-accent/30"
                      : "bg-[#12141A]/50 border-white/[0.06] hover:bg-surface-elevated/80 hover:border-white/[0.12]"
                  }`}
                >
                  {/* Active highlight glow bar */}
                  {isActive && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-accent to-status-success rounded-l-full" />
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? "bg-accent text-background font-bold shadow-md shadow-accent/20"
                          : "bg-surface-elevated border border-white/[0.08] text-text-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-semibold text-accent">
                          LANGKAH {step.number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-text-secondary border border-white/[0.06]">
                          {step.tag}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-text-primary tracking-tight">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* Live Step Visualizer (7 cols) */}
        <div className="lg:col-span-7">
          <Reveal delay={200} direction="none">
            <div className="rounded-2xl border border-white/[0.1] bg-[#0E1015]/95 p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              {/* Top Bar of the window */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-text-secondary/80">
                    tunebridge-engine // {current.tag.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                  Langkah {current.number} dari 03
                </span>
              </div>

              {/* Step Title & Details */}
              <div className="mb-5">
                <h4 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
                  <span>{current.preview.title}</span>
                </h4>
                <p className="text-xs text-text-secondary mt-1">
                  {current.preview.description}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 mb-5">
                {current.preview.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/70 border border-white/[0.06] text-xs transition-colors hover:border-white/[0.12]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="font-medium text-text-primary truncate">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-text-secondary text-[11px] hidden sm:inline">
                        {item.value}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-accent/15 text-accent border border-accent/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Code Snippet terminal view */}
              {current.preview.codeSnippet && (
                <div className="rounded-xl bg-[#08090C] border border-white/[0.06] p-3.5 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {current.preview.codeSnippet}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
