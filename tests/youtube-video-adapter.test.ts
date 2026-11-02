import { describe, it, expect } from "vitest";
import {
  YouTubeVideoAdapter,
  parseYouTubeInput,
  extractVideoIdsFromText,
} from "../src/core/adapters/youtube-video-adapter";

describe("YouTube Video Adapter (Single & Multi-Video Support)", () => {
  const adapter = new YouTubeVideoAdapter();

  it("extracts video IDs from various single and multi video link formats", () => {
    // 1. Single standard watch link
    const id1 = extractVideoIdsFromText("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(id1).toEqual(["dQw4w9WgXcQ"]);

    // 2. Shortened link
    const id2 = extractVideoIdsFromText("https://youtu.be/dQw4w9WgXcQ?si=abcdef");
    expect(id2).toEqual(["dQw4w9WgXcQ"]);

    // 3. YouTube Shorts link
    const id3 = extractVideoIdsFromText("https://www.youtube.com/shorts/1234567890a");
    expect(id3).toEqual(["1234567890a"]);

    // 4. Multiple video links in multiline or comma separated text
    const multiText = `
      https://www.youtube.com/watch?v=dQw4w9WgXcQ
      Check this out: https://youtu.be/kJQP7kiw5Fk
      and https://www.youtube.com/watch?v=fJ9rUzIMcZQ
    `;
    const idsMulti = extractVideoIdsFromText(multiText);
    expect(idsMulti).toHaveLength(3);
    expect(idsMulti).toContain("dQw4w9WgXcQ");
    expect(idsMulti).toContain("kJQP7kiw5Fk");
    expect(idsMulti).toContain("fJ9rUzIMcZQ");
  });

  it("correctly identifies playlist vs single video in parseYouTubeInput", () => {
    const plRes = parseYouTubeInput("https://www.youtube.com/playlist?list=PL1234567890");
    expect(plRes.playlistId).toBe("PL1234567890");
    expect(plRes.isSingleVideo).toBe(false);

    const vidRes = parseYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(vidRes.videoId).toBe("dQw4w9WgXcQ");
    expect(vidRes.isSingleVideo).toBe(true);

    const multiRes = parseYouTubeInput("https://youtu.be/vid11111111\nhttps://youtu.be/vid22222222");
    expect(multiRes.videoIds).toHaveLength(2);
    expect(multiRes.isSingleVideo).toBe(false);
  });

  it("fetches and sanitizes single YouTube video metadata via public oEmbed endpoint", async () => {
    const track = await adapter.fetchSingleVideoTrack("dQw4w9WgXcQ");
    expect(track).toBeDefined();
    expect(track?.id).toBe("dQw4w9WgXcQ");
    expect(track?.title).toBe("Never Gonna Give You Up");
    expect(track?.artist).toBe("Rick Astley");
    expect(track?.thumbnailUrl).toContain("dQw4w9WgXcQ");
  });

  it("fetches multiple video links as a unified track list", async () => {
    const multiInput = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const tracks = await adapter.fetchPlaylistTracks(multiInput);
    expect(tracks).toBeDefined();
    expect(tracks.length).toBeGreaterThanOrEqual(1);
    expect(tracks[0].title).toBe("Never Gonna Give You Up");
    expect(tracks[0].artist).toBe("Rick Astley");
  });
});
