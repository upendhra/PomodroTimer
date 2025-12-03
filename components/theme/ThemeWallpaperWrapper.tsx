import { ReactNode } from 'react';

interface Theme {
  wallpaper_url?: string;
}

interface ThemeWallpaperWrapperProps {
  theme: Theme | null;
  children: ReactNode;
}

export default function ThemeWallpaperWrapper({ theme, children }: ThemeWallpaperWrapperProps) {
  const backgroundImage = theme?.wallpaper_url ? `url(${theme.wallpaper_url})` : 'none';

  return (
    <div
      style={{
        backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(2px)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        transition: 'background-image 0.5s ease-in-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Overlay
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
