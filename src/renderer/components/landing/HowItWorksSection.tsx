import React, { useState } from "react";
import { Link2, Sparkles, CheckCircle2, Terminal } from "lucide-react";
import { Reveal } from "./Reveal";
import { useLanguage } from "../../context/LanguageContext";

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { lang } = useLanguage();
  const isEn = lang === "en";

  const steps = [
    {
      number: "01",
      title: isEn ? "Connect Your Music Sources" : "Hubungkan Sumber Musik",
      subtitle: isEn
        ? "Link your YouTube Music accounts (work, personal, or collaborative links) and destination Apple Music with one-touch mobile or browser sync."
        : "Sambungkan akun YouTube Music (kantor, pribadi, atau teman) dan Apple Music dengan sinkronisasi satu sentuhan yang aman.",
      icon: Link2,
      tag: isEn ? "Instant Multi-Account" : "Multi-Akun Instan",
      preview: {
        title: isEn ? "Active Account Connections" : "Koneksi Akun Aktif",
        description: isEn
          ? "2 YouTube Music accounts + 1 Apple Music account connected in private vault"
          : "2 Akun YouTube Music + 1 Akun Apple Music terhubung di vault lokal",
        items: [
          { label: isEn ? "Account 1" : "Akun 1", value: isEn ? "Work Focus (32 Playlists)" : "YouTube Kantor (32 Playlist)", badge: isEn ? "Active" : "Aktif" },
          { label: isEn ? "Account 2" : "Akun 2", value: isEn ? "Personal Library (45 Playlists)" : "YouTube Pribadi (45 Playlist)", badge: isEn ? "Active" : "Aktif" },
          { label: isEn ? "Destination" : "Tujuan", value: isEn ? "Primary Apple Music" : "Apple Music Pribadi", badge: isEn ? "Ready" : "Siap Tulis" },
        ],
        codeSnippet: `[TuneBridge] Initialized multi-account bridge session
[Account: YTM Office] Connected • 32 Playlists indexed
[Account: YTM Personal] Connected • 45 Playlists indexed
[Target: Apple Music] Authenticated • Ready for lossless export`,
      },
    },
    {
      number: "02",
      title: isEn ? "Smart Sanitization & Deep Matching" : "Pembersihan & Pencocokan Cerdas",
      subtitle: isEn
        ? "TuneBridge's engine strips video noise ('Official 4K', 'Lyrics', remux tags) and harmonizes duplicates while preserving authentic live/remix editions."
        : "Algoritma TuneBridge membuang noise judul video ('Official 4K', 'Lyrics') dan menggabungkan lagu duplikat tanpa menghilangkan versi live orisinal.",
      icon: Sparkles,
      tag: isEn ? "Title-Priority Matcher" : "Title-Priority Matcher",
      preview: {
        title: isEn ? "Real-Time Deduplication Result" : "Hasil Deduplikasi Real-Time",
        description: isEn
          ? "3 Source playlists merged • 68 Total tracks curated to 54 unique songs"
          : "3 Playlist sumber digabung • 68 Lagu total disaring menjadi 54 Lagu unik",
        items: [
          { label: "Sheila On 7 — Dan", value: isEn ? "Found in 2 playlists" : "Ditemukan di 2 playlist", badge: isEn ? "Merged" : "Duplikat Digabung" },
          { label: "Dewa 19 — Kangen", value: isEn ? "'Official Remastered' cleaned" : "Judul 'Official Remastered' dibersihkan", badge: isEn ? "Original Title" : "Judul Asli" },
          { label: "Tulus — Hati-Hati di Jalan", value: isEn ? "100% matched to Apple Music catalog" : "Cocok 100% di Apple Music Catalog", badge: "Exact Match" },
        ],
        codeSnippet: `[Matcher] Sanitized: 'Sheila On 7 - Dan (Official 4K Video)' -> 'Dan'
[Matcher] Catalog Match: Apple Music id=1440842823 (Confidence: 99.4%)
[Deduplicator] Found duplicate across 'Focus Session' and 'Roadtrip Mix'. Merged.`,
      },
    },
    {
      number: "03",
      title: isEn ? "Audition & Seamless Library Export" : "Review & Sinkronisasi Utuh",
      subtitle: isEn
        ? "Listen to 30-second audio previews to verify any edge-case track before writing directly to your destination library."
        : "Dengarkan pratinjau audio 30 detik untuk verifikasi sebelum playlist ditulis langsung ke library Apple Music Anda.",
      icon: CheckCircle2,
      tag: isEn ? "Live Audio Verification" : "Verifikasi Audio Langsung",
      preview: {
        title: isEn ? "Apple Music Library Updated" : "Library Apple Music Diperbarui",
        description: isEn
          ? "Playlist created in your personal Apple Music library with full order intact"
          : "Playlist berhasil dibuat di akun Apple Music Anda secara utuh",
        items: [
          { label: isEn ? "Status" : "Status Eksekusi", value: isEn ? "100% Complete" : "Selesai 100%", badge: isEn ? "Success" : "Sukses" },
          { label: isEn ? "Matched Tracks" : "Lagu Berhasil", value: isEn ? "54 of 54 tracks synced" : "54 dari 54 lagu cocok", badge: "100%" },
          { label: isEn ? "Data Storage" : "Penyimpanan", value: isEn ? "Encrypted Local Vault" : "Vault Lokal Terenkripsi", badge: isEn ? "Private" : "Persisten" },
        ],
        codeSnippet: `[ExportEngine] Initializing playlist: 'Nusantara Essentials (Merged)'
[ExportEngine] Batch queued 54 tracks with lossless metadata.
[AuditLog] Session completed with 100% fidelity. Recorded to private audit vault.`,
      },
    },
  ];

  const current = steps[activeStep];

  return (
    <section id="how-it-works" className="w-full py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs font-semibold text-accent mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? "Three-Step Workflow" : "Alur Kerja Tiga Langkah"}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary max-w-2xl leading-tight">
            {isEn ? "How TuneBridge Unifies Your Music." : "Bagaimana TuneBridge Menyatukan Musik Anda."}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-text-secondary max-w-xl">
            {isEn
              ? "From multi-account discovery to precision catalog matching, experience friction-free library synchronization."
              : "Dari deteksi multi-akun hingga pencocokan katalog berkecepatan tinggi, rasakan proses migrasi musik yang mudah dan transparan."}
          </p>
        </div>
      </Reveal>

      {/* Interactive 3-Step Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3 Step Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            const Icon = s.icon;
            return (
              <Reveal key={s.number} delay={idx * 100}>
                <div
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 sm:p-6 rounded-2xl border cursor-pointer transition-all ${
                    isActive
                      ? "bg-surface-elevated/90 border-accent/50 shadow-xl shadow-accent/5 translate-x-1"
                      : "bg-[#12141A]/60 border-white/[0.06] hover:border-white/[0.15] hover:bg-[#12141A]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-mono font-bold text-accent">STEP {s.number}</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-white/[0.08] text-text-muted font-medium">
                      {s.tag}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isActive ? "bg-accent text-background" : "bg-white/[0.05] text-text-secondary"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                        {s.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Right Column: Live Interactive Preview Terminal */}
        <div className="lg:col-span-7">
          <Reveal delay={200}>
            <div className="rounded-2xl bg-[#0F1117] border border-white/[0.1] shadow-2xl overflow-hidden">
              {/* Window Header */}
              <div className="h-11 px-4 bg-surface-elevated/60 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-text-muted">
                    tunebridge://workflow/step-{current.number}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono">
                  <Terminal className="w-3.5 h-3.5 text-accent" />
                  <span>{current.tag}</span>
                </div>
              </div>

              {/* Window Content */}
              <div className="p-5 sm:p-7 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base sm:text-lg font-bold text-text-primary">
                      {current.preview.title}
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/25 font-semibold">
                      Verified
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {current.preview.description}
                  </p>
                </div>

                {/* Structured UI Cards */}
                <div className="space-y-2.5">
                  {current.preview.items.map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-xl bg-surface/80 border border-white/[0.06] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <span className="text-text-muted block text-[11px]">{item.label}</span>
                        <span className="text-text-primary font-medium truncate block">{item.value}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/15 text-accent border border-accent/25 flex-shrink-0">
                        {item.badge}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live Console Output Box */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs text-text-secondary space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2 flex items-center justify-between">
                    <span>{isEn ? "Audit Engine Log" : "Log Audit Mesin"}</span>
                    <span className="text-emerald-400">● 100% Synced</span>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400/90 text-[11px] overflow-x-auto">
                    {current.preview.codeSnippet}
                  </pre>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
