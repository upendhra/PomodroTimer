'use client';

import { useState, useEffect } from 'react';
import { Music2, LogIn, LogOut, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
  public: boolean;
}

interface SpotifyPlaylistSelectorProps {
  onPlaylistSelect: (playlistId: string) => void;
  isLightTheme?: boolean;
}

export default function SpotifyPlaylistSelector({
  onPlaylistSelect,
  isLightTheme = false,
}: SpotifyPlaylistSelectorProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/spotify/status');
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
        setUserName(data.user?.display_name || 'User');
        fetchPlaylists();
      } else if (data.needsRefresh && data.hasRefreshToken) {
        await refreshToken();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/spotify/refresh', { method: 'POST' });
      if (response.ok) {
        await checkAuthStatus();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  const fetchPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/spotify/playlists');
      const data = await response.json();

      if (data.needsRefresh) {
        await refreshToken();
        return;
      }

      if (data.success) {
        setPlaylists(data.playlists);
      } else {
        setError(data.error || 'Failed to fetch playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // Show coming soon alert during Spotify maintenance
    alert(`🎵 Spotify Account Connection - Coming Soon!\n\nSpotify is currently updating their developer platform for better reliability.\n\nFor now, please use the manual URL input below:\n• Open Spotify → Find your playlist → Share → Copy Link\n• Paste the URL in the input field → Click the checkmark\n\nFull playlist access will work perfectly!`);

    // Optionally highlight the URL input field
    const urlInput = document.querySelector('input[placeholder*="Spotify playlist"]') as HTMLInputElement;
    if (urlInput) {
      urlInput.focus();
      urlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/spotify/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setPlaylists([]);
      setUserName('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    onPlaylistSelect(playlistId);
    setIsExpanded(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="mb-2">
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: '#1DB954',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(29, 185, 84, 0.3)',
          }}
        >
          <LogIn className="w-4 h-4" />
          <span>Connect Spotify Account</span>
        </button>
        <p
          className="text-xs text-center mt-2"
          style={{
            color: isLightTheme ? 'var(--text-tertiary, #64748B)' : 'rgba(255, 255, 255, 0.5)',
          }}
        >
          Access your personal playlists automatically
        </p>
      </div>
    );
  }

  return (
    <div className="mb-2">
      {/* Header with user info and logout */}
      <div
        className="flex items-center justify-between p-2 rounded-lg mb-2"
        style={{
          backgroundColor: isLightTheme ? 'rgba(29, 185, 84, 0.1)' : 'rgba(29, 185, 84, 0.15)',
          border: isLightTheme ? '1px solid rgba(29, 185, 84, 0.2)' : '1px solid rgba(29, 185, 84, 0.3)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#1DB954' }}
          >
            <Music2 className="w-3 h-3 text-white" />
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: isLightTheme ? '#0f172a' : '#fff' }}
          >
            {userName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-1 rounded hover:bg-black/10 transition-colors"
          title="Disconnect Spotify"
        >
          <LogOut
            className="w-4 h-4"
            style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }}
          />
        </button>
      </div>

      {/* Playlist selector */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.4)',
            border: isLightTheme ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(255, 255, 255, 0.2)',
            color: isLightTheme ? '#0f172a' : '#fff',
          }}
        >
          <span className="text-sm">
            {playlists.length > 0 ? `${playlists.length} Playlists` : 'Load Playlists'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Playlist dropdown */}
        {isExpanded && (
          <div
            className="mt-2 rounded-lg overflow-hidden"
            style={{
              backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.6)',
              border: isLightTheme ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(255, 255, 255, 0.2)',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <RefreshCw
                  className="w-5 h-5 mx-auto animate-spin"
                  style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }}
                />
                <p
                  className="text-xs mt-2"
                  style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }}
                >
                  Loading playlists...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-xs" style={{ color: '#ef4444' }}>
                  {error}
                </p>
                <button
                  onClick={fetchPlaylists}
                  className="mt-2 text-xs px-3 py-1 rounded"
                  style={{
                    backgroundColor: '#1DB954',
                    color: '#fff',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : playlists.length === 0 ? (
              <div className="p-4 text-center">
                <p
                  className="text-xs"
                  style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }}
                >
                  No playlists found
                </p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handlePlaylistClick(playlist.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-black/10 transition-colors text-left"
                >
                  {playlist.images[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-10 h-10 rounded"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center"
                      style={{ backgroundColor: isLightTheme ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <Music2 className="w-5 h-5" style={{ color: '#1DB954' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isLightTheme ? '#0f172a' : '#fff' }}
                    >
                      {playlist.name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: isLightTheme ? '#64748B' : 'rgba(255, 255, 255, 0.6)' }}
                    >
                      {playlist.tracks.total} tracks • {playlist.owner.display_name}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
