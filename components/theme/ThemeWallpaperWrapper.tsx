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
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-slate-950 transition-opacity duration-500"
          style={{ opacity: hasWallpaper ? 0 : 1 }}
        />
        {hasWallpaper && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-[80px] transition-[opacity,transform,background-image] duration-500"
            style={{
              backgroundImage,
              opacity: 0.7,
              transform: 'scale(1.05)',
            }}
          />
        )}
        <div
          className="absolute inset-0 bg-center bg-no-repeat transition-[opacity,transform,background-image] duration-500"
          style={{
            backgroundImage,
            opacity: hasWallpaper ? 1 : 0,
            transform: 'scale(1)',
            backgroundSize,
          }}
        />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
