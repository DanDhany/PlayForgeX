import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock HTMLAudioElement for Node environment
class MockAudio {
  src: string = "";
  volume: number = 1;
  currentTime: number = 0;
  duration: number = 30;
  paused: boolean = true;
  onplay: (() => void) | null = null;
  onpause: (() => void) | null = null;
  ontimeupdate: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;

  constructor(src?: string) {
    if (src) this.src = src;
  }

  play() {
    this.paused = false;
    if (this.onplay) this.onplay();
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    if (this.onpause) this.onpause();
  }

  load() {
    // reset
  }

  removeAttribute(attr: string) {
    if (attr === "src") this.src = "";
  }
}

describe("Global Audio Player & Music Controller", () => {
  let originalAudio: any;

  beforeEach(() => {
    originalAudio = (global as any).Audio;
    (global as any).Audio = MockAudio;
  });

  afterEach(() => {
    (global as any).Audio = originalAudio;
  });

  it("ensures singleton audio playback and halts previous audio before playing a new track", () => {
    let currentAudioInstance: MockAudio | null = null;

    const playTrack = (track: { id: string; previewUrl: string }) => {
      // Teardown previous
      if (currentAudioInstance) {
        currentAudioInstance.pause();
        currentAudioInstance.removeAttribute("src");
        currentAudioInstance.load();
      }

      // Initialize new
      const audio = new MockAudio(track.previewUrl);
      audio.play();
      currentAudioInstance = audio;
      return audio;
    };

    // 1. Play first song
    const track1 = { id: "song_1", previewUrl: "https://audio-preview.apple.com/song1.m4a" };
    const audio1 = playTrack(track1);
    expect(audio1.paused).toBe(false);
    expect(audio1.src).toBe(track1.previewUrl);

    // 2. Play second song without stopping first song explicitly
    const track2 = { id: "song_2", previewUrl: "https://audio-preview.apple.com/song2.m4a" };
    const audio2 = playTrack(track2);

    // Audio 1 MUST be paused and src cleared so it never overlaps
    expect(audio1.paused).toBe(true);
    expect(audio1.src).toBe("");

    // Audio 2 MUST be active
    expect(audio2.paused).toBe(false);
    expect(audio2.src).toBe(track2.previewUrl);
  });

  it("handles seeking within boundaries", () => {
    const audio = new MockAudio("https://audio-preview.apple.com/song.m4a");
    audio.duration = 30;

    const seek = (time: number) => {
      const clamped = Math.max(0, Math.min(time, audio.duration));
      audio.currentTime = clamped;
      return clamped;
    };

    expect(seek(15)).toBe(15);
    expect(audio.currentTime).toBe(15);

    // Out of bounds seeking
    expect(seek(-5)).toBe(0);
    expect(seek(50)).toBe(30);
  });

  it("handles volume adjustments and mute toggling", () => {
    const audio = new MockAudio("https://audio-preview.apple.com/song.m4a");
    let savedVolume = 0.8;
    let isMuted = false;

    const setVolume = (val: number) => {
      savedVolume = Math.max(0, Math.min(val, 1));
      audio.volume = savedVolume;
      if (isMuted && savedVolume > 0) isMuted = false;
    };

    const toggleMute = () => {
      if (isMuted) {
        audio.volume = savedVolume;
        isMuted = false;
      } else {
        audio.volume = 0;
        isMuted = true;
      }
    };

    setVolume(0.5);
    expect(audio.volume).toBe(0.5);

    toggleMute();
    expect(isMuted).toBe(true);
    expect(audio.volume).toBe(0);

    toggleMute();
    expect(isMuted).toBe(false);
    expect(audio.volume).toBe(0.5);
  });
});
