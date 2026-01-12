'use client';

import { useEffect, useState, useRef } from 'react';
import { Check, Link, Info, ChevronDown, ChevronUp, Music } from 'lucide-react';
import SpotifyPlaylistSelector from './SpotifyPlaylistSelector';

interface SpotifyEmbedProps {
  playlistId?: string;
  compact?: boolean;
  className?: string;
  onPlaylistChange?: (playlistId: string) => void;
}

export default function SpotifyEmbed({
  playlistId = "37i9dQZF1DXcBWIGoYBM5M", // Today's Top Hits - known working playlist
  compact = true,
  className = "",
  onPlaylistChange
}: SpotifyEmbedProps) {
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(playlistId);
  const [currentContentType, setCurrentContentType] = useState<'playlist' | 'album' | 'track'>('playlist');
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSpotifyExpanded, setIsSpotifyExpanded] = useState<boolean>(false);

  // Drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 200 }); // Default position - will be updated on mount
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  // Extract Spotify ID and type from URL
  const extractSpotifyId = (url: string): { id: string; type: 'playlist' | 'album' | 'track' } | null => {
    try {
      // Handle various Spotify URL formats
      // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
      // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
      const playlistMatch = url.match(/playlist[\/:]([a-zA-Z0-9]+)/);
      const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);
      const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
      
      if (playlistMatch && playlistMatch[1]) {
        return { id: playlistMatch[1], type: 'playlist' };
      } else if (albumMatch && albumMatch[1]) {
        return { id: albumMatch[1], type: 'album' };
      } else if (trackMatch && trackMatch[1]) {
        return { id: trackMatch[1], type: 'track' };
      }
    } catch (error) {
      console.error('Error extracting Spotify ID:', error);
    }
    return null;
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    const result = extractSpotifyId(urlInput);
    if (result) {
      setCurrentPlaylistId(result.id);
      setCurrentContentType(result.type);
      setInputError(false);
      setHasError(false);
      if (onPlaylistChange) {
        onPlaylistChange(result.id);
      }
      setUrlInput('');
    } else {
      setInputError(true);
      setTimeout(() => setInputError(false), 2000);
    }
  };

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') || '';
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
      setIsLightTheme(lightThemes.includes(theme));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  const handleIframeError = () => {
    setHasError(true);
  };

  const handleIframeLoad = () => {
    setHasError(false);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current) return;

    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Constrain to viewport bounds
    const maxX = window.innerWidth - 320; // Account for component width
    const maxY = window.innerHeight - 200; // Account for component height

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    // Set initial position to bottom-left after component mounts (client-side only)
    if (typeof window !== 'undefined') {
      setPosition({ x: 16, y: window.innerHeight - 200 });
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const playerHeight = compact ? 152 : 352;
  const playerWidth = compact ? "100%" : "100%";

  if (hasError) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 text-xs font-medium"
               style={{ color: isLightTheme ? 'var(--text-secondary, #475569)' : 'rgba(255, 255, 255, 0.7)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.6-.12-.421.18-.78.6-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.241 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.16-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.04-1.02 15.12 1.84.559.24.72 1.02.36 1.56-.302.42-.84.6-1.261.3z"/>
            </svg>
            <span>Spotify Unavailable</span>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden p-4 text-center"
             style={{
               backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)',
               border: isLightTheme ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
               color: isLightTheme ? 'var(--text-primary, #0B1220)' : 'rgba(255, 255, 255, 0.7)'
             }}>
          <p className="text-sm mb-2">Unable to load Spotify player</p>
          <p className="text-xs mb-2">This may be due to:</p>
          <ul className="text-xs text-left list-disc list-inside space-y-1">
            <li>Network connectivity issues</li>
            <li>Regional restrictions</li>
            <li>Playlist not publicly available</li>
          </ul>
          <p className="text-xs mt-2">Try refreshing or check your internet connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      className={`absolute z-30 w-72 max-w-[calc(100vw-2rem)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{
        left: position.x,
        top: position.y,
        touchAction: 'none' // Prevent scrolling on touch devices
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Spotify Branding */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1 text-xs font-medium"
             style={{ color: isLightTheme ? 'var(--text-secondary, #475569)' : 'rgba(255, 255, 255, 0.7)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.6-.12-.421.18-.78.6-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.241 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.16-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.04-1.02 15.12 1.84.559.24.72 1.02.36 1.56-.302.42-.84.6-1.261.3z"/>
          </svg>
          <span>Spotify</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSpotifyExpanded(!isSpotifyExpanded);
            }}
            className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
            title={isSpotifyExpanded ? "Hide Spotify controls" : "Show Spotify controls"}
          >
            {isSpotifyExpanded ? (
              <ChevronUp className="w-4 h-4" style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }} />
            )}
          </button>
          <span className="text-[10px] opacity-60">Drag</span>
        </div>
      </div>

      {/* Spotify Content - OAuth section conditionally rendered */}
      {isSpotifyExpanded && (
        <>
          {/* OAuth Playlist Selector */}
          <SpotifyPlaylistSelector
            onPlaylistSelect={(playlistId) => {
              setCurrentPlaylistId(playlistId);
              setCurrentContentType('playlist');
              if (onPlaylistChange) {
                onPlaylistChange(playlistId);
              }
            }}
            isLightTheme={isLightTheme}
          />

          {/* Divider */}
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px" style={{ backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }} />
            <span className="text-xs" style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.5)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }} />
          </div>
        </>
      )}

      {/* Custom URL Input Field - Always Visible */}
      <div
        className="mb-2 relative"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Help Icon and Tooltip */}
        <div className="flex justify-end mb-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHelp(!showHelp);
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="How to use custom Spotify URLs"
          >
            <Info className="w-4 h-4" style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }} />
          </button>
        </div>

        {/* Help Tooltip */}
        {showHelp && (
          <div
            className="mb-2 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.6)',
              border: isLightTheme ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLightTheme ? '#0f172a' : '#fff'
            }}
          >
            <div className="font-semibold mb-2">🎵 How to Play Your Spotify Music</div>
            <div className="space-y-1">
              <div><strong>Without Login:</strong> 30-second previews only</div>
              <div><strong>With Login:</strong> Full playlist access</div>
              <div className="mt-2">
                <strong>To add your music:</strong>
              </div>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open Spotify app/web</li>
                <li>Find your playlist/album/song</li>
                <li>Click "Share" → "Copy Link"</li>
                <li>Paste URL below → Click ✓</li>
              </ol>
            </div>
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <div className="flex-1 relative">
            <Link
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.5)' }}
            />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setInputError(false);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="Paste Spotify playlist/album/track URL"
              className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border-2 outline-none transition-all"
              style={{
                backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.4)',
                borderColor: inputError
                  ? '#ef4444'
                  : isLightTheme
                    ? 'rgba(0, 0, 0, 0.15)'
                    : 'rgba(255, 255, 255, 0.2)',
                color: isLightTheme ? '#0f172a' : '#fff',
                boxShadow: inputError
                  ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                  : 'none'
              }}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUrlSubmit();
            }}
            disabled={!urlInput.trim()}
            className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
            style={{
              backgroundColor: '#1DB954',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(29, 185, 84, 0.3)'
            }}
            title="Load playlist"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
        {inputError && (
          <p className="text-xs mt-1 ml-1" style={{ color: '#ef4444' }}>
            Invalid Spotify URL. Please check and try again.
          </p>
        )}
      </div>

      {/* Embed Container */}
      <div className="relative rounded-lg overflow-hidden"
           style={{
             backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)',
             border: isLightTheme ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(255, 255, 255, 0.1)',
             boxShadow: isLightTheme
               ? 'var(--glass-shadow-1, 0 8px 32px rgba(31, 38, 135, 0.12)), var(--glass-shadow-2, 0 2px 8px rgba(31, 38, 135, 0.08))'
               : '0 8px 32px rgba(0, 0, 0, 0.3)'
           }}>
        <iframe
          src={`https://open.spotify.com/embed/${currentContentType}/${currentPlaylistId}?utm_source=generator&theme=0`}
          width={playerWidth}
          height={playerHeight}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            display: 'block',
            pointerEvents: isDragging ? 'none' : 'auto'
          }}
        />
      </div>
    </div>
  );
}
