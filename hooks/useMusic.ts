import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MusicState {
  userSelectedMusic: any;
  projectMusic: any;
  customMusic: string | null;
  currentMusic: any;
  isPlaying: boolean;
  volume: number;
  loopMode: boolean;
  currentTrackIndex: number;
  trackQueue: any[];
  audioRef: HTMLAudioElement | null;
  setUserSelectedMusic: (id: string) => Promise<void>;
  setProjectMusic: (id: string | null) => Promise<void>;
  setCustomMusic: (file: File) => void;
  clearCustomMusic: () => void;
  resolveMusic: () => Promise<void>;
  setAudioRef: (ref: HTMLAudioElement | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (vol: number) => void;
  enableLoopMode: () => void;
  disableLoopMode: () => void;
  fadeIn: (duration: number) => void;
  fadeOut: (duration: number) => void;
  autoFadeWhenSwitchingTracks: () => void;
}

const useMusicStore = create<MusicState>((set, get) => ({
  userSelectedMusic: null,
  projectMusic: null,
  customMusic: null,
  currentMusic: null,
  isPlaying: false,
  volume: 0.5,
  loopMode: false,
  currentTrackIndex: 0,
  trackQueue: [],
  audioRef: null,

  setUserSelectedMusic: async (id: string) => {
    const { data } = await supabase.from('music').select('*').eq('id', id).single();
    set({ userSelectedMusic: data });
    get().resolveMusic();
  },

  setProjectMusic: async (id: string | null) => {
    const music = id ? await supabase.from('music').select('*').eq('id', id).single().then(({ data }) => data) : null;
    set({ projectMusic: music });
    get().resolveMusic();
  },

  setCustomMusic: (file: File) => {
    const url = URL.createObjectURL(file);
    set({ customMusic: url });
    get().resolveMusic();
  },

  clearCustomMusic: () => {
    const { customMusic } = get();
    if (customMusic) URL.revokeObjectURL(customMusic);
    set({ customMusic: null });
    get().resolveMusic();
  },

  resolveMusic: async () => {
    const { projectMusic, customMusic, userSelectedMusic } = get();
    let music = projectMusic;
    if (customMusic) {
      music = { audio_url: customMusic };
    } else if (!music && userSelectedMusic) {
      music = userSelectedMusic;
    } else if (!music) {
      // Default persona music
      const { data } = await supabase.from('music').select('*').eq('persona', 'student').eq('is_default', true).single();
      music = data;
    }
    set({ currentMusic: music });
    get().autoFadeWhenSwitchingTracks();
  },

  setAudioRef: (ref) => set({ audioRef: ref }),

  play: () => {
    const { audioRef } = get();
    if (audioRef) {
      audioRef.play();
      set({ isPlaying: true });
    }
  },

  pause: () => {
    const { audioRef } = get();
    if (audioRef) {
      audioRef.pause();
      set({ isPlaying: false });
    }
  },

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) get().pause();
    else get().play();
  },

  nextTrack: () => {
    const { trackQueue, currentTrackIndex } = get();
    if (trackQueue.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % trackQueue.length;
      set({ currentTrackIndex: nextIndex, currentMusic: trackQueue[nextIndex] });
    }
  },

  previousTrack: () => {
    const { trackQueue, currentTrackIndex } = get();
    if (trackQueue.length > 0) {
      const prevIndex = (currentTrackIndex - 1 + trackQueue.length) % trackQueue.length;
      set({ currentTrackIndex: prevIndex, currentMusic: trackQueue[prevIndex] });
    }
  },

  setVolume: (vol: number) => {
    const { audioRef } = get();
    if (audioRef) audioRef.volume = vol;
    set({ volume: vol });
  },

  enableLoopMode: () => {
    const { audioRef } = get();
    if (audioRef) audioRef.loop = true;
    set({ loopMode: true });
  },

  disableLoopMode: () => {
    const { audioRef } = get();
    if (audioRef) audioRef.loop = false;
    set({ loopMode: false });
  },

  fadeIn: (duration: number) => {
    const { audioRef, volume } = get();
    if (!audioRef) return;
    const steps = 20;
    const stepDuration = duration / steps;
    const stepVolume = volume / steps;
    let currentStep = 0;
    const fade = setInterval(() => {
      currentStep++;
      audioRef.volume = (stepVolume * currentStep);
      if (currentStep >= steps) clearInterval(fade);
    }, stepDuration);
  },

  fadeOut: (duration: number) => {
    const { audioRef } = get();
    if (!audioRef) return;
    const steps = 20;
    const stepDuration = duration / steps;
    const startVolume = audioRef.volume;
    const stepVolume = startVolume / steps;
    let currentStep = 0;
    const fade = setInterval(() => {
      currentStep++;
      audioRef.volume = startVolume - (stepVolume * currentStep);
      if (currentStep >= steps) {
        clearInterval(fade);
        audioRef.pause();
      }
    }, stepDuration);
  },

  autoFadeWhenSwitchingTracks: () => {
    const { audioRef, currentMusic } = get();
    if (audioRef && currentMusic) {
      get().fadeOut(1000);
      setTimeout(() => {
        audioRef.src = currentMusic.audio_url;
        get().fadeIn(1000);
      }, 1000);
    }
  },
}));

export const useMusic = () => {
  const store = useMusicStore();
  return {
    selectedMusic: store.currentMusic,
    isPlaying: store.isPlaying,
    volume: store.volume,
    loopMode: store.loopMode,
    setMusic: store.setUserSelectedMusic,
    applyProjectMusic: store.setProjectMusic,
    setCustomMusic: store.setCustomMusic,
    clearCustomMusic: store.clearCustomMusic,
    setAudioRef: store.setAudioRef,
    play: store.play,
    pause: store.pause,
    togglePlay: store.togglePlay,
    nextTrack: store.nextTrack,
    previousTrack: store.previousTrack,
    setVolume: store.setVolume,
    enableLoopMode: store.enableLoopMode,
    disableLoopMode: store.disableLoopMode,
    fadeIn: store.fadeIn,
    fadeOut: store.fadeOut,
  };
};