import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";

export interface PlayableTrack {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  previewUrl: string;
}

export interface AudioPlayerContextType {
  currentTrack: PlayableTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playTrack: (track: PlayableTrack) => void;
  togglePlay: (track?: PlayableTrack) => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(30);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Global teardown and stop helper
  const teardownAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      teardownAudio();
    };
  }, []);

  const playTrack = (track: PlayableTrack) => {
    if (!track.previewUrl) return;

    // 1. Immediately halt and tear down previous audio to guarantee zero overlapping playback
    teardownAudio();

    // 2. Initialize new Audio instance
    const audio = new Audio(track.previewUrl);
    audio.volume = isMuted ? 0 : volume;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    audio.onerror = (e) => {
      console.warn("[AudioPlayer] Error playing preview:", e);
      setIsPlaying(false);
    };

    audioRef.current = audio;
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(30);

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn("[AudioPlayer] Auto-play was interrupted or blocked:", err.message);
        setIsPlaying(false);
      });
  };

  const togglePlay = (track?: PlayableTrack) => {
    if (track && (!currentTrack || currentTrack.id !== track.id)) {
      playTrack(track);
      return;
    }

    if (!audioRef.current) {
      if (currentTrack) {
        playTrack(currentTrack);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[AudioPlayer] Resume failed:", err);
        });
    }
  };

  const pause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[AudioPlayer] Resume failed:", err);
        });
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      const target = Math.max(0, Math.min(seconds, duration || 30));
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(val, 1));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const stop = () => {
    teardownAudio();
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
};
