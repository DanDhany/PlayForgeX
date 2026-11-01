import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "Bagaimana TuneBridge memindahkan playlist dari YouTube Music ke Apple Music?",
    answer:
      "TuneBridge mengambil daftar lagu dari playlist YouTube Music Anda, lalu mencocokkannya ke katalog Apple Music menggunakan algoritma pencarian cerdas dengan prioritas judul asli dan filter kata kunci non-musik (seperti 'Official Video' atau '4K'). Anda dapat mereview dan mendengarkan preview sebelum transfer disetujui.",
  },
  {
    question: "Apakah saya perlu akun Apple Developer yang berbayar?",
    answer:
      "Tidak. TuneBridge menggunakan token autentikasi web resmi yang dihasilkan saat Anda login di browser (music.apple.com), sehingga tidak memerlukan pendaftaran akun Apple Developer seharga $99/tahun.",
  },
  {
    question: "Apakah saya bisa menghubungkan beberapa akun YouTube Music sekaligus?",
    answer:
      "Ya. Anda bisa menghubungkan akun pribadi, akun kantor, atau akun kiriman teman secara bersamaan. TuneBridge menggabungkan lagu dan membersihkan duplikat secara otomatis.",
  },
  {
    question: "Di mana data akun, token, dan playlist saya disimpan?",
    answer:
      "Semua data tersimpan di komputer lokal Anda menggunakan database MySQL. TuneBridge adalah aplikasi self-hosted tanpa tracking pihak ketiga atau server perantara di cloud.",
  },
  {
    question: "Bagaimana cara menghubungkan akun dari browser HP (iPhone / Android)?",
    answer:
      "Anda dapat membuka dashboard TuneBridge melalui jaringan Wi-Fi lokal, lalu menggunakan bookmarklet atau form input cookie yang tersedia untuk menyalin token langsung dari browser HP tanpa menyentuh terminal.",
  },
  {
    question: "Platform musik apa saja yang akan didukung selanjutnya?",
    answer:
      "Saat ini YouTube Music dan Apple Music aktif penuh. Arsitektur adapter modular TuneBridge telah disiapkan untuk Spotify, Tidal, Deezer, SoundCloud, dan server self-hosted seperti Navidrome/Subsonic.",
  },
];

export const FaqSection: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

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
          <span>Pertanyaan Umum</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
          Hal yang Sering Ditanyakan
        </h2>
        <p className="mt-2 text-sm text-text-secondary max-w-xl">
          Jawaban lugas seputar cara kerja, privasi data lokal, dan dukungan platform di TuneBridge.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {FAQ_DATA.map((item, idx) => {
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
