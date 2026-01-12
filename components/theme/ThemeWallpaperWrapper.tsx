import { ReactNode, useEffect, useState } from 'react';

interface Theme {
  wallpaper_url?: string;
}

interface ThemeWallpaperWrapperProps {
  theme: Theme | null;
  children: ReactNode;
}

export default function ThemeWallpaperWrapper({ theme, children }: ThemeWallpaperWrapperProps) {
  const backgroundImage = theme?.wallpaper_url ? `url(${theme.wallpaper_url})` : undefined;
  const hasWallpaper = Boolean(backgroundImage);
  const [backgroundSize, setBackgroundSize] = useState<'cover' | 'contain'>('cover');

  // Check if any Spotlight Mode preset is active - don't show wallpapers in this case
  const currentTheme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;
  const isSpotlightMode = currentTheme?.startsWith('spotlight-') || false;
  const shouldShowWallpaper = hasWallpaper && !isSpotlightMode;

  console.log('[ThemeWallpaperWrapper] Render:', {
    hasWallpaper,
    wallpaperUrl: theme?.wallpaper_url,
    dataTheme: typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'SSR',
    isSpotlightMode,
    shouldShowWallpaper
  });

  useEffect(() => {
    if (!theme?.wallpaper_url) {
      setBackgroundSize('cover');
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.src = theme.wallpaper_url;
    img.onload = () => {
      if (cancelled) return;
      const imageRatio = img.width / img.height;
      const screenRatio = window.innerWidth / window.innerHeight;
      if (imageRatio >= 1.2 || imageRatio >= screenRatio * 0.9) {
        setBackgroundSize('cover');
      } else {
        setBackgroundSize('contain');
      }
    };
    img.onerror = () => {
      if (!cancelled) setBackgroundSize('cover');
    };

    return () => {
      cancelled = true;
    };
  }, [theme?.wallpaper_url]);

  return (
    <div className="relative min-h-screen">
      {shouldShowWallpaper && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center blur-[80px] transition-[opacity,transform,background-image] duration-500"
            style={{
              backgroundImage,
              opacity: 0.7,
              transform: 'scale(1.05)',
            }}
          />
          <div
            className="absolute inset-0 bg-center bg-no-repeat transition-[opacity,transform,background-image] duration-500"
            style={{
              backgroundImage,
              opacity: 1,
              transform: 'scale(1)',
              backgroundSize,
            }}
          />
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
