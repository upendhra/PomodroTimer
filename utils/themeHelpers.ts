// Helper to detect if current theme is a light theme
export function isLightTheme(themeName: string | null): boolean {
  if (!themeName) return false;
  
  const lightThemes = [
    'spotlight-morning-glow',
    'spotlight-pastel-studio',
    'spotlight-cloud-beam',
    'spotlight-golden-hour',
    'spotlight-minimal-veil',
    'spotlight-royal-porcelain',
    'spotlight-pearl-aurora',
    'spotlight-champagne-silk'
  ];
  
  return lightThemes.includes(themeName);
}

// Get current theme from document
export function getCurrentTheme(): string | null {
  if (typeof document === 'undefined') return null;
  return document.documentElement.getAttribute('data-theme');
}

// Check if current active theme is light
export function isCurrentThemeLight(): boolean {
  return isLightTheme(getCurrentTheme());
}
