export interface SanitizedTitleResult {
  rawTitle: string;
  originalTitle: string;
  cleanTitle: string;
  subtitle?: string;
  hasNonLatin: boolean;
}

// Check for CJK characters (Hiragana, Katakana, Kanji), Hangul, Cyrillic, Thai, etc.
const NON_LATIN_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\uAC00-\uD7AF\u0400-\u04FF\u0E00-\u0E7F]/;

// Noise tags commonly appended in YouTube Music video titles
const NOISE_TAGS_REGEX = [
  /\[\s*(?:official\s+)?(?:music\s+)?(?:video|audio|mv|visualizer|lyric\s+video)\s*\]/gi,
  /\(\s*(?:official\s+)?(?:music\s+)?(?:video|audio|mv|visualizer|lyric\s+video|lyrics)\s*\)/gi,
  /【\s*(?:official\s+)?(?:music\s+)?(?:video|audio|mv|visualizer|lyric\s+video)\s*】/gi,
  /「\s*(?:official\s+)?(?:music\s+)?(?:video|audio|mv|visualizer)\s*」/gi,
  /\[\s*(?:4k|hd|remastered|live|audio)\s*\]/gi,
  /\(\s*(?:4k|hd|remastered|live|audio)\s*\)/gi,
  /【\s*(?:4k|hd|remastered|live)\s*】/gi,
];

// Anime/OST or bracket tags like 「BEASTARS」OP or 【Ado】
const ARTIST_OR_SERIES_BRACKET = /^[【「\[]([^】」\]]+)[】」\]]\s*/;

export function cleanTitle(rawTitle: string): SanitizedTitleResult {
  if (!rawTitle) {
    return {
      rawTitle: "",
      originalTitle: "",
      cleanTitle: "",
      hasNonLatin: false,
    };
  }

  // 1. Unicode NFKC normalization
  let text = rawTitle.normalize("NFKC").trim();
  const hasNonLatin = NON_LATIN_REGEX.test(text);

  // 2. Remove common noise tags
  for (const regex of NOISE_TAGS_REGEX) {
    text = text.replace(regex, "").trim();
  }

  // 3. Remove leading artist/channel tag like 【Ado】 or [Official]
  text = text.replace(ARTIST_OR_SERIES_BRACKET, "").trim();

  // 4. Remove OP/ED annotations like / 「BEASTARS」OP or - OP Ver.
  text = text.replace(/[\/|-]\s*[「【\[]?[^」】\]]*(?:OP|ED|OST|Theme)[^」】\]]*[」】\]]?/gi, "").trim();

  // 5. Remove trailing artist attribution if it has " - Artist" or "feat. ..."
  text = text.replace(/\s+-\s+.*$/, "").trim();

  // 6. Check for bracketed subtitle / translation: e.g. "夜に駆ける (Racing into the Night)"
  let originalTitle = text;
  let subtitle: string | undefined;

  const subtitleMatch = text.match(/^(.+?)\s*[\(\[（]([^\)\]）]+)[\)\]）]$/);
  if (subtitleMatch) {
    const part1 = subtitleMatch[1].trim();
    const part2 = subtitleMatch[2].trim();

    // If part 1 has non-Latin and part 2 is English/Latin, part 1 is the original title and part 2 is subtitle!
    if (NON_LATIN_REGEX.test(part1)) {
      originalTitle = part1;
      subtitle = part2;
    } else if (NON_LATIN_REGEX.test(part2)) {
      // e.g. "Racing into the Night (夜に駆ける)"
      originalTitle = part2;
      subtitle = part1;
    } else {
      // Both Latin or neither non-latin
      originalTitle = part1;
      subtitle = part2;
    }
  }

  // Clean remaining symbols, extra spaces
  const cleanTitle = originalTitle.replace(/\s+/g, " ").trim();

  return {
    rawTitle,
    originalTitle: cleanTitle,
    cleanTitle,
    subtitle: subtitle?.trim(),
    hasNonLatin,
  };
}
