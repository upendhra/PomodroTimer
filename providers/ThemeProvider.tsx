'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useMusic } from '@/hooks/useMusic';
import ThemeWallpaperWrapper from '@/components/theme/ThemeWallpaperWrapper';

interface ThemeProviderProps {
  children: ReactNode;
}

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

  return (
    <ThemeWallpaperWrapper theme={theme}>
      <audio ref={audioRef} />
      {children}
    </ThemeWallpaperWrapper>
  );
}
