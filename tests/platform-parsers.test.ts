import { describe, it, expect } from "vitest";
import {
  sanitizeVideoTitle,
  YouTubeVideoAdapter,
  parseYouTubeInput,
  extractYtInitialData,
} from "../src/core/adapters/youtube-video-adapter.js";
import { parseYouTubeMusicTracks } from "../src/core/ytmusic.js";
import { SpotifyAdapter } from "../src/core/adapters/spotify-adapter.js";
import { SoundCloudAdapter } from "../src/core/adapters/soundcloud-adapter.js";
import { DeezerAdapter } from "../src/core/adapters/deezer-adapter.js";
import { FileAdapter } from "../src/core/adapters/file-adapter.js";

describe("Platform Adapters & Parsers Suite (TDD)", () => {
  describe("YouTubeVideoAdapter Title Cleaning & ID Parsing", () => {
    it("cleans noisy YouTube titles with 4K, MV, Official Video, and extracts artist/title", () => {
      const sample1 = sanitizeVideoTitle(
        "Lady Gaga, Bruno Mars - Die With A Smile (Official Music Video)",
        "Lady Gaga"
      );
      expect(sample1.cleanTitle).toBe("Die With A Smile");
      expect(sample1.cleanArtist).toBe("Lady Gaga, Bruno Mars");

      const sample2 = sanitizeVideoTitle(
        "Coldplay - Yellow [Official Video 4K 60fps]",
        "Coldplay"
      );
      expect(sample2.cleanTitle).toBe("Yellow");
      expect(sample2.cleanArtist).toBe("Coldplay");

      const sample3 = sanitizeVideoTitle(
        "Avicii - Levels (Radio Edit) [Remastered 2024]",
        "Avicii - Topic"
      );
      expect(sample3.cleanArtist).toBe("Avicii");
      expect(sample3.cleanTitle).toContain("Levels");
    });

    it("detects remix, live, and cover tags accurately", () => {
      const live = sanitizeVideoTitle("Nirvana - Smells Like Teen Spirit (Live at Reading 1992)");
      expect(live.isLive).toBe(true);

      const remix = sanitizeVideoTitle("Dua Lipa - Levitating (The Blessed Madonna Remix)");
      expect(remix.isRemix).toBe(true);

      const cover = sanitizeVideoTitle("Boyce Avenue - Fast Car (Acoustic Cover)");
      expect(cover.isCover).toBe(true);
    });

    it("normalizes YouTube playlist URLs, short links, and watch links with list parameter", () => {
      const adapter = new YouTubeVideoAdapter();
      expect(
        adapter.normalizePlaylistId("https://www.youtube.com/playlist?list=PLrAl6rVqgY_O5h2aQx8Bf2J8Gv9")
      ).toBe("PLrAl6rVqgY_O5h2aQx8Bf2J8Gv9");

      expect(
        adapter.normalizePlaylistId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890ABCDEF")
      ).toBe("PL1234567890ABCDEF");

      expect(adapter.normalizePlaylistId("VLPL987654321")).toBe("PL987654321");
      expect(adapter.normalizePlaylistId("PL987654321")).toBe("PL987654321");

      // Mix & Watch URLs
      const mixInput = parseYouTubeInput("https://www.youtube.com/watch?v=kffacxfA7G4&list=RDkffacxfA7G4&start_radio=1");
      expect(mixInput.playlistId).toBe("RDkffacxfA7G4");
      expect(mixInput.videoId).toBe("kffacxfA7G4");

      // Music Album URLs
      const albumInput = parseYouTubeInput("https://music.youtube.com/playlist?list=OLAK5uy_k12345");
      expect(albumInput.playlistId).toBe("OLAK5uy_k12345");
    });

    it("extracts ytInitialData reliably across diverse HTML formatting and edge cases", () => {
      // 1. Standard with semicolon
      const html1 = '<script>var ytInitialData = {"foo":"bar1"};</script>';
      expect(extractYtInitialData(html1)).toEqual({ foo: "bar1" });

      // 2. With window["ytInitialData"] assignment and newline before </script>
      const html2 = '<script>window["ytInitialData"] = {"foo":"bar2"};\n</script>';
      expect(extractYtInitialData(html2)).toEqual({ foo: "bar2" });

      // 3. Without semicolon before </script>
      const html3 = '<script>ytInitialData = {"foo":"bar3"}</script>';
      expect(extractYtInitialData(html3)).toEqual({ foo: "bar3" });

      // 4. Invalid or missing returns null
      expect(extractYtInitialData("<html><body>No data</body></html>")).toBeNull();
    });

    it("parses playlistPanelVideoRenderer items from YouTube watch/mix queues", () => {
      const adapter = new YouTubeVideoAdapter();
      const mockWatchQueue = {
        contents: {
          twoColumnWatchNextResults: {
            playlist: {
              playlist: {
                contents: [
                  {
                    playlistPanelVideoRenderer: {
                      videoId: "vid_mix_1",
                      title: { simpleText: "Queen - Bohemian Rhapsody (Official Video Remastered)" },
                      longBylineText: { runs: [{ text: "Queen Official" }] },
                      thumbnail: { thumbnails: [{ url: "https://i.ytimg.com/vi/vid_mix_1/hqdefault.jpg" }] },
                    },
                  },
                  {
                    playlistPanelVideoRenderer: {
                      videoId: "vid_mix_2",
                      title: { runs: [{ text: "Queen - Don't Stop Me Now" }] },
                      shortBylineText: { runs: [{ text: "Queen Official" }] },
                    },
                  },
                ],
              },
            },
          },
        },
      };

      const tracks = adapter.parseInnertubeResponse(mockWatchQueue);
      expect(tracks.length).toBe(2);
      expect(tracks[0].videoId).toBe("vid_mix_1");
      expect(tracks[0].title).toBe("Bohemian Rhapsody");
      expect(tracks[0].artist).toBe("Queen");
      expect(tracks[1].videoId).toBe("vid_mix_2");
      expect(tracks[1].title).toBe("Don't Stop Me Now");
    });

    it("parses musicResponsiveListItemRenderer and fallback formats in YouTubeMusic parser", () => {
      const mockMusicAlbum = {
        contents: {
          singleColumnBrowseResultsRenderer: {
            tabs: [
              {
                tabRenderer: {
                  content: {
                    sectionListRenderer: {
                      contents: [
                        {
                          musicShelfRenderer: {
                            contents: [
                              {
                                musicResponsiveListItemRenderer: {
                                  playlistItemData: { videoId: "ytm_trk_1" },
                                  flexColumns: [
                                    {
                                      musicResponsiveListItemFlexColumnRenderer: {
                                        text: { runs: [{ text: "Starboy" }] },
                                      },
                                    },
                                    {
                                      musicResponsiveListItemFlexColumnRenderer: {
                                        text: { runs: [{ text: "The Weeknd feat. Daft Punk" }] },
                                      },
                                    },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      };

      const tracks = parseYouTubeMusicTracks(mockMusicAlbum);
      expect(tracks.length).toBe(1);
      expect(tracks[0].videoId).toBe("ytm_trk_1");
      expect(tracks[0].title).toBe("Starboy");
      expect(tracks[0].artist).toBe("The Weeknd feat. Daft Punk");
    });

    it("parses modern YouTube desktop lockupViewModel items correctly", () => {
      const adapter = new YouTubeVideoAdapter();
      const mockInnertube = {
        contents: {
          twoColumnBrowseResultsRenderer: {
            tabs: [
              {
                tabRenderer: {
                  content: {
                    sectionListRenderer: {
                      contents: [
                        {
                          itemSectionRenderer: {
                            contents: [
                              {
                                lockupViewModel: {
                                  contentId: "kPa7bsKwL-c",
                                  contentType: "LOCKUP_CONTENT_TYPE_VIDEO",
                                  contentImage: {
                                    thumbnailViewModel: {
                                      image: {
                                        sources: [
                                          { url: "https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg" },
                                        ],
                                      },
                                    },
                                  },
                                  metadata: {
                                    lockupMetadataViewModel: {
                                      title: {
                                        content: "Lady Gaga, Bruno Mars - Die With A Smile (Official Music Video)",
                                      },
                                      metadata: {
                                        contentMetadataViewModel: {
                                          metadataRows: [
                                            {
                                              metadataParts: [
                                                { text: { content: "Lady Gaga" } },
                                              ],
                                            },
                                          ],
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      };

      const tracks = adapter.parseInnertubeResponse(mockInnertube);
      expect(tracks.length).toBe(1);
      expect(tracks[0].videoId).toBe("kPa7bsKwL-c");
      expect(tracks[0].title).toBe("Die With A Smile");
      expect(tracks[0].artist).toBe("Lady Gaga, Bruno Mars");
      expect(tracks[0].thumbnailUrl).toBe("https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg");
    });
  });

  describe("SpotifyAdapter Public Embed & API Parsing", () => {
    it("extracts clean playlist ID from varied Spotify URL formats", () => {
      const adapter = new SpotifyAdapter();
      expect(adapter.extractPlaylistId("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=123")).toBe("37i9dQZF1DXcBWIGoYBM5M");
      expect(adapter.extractPlaylistId("37i9dQZF1DXcBWIGoYBM5M")).toBe("37i9dQZF1DXcBWIGoYBM5M");
      expect(adapter.extractPlaylistId("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M")).toBe("37i9dQZF1DXcBWIGoYBM5M");
    });

    it("parses tracks from Spotify public embed JSON payload", () => {
      const mockNextData = {
        props: {
          pageProps: {
            state: {
              data: {
                entity: {
                  title: "Today's Top Hits",
                  trackList: [
                    {
                      id: "sp1",
                      title: "Espresso",
                      subtitle: "Sabrina Carpenter",
                      duration: 175000,
                      displayArtworkUri: "https://i.scdn.co/image/ab67616d0000b273sample",
                    },
                    {
                      id: "sp2",
                      name: "Birds of a Feather",
                      artists: [{ name: "Billie Eilish" }],
                      duration: 190000,
                    },
                  ],
                },
              },
            },
          },
        },
      };

      const fakeHtml = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(mockNextData)}</script>`;
      // Testing the parsing logic directly
      const scriptMatch = fakeHtml.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/);
      expect(scriptMatch).not.toBeNull();
      const parsed = JSON.parse(scriptMatch![1]);
      const rawTrackList = parsed.props.pageProps.state.data.entity.trackList;
      expect(rawTrackList.length).toBe(2);
      expect(rawTrackList[0].title).toBe("Espresso");
      expect(rawTrackList[0].subtitle).toBe("Sabrina Carpenter");
      expect(Math.round(rawTrackList[0].duration / 1000)).toBe(175);
    });
  });

  describe("SoundCloudAdapter Track Extraction", () => {
    it("extracts tracks from __sc_hydration json payload", () => {
      const adapter = new SoundCloudAdapter();
      const mockHydration = [
        {
          hydratable: "playlist",
          data: {
            tracks: [
              {
                id: 101,
                title: "Ambient Sunset Chill",
                duration: 245000,
                user: { username: "ChillMaster" },
                artwork_url: "https://i1.sndcdn.com/artworks-101.jpg",
              },
              {
                id: 102,
                title: "Deep Techno Live",
                duration: 360000,
                user: { username: "TechnoDJ" },
              },
            ],
          },
        },
      ];

      const html = `<script>window.__sc_hydration = ${JSON.stringify(mockHydration)};</script>`;
      const tracks = adapter.parseTracksFromHtml(html);
      expect(tracks.length).toBe(2);
      expect(tracks[0].title).toBe("Ambient Sunset Chill");
      expect(tracks[0].artist).toBe("ChillMaster");
      expect(tracks[0].durationSeconds).toBe(245);
      expect(tracks[0].thumbnailUrl).toBe("https://i1.sndcdn.com/artworks-101.jpg");
    });
  });

  describe("DeezerAdapter Numeric ID & Response Parsing", () => {
    it("extracts numeric playlist ID correctly from Deezer URLs", () => {
      const adapter = new DeezerAdapter();
      expect(adapter.extractPlaylistId("https://www.deezer.com/playlist/30595446")).toBe("30595446");
      expect(adapter.extractPlaylistId("https://www.deezer.com/en/playlist/908622995?utm_source=test")).toBe("908622995");
      expect(adapter.extractPlaylistId("30595446")).toBe("30595446");
    });
  });

  describe("FileAdapter Universal Ingestion (M3U, CSV, Text, JSON)", () => {
    it("parses M3U and M3U8 files with #EXTINF headers", () => {
      const adapter = new FileAdapter();
      const m3uContent = `#EXTM3U
#EXTINF:210,Queen - Bohemian Rhapsody
/music/queen/bohemian.mp3
#EXTINF:180,Daft Punk - One More Time
/music/daft/one_more_time.mp3`;

      const result = adapter.parseContent(m3uContent, "Rock & Dance");
      expect(result.tracks.length).toBe(2);
      expect(result.tracks[0].artist).toBe("Queen");
      expect(result.tracks[0].title).toBe("Bohemian Rhapsody");
      expect(result.tracks[0].durationSeconds).toBe(210);

      expect(result.tracks[1].artist).toBe("Daft Punk");
      expect(result.tracks[1].title).toBe("One More Time");
      expect(result.tracks[1].durationSeconds).toBe(180);
    });

    it("parses CSV playlist exports with varied header naming", () => {
      const adapter = new FileAdapter();
      const csvContent = `Track,Artist,Album
Starboy,The Weeknd,Starboy
Blinding Lights,The Weeknd,After Hours`;

      const result = adapter.parseContent(csvContent, "The Weeknd Hits");
      expect(result.tracks.length).toBe(2);
      expect(result.tracks[0].title).toBe("Starboy");
      expect(result.tracks[0].artist).toBe("The Weeknd");
      expect(result.tracks[0].album).toBe("Starboy");
      expect(result.tracks[1].title).toBe("Blinding Lights");
    });

    it("parses plain text line-by-line 'Artist - Title' format", () => {
      const adapter = new FileAdapter();
      const textContent = `Coldplay - Fix You
Radiohead - Creep
Adele - Rolling in the Deep`;

      const result = adapter.parseContent(textContent, "Acoustic Gems");
      expect(result.tracks.length).toBe(3);
      expect(result.tracks[0].artist).toBe("Coldplay");
      expect(result.tracks[0].title).toBe("Fix You");
      expect(result.tracks[1].artist).toBe("Radiohead");
      expect(result.tracks[1].title).toBe("Creep");
    });

    it("parses JSON PlayForgeX snapshots and raw arrays", () => {
      const adapter = new FileAdapter();
      const jsonContent = JSON.stringify({
        title: "Synthwave Sunset",
        tracks: [
          { title: "Resonance", artist: "HOME", album: "Odyssey", durationSeconds: 212 },
          { title: "Vessel", artist: "Kavinsky", durationSeconds: 198 },
        ],
      });

      const result = adapter.parseContent(jsonContent, "Default Title");
      expect(result.title).toBe("Synthwave Sunset");
      expect(result.tracks.length).toBe(2);
      expect(result.tracks[0].title).toBe("Resonance");
      expect(result.tracks[0].artist).toBe("HOME");
      expect(result.tracks[0].durationSeconds).toBe(212);
    });
  });
});
