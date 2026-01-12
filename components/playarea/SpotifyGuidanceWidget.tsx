'use client';

import { useState } from 'react';
import { X, Music, ExternalLink } from 'lucide-react';

interface SpotifyGuidanceWidgetProps {
  onDismiss: () => void;
  isLightTheme?: boolean;
}

export default function SpotifyGuidanceWidget({
  onDismiss,
  isLightTheme = false
}: SpotifyGuidanceWidgetProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(), 300); // Allow fade-out animation
  };

  if (!isVisible) return null;

  return (
    <div
      className={`absolute bottom-0 left-0 w-80 max-w-[calc(100vw-2rem)] z-40 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        transform: 'translateY(-210px)', // Position above Spotify player
        marginLeft: '16px'
      }}
    >
      <div
        className="rounded-lg p-4 shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: isLightTheme
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(15, 23, 42, 0.95)',
          border: isLightTheme
            ? '1px solid rgba(0, 0, 0, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isLightTheme
            ? '0 10px 40px rgba(0, 0, 0, 0.1)'
            : '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: isLightTheme
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(34, 197, 94, 0.2)'
              }}
            >
              <Music
                className="w-5 h-5"
                style={{ color: '#1DB954' }}
              />
            </div>
            <div>
              <h3
                className="font-semibold text-sm"
                style={{
                  color: isLightTheme
                    ? 'var(--text-primary, #0B1220)'
                    : '#ffffff'
                }}
              >
                Connect Your Spotify
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-black/10 transition-colors"
            aria-label="Dismiss"
          >
            <X
              className="w-4 h-4"
              style={{
                color: isLightTheme
                  ? 'var(--text-secondary, #475569)'
                  : 'rgba(255, 255, 255, 0.6)'
              }}
            />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p
            className="text-sm leading-relaxed"
            style={{
              color: isLightTheme
                ? 'var(--text-secondary, #475569)'
                : 'rgba(255, 255, 255, 0.8)'
            }}
          >
            Play your own playlists during focus sessions! Log in to your Spotify account to access your personal music library.
          </p>

          {/* Steps */}
          <div className="space-y-2">
            <div
              className="text-xs font-medium uppercase tracking-wider"
              style={{
                color: isLightTheme
                  ? 'var(--text-tertiary, #64748B)'
                  : 'rgba(255, 255, 255, 0.5)'
              }}
            >
              Quick Setup:
            </div>
            <ol className="space-y-2 text-sm">
              {[
                'Click the Spotify player below',
                'Log in with your Spotify account',
                'Browse and play your playlists'
              ].map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2"
                  style={{
                    color: isLightTheme
                      ? 'var(--text-secondary, #475569)'
                      : 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      backgroundColor: isLightTheme
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(34, 197, 94, 0.2)',
                      color: '#1DB954'
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA Button */}
          <a
            href="https://www.spotify.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: '#1DB954',
              color: '#ffffff'
            }}
          >
            <span>Don't have Spotify?</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Dismiss hint */}
          <p
            className="text-xs text-center"
            style={{
              color: isLightTheme
                ? 'var(--text-tertiary, #64748B)'
                : 'rgba(255, 255, 255, 0.4)'
            }}
          >
            Click × to dismiss this message
          </p>
        </div>
      </div>

      {/* Arrow pointing to Spotify player */}
      <div
        className="absolute left-8 -bottom-2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: isLightTheme
            ? '8px solid rgba(255, 255, 255, 0.95)'
            : '8px solid rgba(15, 23, 42, 0.95)'
        }}
      />
    </div>
  );
}
