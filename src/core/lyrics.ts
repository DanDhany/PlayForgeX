import { kanaToRomaji } from "./artist-matcher";

export function cleanLyrics(raw: string): string {
  if (!raw) return "";
  // Strip XML / TTML / HTML tags
  let text = raw.replace(/<[^>]+>/g, " ");
  // Remove sync timestamps like [00:12.34]
  text = text.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, " ");
  // Normalize unicode
  text = text.normalize("NFKC").toLowerCase();
  // Remove punctuation
  text = text.replace(/[\r\n\t]+/g, " ");
  text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘“”【】「」]/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Compare two lyrics strings using character 3-gram Jaccard similarity.
 * Works across full lyrics or lyric snippets in any script (Japanese Kanji/Kana, Latin, etc.)
 */
export function compareLyrics(lyr1: string, lyr2: string): number {
  if (!lyr1 || !lyr2) return 0;

  const c1 = cleanLyrics(lyr1);
  const c2 = cleanLyrics(lyr2);

  if (c1 === c2) return 1.0;
  if (c1.length < 10 || c2.length < 10) return 0;

  // Direct containment check (e.g. snippet inside full lyrics)
  if (c1.includes(c2) || c2.includes(c1)) {
    const minL = Math.min(c1.length, c2.length);
    const maxL = Math.max(c1.length, c2.length);
    return Math.max(0.85, minL / maxL);
  }

  // Also convert to romaji to catch phonetic representations
  const r1 = kanaToRomaji(c1);
  const r2 = kanaToRomaji(c2);
  if (r1.length > 20 && r2.length > 20 && (r1.includes(r2) || r2.includes(r1))) {
    return 0.85;
  }

  // 3-gram sets
  const getGrams = (text: string): Set<string> => {
    const grams = new Set<string>();
    const n = 3;
    for (let i = 0; i <= text.length - n; i++) {
      grams.add(text.slice(i, i + n));
    }
    return grams;
  };

  const g1 = getGrams(c1);
  const g2 = getGrams(c2);

  if (g1.size === 0 || g2.size === 0) return 0;

  let intersection = 0;
  for (const gram of g1) {
    if (g2.has(gram)) intersection++;
  }

  const union = g1.size + g2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function fetchYouTubeLyrics(
  videoId: string,
  cookieString: string
): Promise<string | null> {
  if (!videoId || !cookieString) return null;

  try {
    const nextRes = await fetch("https://music.youtube.com/youtubei/v1/next", {
      method: "POST",
      headers: {
        Cookie: cookieString,
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20241028.01.00",
            hl: "ja",
            gl: "JP",
          },
        },
        videoId,
      }),
    });

    if (!nextRes.ok) return null;

    const nextData = await nextRes.json();
    const tabs =
      nextData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
        ?.watchNextTabbedResultsRenderer?.tabs || [];

    let lyricsBrowseId: string | null = null;
    for (const t of tabs) {
      const bId = t.tabRenderer?.endpoint?.browseEndpoint?.browseId;
      if (bId && bId.startsWith("MPLYt_")) {
        lyricsBrowseId = bId;
        break;
      }
    }

    if (!lyricsBrowseId) return null;

    const browseRes = await fetch("https://music.youtube.com/youtubei/v1/browse", {
      method: "POST",
      headers: {
        Cookie: cookieString,
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB_REMIX",
            clientVersion: "1.20241028.01.00",
            hl: "ja",
            gl: "JP",
          },
        },
        browseId: lyricsBrowseId,
      }),
    });

    if (!browseRes.ok) return null;

    const browseData = await browseRes.json();
    const contents = browseData?.contents?.sectionListRenderer?.contents || [];
    for (const c of contents) {
      const shelf = c.musicDescriptionShelfRenderer;
      if (shelf?.description?.runs) {
        return shelf.description.runs.map((r: any) => r.text).join("").trim();
      }
    }

    return null;
  } catch (err) {
    console.warn(`Failed to fetch YouTube lyrics for ${videoId}:`, err);
    return null;
  }
}

export async function fetchAppleLyrics(
  songId: string,
  storefront: string,
  devToken: string,
  userToken?: string
): Promise<string | null> {
  if (!songId || !devToken) return null;

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${devToken}`,
      Origin: "https://apple.com",
      Referer: "https://apple.com/",
    };
    if (userToken) {
      headers["Music-User-Token"] = userToken;
    }

    const res = await fetch(
      `https://amp-api.music.apple.com/v1/catalog/${storefront}/songs/${songId}/lyrics`,
      { headers }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const ttml = json?.data?.[0]?.attributes?.ttml;
    if (!ttml) return null;

    return ttml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } catch (err) {
    console.warn(`Failed to fetch Apple lyrics for ${songId}:`, err);
    return null;
  }
}
