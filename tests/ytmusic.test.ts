import { describe, it, expect } from "vitest";
import { generateSapisidHash, parseYouTubeMusicPlaylists, parseYouTubeMusicTracks } from "../src/core/ytmusic";

describe("YouTube Music Client Helpers", () => {
  it("computes valid SAPISIDHASH format (timestamp_sha1)", () => {
    const sapisid = "test_sapisid_value";
    const origin = "https://music.youtube.com";
    const hash = generateSapisidHash(sapisid, origin);
    expect(hash).toMatch(/^\d+_[a-f0-9]{40}$/);
  });

  it("parses playlist items correctly from YouTubei browse response", () => {
    const mockResponse = {
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [
            {
              tabRenderer: {
                content: {
                  sectionListRenderer: {
                    contents: [
                      {
                        gridRenderer: {
                          items: [
                            {
                              musicTwoRowItemRenderer: {
                                title: { runs: [{ text: "My J-Pop Favorites" }] },
                                navigationEndpoint: { browseEndpoint: { browseId: "VLPL123" } },
                                subtitle: { runs: [{ text: "Playlist • 45 songs" }] },
                                thumbnailRenderer: {
                                  musicThumbnailRenderer: {
                                    thumbnail: {
                                      thumbnails: [{ url: "https://lh3.googleusercontent.com/test=w120-h120-l90-rj" }]
                                    }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
    const playlists = parseYouTubeMusicPlaylists(mockResponse);
    expect(playlists).toHaveLength(1);
    expect(playlists[0].id).toBe("VLPL123");
    expect(playlists[0].title).toBe("My J-Pop Favorites");
    expect(playlists[0].trackCount).toBe(45);
    expect(playlists[0].thumbnailUrl).toContain("lh3.googleusercontent.com");
  });

  it("parses playlist tracks correctly from YouTubei browse playlist response", () => {
    const mockPlaylistResponse = {
      contents: {
        singleColumnBrowseResultsRenderer: {
          tabs: [
            {
              tabRenderer: {
                content: {
                  sectionListRenderer: {
                    contents: [
                      {
                        musicPlaylistShelfRenderer: {
                          contents: [
                            {
                              musicResponsiveListItemRenderer: {
                                playlistItemData: { videoId: "v123" },
                                flexColumns: [
                                  {
                                    musicResponsiveListItemFlexColumnRenderer: {
                                      text: { runs: [{ text: "夜に駆ける" }] }
                                    }
                                  },
                                  {
                                    musicResponsiveListItemFlexColumnRenderer: {
                                      text: {
                                        runs: [
                                          { text: "YOASOBI" },
                                          { text: " • " },
                                          { text: "THE BOOK" },
                                          { text: " • " },
                                          { text: "4:21" }
                                        ]
                                      }
                                    }
                                  }
                                ],
                                thumbnail: {
                                  musicThumbnailRenderer: {
                                    thumbnail: {
                                      thumbnails: [{ url: "https://lh3.googleusercontent.com/track=w120-h120" }]
                                    }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
    const tracks = parseYouTubeMusicTracks(mockPlaylistResponse);
    expect(tracks).toHaveLength(1);
    expect(tracks[0].title).toBe("夜に駆ける");
    expect(tracks[0].artist).toBe("YOASOBI");
    expect(tracks[0].album).toBe("THE BOOK");
    expect(tracks[0].videoId).toBe("v123");
    expect(tracks[0].durationSeconds).toBe(261);
  });

  it("parses nested itemSectionRenderer playlists in modern YouTubei layout", () => {
    const mockNestedResponse = {
      contents: {
        singleColumnBrowseResultsRenderer: {
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
                              gridRenderer: {
                                items: [
                                  {
                                    musicTwoRowItemRenderer: {
                                      title: { runs: [{ text: "VTuber Favorites" }] },
                                      navigationEndpoint: { browseEndpoint: { browseId: "VLPL999" } },
                                      subtitle: { runs: [{ text: "Playlist • 12 songs" }] },
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
    const playlists = parseYouTubeMusicPlaylists(mockNestedResponse);
    expect(playlists).toHaveLength(1);
    expect(playlists[0].id).toBe("VLPL999");
    expect(playlists[0].title).toBe("VTuber Favorites");
    expect(playlists[0].trackCount).toBe(12);
  });
});
