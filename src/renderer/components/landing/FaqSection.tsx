import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export const FaqSection: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  const faqData = [
    {
      question: isEn
        ? "How does TuneBridge transfer playlists between YouTube Music and Apple Music?"
        : "Bagaimana TuneBridge memindahkan playlist dari YouTube Music ke Apple Music?",
      answer: isEn
        ? "TuneBridge fetches track listings from your source YouTube Music playlists, sanitizes video noise (such as 'Official 4K', 'Lyrics', or remux tags), and matches them to official Apple Music catalog releases. You can audit matches and listen to 30-second audio previews before confirming."
        : "TuneBridge mengambil daftar lagu dari playlist YouTube Music Anda, lalu mencocokkannya ke katalog Apple Music menggunakan algoritma pencarian cerdas dengan prioritas judul asli dan filter kata kunci non-musik. Anda dapat mereview dan mendengarkan preview sebelum transfer disetujui.",
    },
    {
      question: isEn
        ? "Do I need a paid Apple Developer subscription?"
        : "Apakah saya perlu akun Apple Developer yang berbayar?",
      answer: isEn
        ? "No. TuneBridge connects through standard authenticated browser sessions (music.apple.com), completely removing the need to register for an Apple Developer subscription ($99/year)."
        : "Tidak. TuneBridge menggunakan token autentikasi web resmi yang dihasilkan saat Anda login di browser (music.apple.com), sehingga tidak memerlukan pendaftaran akun Apple Developer seharga $99/tahun.",
    },
    {
      question: isEn
        ? "Can I connect multiple accounts and merge their playlists?"
        : "Apakah saya bisa menghubungkan beberapa akun YouTube Music sekaligus?",
      answer: isEn
        ? "Yes. Connect work, personal, and friends' accounts concurrently. TuneBridge's deduplication engine automatically detects duplicate recordings across playlists while preserving authentic live and remix versions."
        : "Ya. Anda bisa menghubungkan akun pribadi, akun kantor, atau akun kiriman teman secara bersamaan. TuneBridge menggabungkan lagu dan membersihkan duplikat secara otomatis.",
    },
    {
      question: isEn
        ? "Where are my accounts, tokens, and playlists stored?"
        : "Di mana data akun, token, dan playlist saya disimpan?",
      answer: isEn
        ? "All credentials and playlists are encrypted strictly inside your private local storage vault on your own computer. TuneBridge operates with zero cloud tracking and zero remote telemetry."
        : "Semua data tersimpan aman di komputer lokal Anda menggunakan vault terenkripsi pribadi. TuneBridge adalah aplikasi mandiri tanpa tracking pihak ketiga atau server perantara di cloud.",
    },
    {
      question: isEn
        ? "How do I connect accounts directly from my phone (iPhone or Android)?"
        : "Bagaimana cara menghubungkan akun dari browser HP (iPhone / Android)?",
      answer: isEn
        ? "Simply open your local TuneBridge address in mobile Safari or Chrome over your home Wi-Fi, then tap the one-touch bookmarklet to securely link your accounts without typing raw cookies."
        : "Anda dapat membuka antarmuka TuneBridge melalui jaringan Wi-Fi lokal di browser HP Anda, lalu menggunakan bookmarklet satu sentuhan untuk menghubungkan akun dengan praktis.",
    },
    {
      question: isEn
        ? "Which music platforms are planned next?"
        : "Platform musik apa saja yang akan didukung selanjutnya?",
      answer: isEn
        ? "YouTube Music and Apple Music are fully active today. Extended support for Spotify, Tidal Hi-Fi, Deezer, SoundCloud, and self-hosted media servers (Navidrome/Subsonic/Jellyfin) is actively on the roadmap."
        : "Saat ini YouTube Music dan Apple Music aktif penuh. Dukungan lanjutan untuk Spotify, Tidal Hi-Fi, Deezer, SoundCloud, dan server musik mandiri (Navidrome/Subsonic) sedang disiapkan di roadmap.",
    },
  ];

  const toggleAccordion = (index: number) => {
    if (openIndices.includes(index)) {
      setOpenIndices(openIndices.filter((i) => i !== index));
    } else {
      setOpenIndices([...openIndices, index]);
    }
  };

  return (
    <section id="faq-section" className="w-full py-16 md:py-24 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-white/[0.08] text-xs font-medium text-accent mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{isEn ? "Common Questions" : "Pertanyaan Umum"}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
          {t("landing.faqHeading")}
        </h2>
        <p className="mt-2 text-sm text-text-secondary max-w-xl">
          {isEn
            ? "Clear, transparent answers on workflow, data privacy, and supported platforms."
            : "Jawaban lugas seputar cara kerja, privasi data lokal, dan dukungan platform di TuneBridge."}
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqData.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <article
              key={idx}
              className="rounded-xl border border-white/[0.08] bg-surface-elevated/40 backdrop-blur-sm overflow-hidden transition-colors hover:border-white/[0.15]"
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 btn-press select-none"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-semibold text-text-primary">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-secondary flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-accent" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-white/[0.04]">
                  {item.answer}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
