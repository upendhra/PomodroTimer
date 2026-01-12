'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useMusic } from '@/hooks/useMusic';
import ThemeWallpaperWrapper from '@/components/theme/ThemeWallpaperWrapper';

interface ThemeProviderProps {
  children: ReactNode;
}

const DEFAULT_SPOTLIGHT_THEME = 'spotlight-nebula-noir';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useTheme();
  const { selectedMusic, setAudioRef, volume, loopMode } = useMusic();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setAudioRef(audioRef.current);
  }, [setAudioRef]);

  useEffect(() => {
    if (audioRef.current && selectedMusic) {
      audioRef.current.src = selectedMusic.audio_url;
      audioRef.current.volume = volume;
      audioRef.current.loop = loopMode;
    }
  }, [selectedMusic, volume, loopMode]);

  // Load color scheme theme from localStorage on mount
  useEffect(() => {
    console.log('[ThemeProvider] Loading theme on mount');
    const savedTheme = localStorage.getItem('color-scheme-theme') || 'dark-mode';
    const normalizedTheme =
      savedTheme === 'spotlight-mode' ? DEFAULT_SPOTLIGHT_THEME : savedTheme;
    console.log('[ThemeProvider] Saved theme from localStorage:', savedTheme);
    document.documentElement.setAttribute('data-theme', normalizedTheme);
    console.log('[ThemeProvider] data-theme set on html:', document.documentElement.getAttribute('data-theme'));
  }, []);

  return (
    <ThemeWallpaperWrapper theme={theme}>
      <audio ref={audioRef} />
      {children}
    </ThemeWallpaperWrapper>
  );
}
