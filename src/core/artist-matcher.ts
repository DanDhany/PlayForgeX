// Kana to Romaji mapping table
const HIRAGANA_TO_ROMAJI: Record<string, string> = {
  // Dual character combos (youon)
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  // Single characters
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "wo", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
};

// Convert Katakana to Hiragana
export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

// Convert any Japanese Kana string to lowercase Romaji
export function kanaToRomaji(input: string): string {
  if (!input) return "";
  let text = katakanaToHiragana(input.normalize("NFKC"));

  // Replace small tsu (sokuon) with duplicate of next consonant
  text = text.replace(/っ([か-ぽ])/g, (_match, nextChar) => {
    const nextRomaji = HIRAGANA_TO_ROMAJI[nextChar] || "";
    return nextRomaji.length > 0 ? nextRomaji[0] + nextChar : nextChar;
  });

  // Long vowels
  text = text.replace(/ー/g, "");

  let result = "";
  let i = 0;
  while (i < text.length) {
    if (i + 1 < text.length) {
      const two = text.slice(i, i + 2);
      if (HIRAGANA_TO_ROMAJI[two]) {
        result += HIRAGANA_TO_ROMAJI[two];
        i += 2;
        continue;
      }
    }
    const one = text[i];
    result += HIRAGANA_TO_ROMAJI[one] || one;
    i += 1;
  }

  return result.toLowerCase().replace(/[\s\-_.,/\\'"`!?()\[\]]/g, "");
}

// Extensible Kanji/English/VTuber artist aliases
export const KNOWN_ARTIST_ALIASES: Record<string, string[]> = {
  "星街すいせい": ["Hoshimachi Suisei", "Suisei Hoshimachi", "Suisei"],
  "hoshimachi suisei": ["星街すいせい", "Suisei", "Midnight Grand Orchestra"],
  "suisei hoshimachi": ["星街すいせい", "Suisei", "Midnight Grand Orchestra"],
  "花譜": ["KAF", "Kaf"],
  "kaf": ["花譜"],
  "理芽": ["RIM", "Rim"],
  "rim": ["理芽"],
  "春猿火": ["Harusaruhi"],
  "harusaruhi": ["春猿火"],
  "ヰ世界情緒": ["Isekaijoucho", "Isekai Joucho"],
  "isekaijoucho": ["ヰ世界情緒"],
  "幸祜": ["KOKO", "Koko"],
  "koko": ["幸祜"],
  "ずっと真夜中でいいのに。": ["ZUTOMAYO", "Zutto Mayonaka de Iinoni", "Zutomayo"],
  "zutomayo": ["ずっと真夜中でいいのに。"],
  "米津玄師": ["Kenshi Yonezu", "Yonezu Kenshi", "Hachi", "ハチ"],
  "kenshi yonezu": ["米津玄師"],
  "ヨルシカ": ["Yorushika", "n-buna", "suis"],
  "yorushika": ["ヨルシカ"],
  "美波": ["Minami"],
  "minami": ["美波"],
  "須田景凪": ["Keina Suda", "balloon", "バルーン"],
  "keina suda": ["須田景凪", "バルーン"],
  "ツユ": ["TUYU", "Tuyu"],
  "tuyu": ["ツユ"],
  "神様、僕は気づいてしまった": ["Kami-sama, I have noticed", "Kamisama, Boku wa Kizuiteshimatta"],
  "女王蜂": ["QUEEN BEE", "Queen Bee"],
  "queen bee": ["女王蜂"],
  "Official髭男dism": ["Official HIGE DANdism", "Higedan", "Official Hige Dandism"],
  "official hige dandism": ["Official髭男dism"],
  "ナナヲアカリ": ["Akari Nanawo", "Nanawo Akari"],
  "akari nanawo": ["ナナヲアカリ"],
  "湊あくあ": ["Minato Aqua", "Aqua Minato"],
  "minato aqua": ["湊あくあ"],
  "宝鐘マリン": ["Houshou Marine", "Marine Houshou"],
  "houshou marine": ["宝鐘マリン"],
  "常闇トワ": ["Tokoyami Towa", "Towa Tokoyami"],
  "tokoyami towa": ["常闇トワ"],
  "天音かなた": ["Amane Kanata", "Kanata Amane"],
  "amane kanata": ["天音かなた"],
  "白上フブキ": ["Shirakami Fubuki", "Fubuki Shirakami"],
  "shirakami fubuki": ["白上フブキ"],
  "さくらみこ": ["Sakura Miko", "Miko Sakura"],
  "sakura miko": ["さくらみこ"],
  "猫又おかゆ": ["Nekomata Okayu", "Okayu Nekomata"],
  "nekomata okayu": ["猫又おかゆ"],
  "戌神ころね": ["Inugami Korone", "Korone Inugami"],
  "inugami korone": ["戌神ころね"],
  "角巻わため": ["Tsunomaki Watame", "Watame Tsunomaki"],
  "tsunomaki watame": ["角巻わため"],
  "百鬼あやめ": ["Nakiri Ayame", "Ayame Nakiri"],
  "nakiri ayame": ["百鬼あやめ"],
  "大空スバル": ["Oozora Subaru", "Subaru Oozora"],
  "oozora subaru": ["大空スバル"],
  "紫咲シオン": ["Murasaki Shion", "Shion Murasaki"],
  "murasaki shion": ["紫咲シオン"],
  "兎田ぺこら": ["Usada Pekora", "Pekora Usada"],
  "usada pekora": ["兎田ぺこら"],
  "不知火フレア": ["Shiranui Flare", "Flare Shiranui"],
  "shiranui flare": ["不知火フレア"],
  "白銀ノエル": ["Shirogane Noel", "Noel Shirogane"],
  "shirogane noel": ["白銀ノエル"],
  "雪花ラミィ": ["Yukihana Lamy", "Lamy Yukihana"],
  "yukihana lamy": ["雪花ラミィ"],
  "桃鈴ねね": ["Momosuzu Nene", "Nene Momosuzu"],
  "momosuzu nene": ["桃鈴ねね"],
  "獅白ぼたん": ["Shishiro Botan", "Botan Shishiro"],
  "shishiro botan": ["獅白ぼたん"],
  "尾丸ポルカ": ["Omaru Polka", "Polka Omaru"],
  "omaru polka": ["尾丸ポルカ"],
  "ラプラス・ダークネス": ["La+ Darknesss", "Laplus Darknesss"],
  "la+ darknesss": ["ラプラス・ダークネス"],
  "鷹嶺ルイ": ["Takane Lui", "Lui Takane"],
  "takane lui": ["鷹嶺ルイ"],
  "博衣こより": ["Hakui Koyori", "Koyori Hakui"],
  "hakui koyori": ["博衣こより"],
  "沙花叉クロヱ": ["Sakamata Chloe", "Chloe Sakamata"],
  "sakamata chloe": ["沙花叉クロヱ"],
  "風真いろは": ["Kazama Iroha", "Iroha Kazama"],
  "kazama iroha": ["風真いろは"],
  "森カリオペ": ["Mori Calliope", "Calliope Mori"],
  "mori calliope": ["森カリオペ"],
  "小鳥遊キアラ": ["Takanashi Kiara", "Kiara Takanashi"],
  "takanashi kiara": ["小鳥遊キアラ"],
  "一伊那尓栖": ["Ninomae Ina'nis", "Ina'nis Ninomae"],
  "ninomae ina'nis": ["一伊那尓栖"],
  "がうる・ぐら": ["Gawr Gura", "Gura Gawr"],
  "gawr gura": ["がうる・ぐら"],
  "ワトソン・アメリア": ["Watson Amelia", "Amelia Watson"],
  "watson amelia": ["ワトソン・アメリア"],
  "Midnight Grand Orchestra": ["MGO", "Hoshimachi Suisei & TAKU INOUE", "星街すいせい", "TAKU INOUE"],
  "mgo": ["Midnight Grand Orchestra"],
};

export function getArtistAliases(artist: string): string[] {
  if (!artist) return [];
  const normalized = artist.trim().toLowerCase();
  const direct = KNOWN_ARTIST_ALIASES[artist.trim()] || KNOWN_ARTIST_ALIASES[normalized] || [];

  // Also check inverted name order e.g. "Hoshimachi Suisei" -> "Suisei Hoshimachi"
  const parts = artist.trim().split(/\s+/);
  const inverted = parts.length === 2 ? `${parts[1]} ${parts[0]}` : null;

  const result = new Set<string>([...direct]);
  if (inverted && inverted !== artist) {
    result.add(inverted);
  }

  return Array.from(result);
}

// Compute normalized string similarity (Levenshtein + containment)
export function computeLevenshteinSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const n1 = s1.normalize("NFKC").toLowerCase().replace(/[\s\-_.,/\\'"`!?()\[\]]/g, "");
  const n2 = s2.normalize("NFKC").toLowerCase().replace(/[\s\-_.,/\\'"`!?()\[\]]/g, "");

  if (n1 === n2) return 1.0;
  if (n1.length === 0 || n2.length === 0) return 0;

  if (n1.includes(n2) || n2.includes(n1)) {
    const minLen = Math.min(n1.length, n2.length);
    const maxLen = Math.max(n1.length, n2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  const track = Array(n2.length + 1)
    .fill(null)
    .map(() => Array(n1.length + 1).fill(null));

  for (let i = 0; i <= n1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= n2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= n2.length; j += 1) {
    for (let i = 1; i <= n1.length; i += 1) {
      const indicator = n1[i - 1] === n2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[n2.length][n1.length];
  const maxLen = Math.max(n1.length, n2.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Robust cross-script artist similarity calculation
 * Returns 1.0 for exact/alias matches, down to 0 for completely different artists.
 */
export function computeArtistSimilarity(artist1: string, artist2: string): number {
  if (!artist1 || !artist2) return 0;

  const a1 = artist1.trim();
  const a2 = artist2.trim();

  // 1. Direct match
  if (a1.toLowerCase() === a2.toLowerCase()) return 1.0;

  // 2. Inverted name order: "Hoshimachi Suisei" vs "Suisei Hoshimachi"
  const p1 = a1.split(/\s+/);
  const p2 = a2.split(/\s+/);
  if (p1.length === 2 && p2.length === 2) {
    if (p1[0].toLowerCase() === p2[1].toLowerCase() && p1[1].toLowerCase() === p2[0].toLowerCase()) {
      return 1.0;
    }
  }

  // 3. Known artist alias table (Kanji <-> Romaji / English)
  const aliases1 = getArtistAliases(a1);
  for (const alias of aliases1) {
    if (alias.toLowerCase() === a2.toLowerCase()) return 1.0;
  }
  const aliases2 = getArtistAliases(a2);
  for (const alias of aliases2) {
    if (alias.toLowerCase() === a1.toLowerCase()) return 1.0;
  }

  // 4. Kana-to-Romaji transliteration
  const romaji1 = kanaToRomaji(a1);
  const romaji2 = kanaToRomaji(a2);
  if (romaji1 && romaji2) {
    if (romaji1 === romaji2) return 0.98;
    const romajiSim = computeLevenshteinSimilarity(romaji1, romaji2);
    if (romajiSim >= 0.85) return romajiSim;
  }

  // 5. Check if one artist string contains the other (featuring, collaboration, group)
  // e.g. "Midnight Grand Orchestra" vs "Midnight Grand Orchestra with TAKU INOUE"
  const clean1 = a1.toLowerCase().replace(/[\s\-_.,/\\'"`!?]/g, "");
  const clean2 = a2.toLowerCase().replace(/[\s\-_.,/\\'"`!?]/g, "");
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    const minL = Math.min(clean1.length, clean2.length);
    const maxL = Math.max(clean1.length, clean2.length);
    if (minL >= 4) {
      return Math.max(0.85, minL / maxL);
    }
  }

  // 6. Direct Levenshtein on clean names
  return computeLevenshteinSimilarity(a1, a2);
}
