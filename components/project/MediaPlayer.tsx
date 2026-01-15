"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Trash2, Upload, X, Volume2, VolumeX, SkipBack, SkipForward, Music2, Repeat, ChevronDown, ChevronUp, ListMusic } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface MusicRow {
  id: string;
  name: string;
  audio_url: string;
  persona?: string;
  is_default?: boolean;
}

interface Track {
  id: string;
  name: string;
  file?: File;  // Optional for remote URLs
  url: string;
  duration?: number;
  author?: string;
  source?: string;
}

interface MediaPlayerProps {
  open: boolean;
  onClose: () => void;
  positionClass?: string;
  externalTrackSelect?: Track | null; // External track selection from settings
  onExternalTrackProcessed?: () => void; // Callback to clear external selection
  onOpenSettingsMusic?: () => void; // Opens settings panel music tab
}

export default function MediaPlayer({ open, onClose, positionClass = "fixed right-6 top-24", externalTrackSelect, onExternalTrackProcessed, onOpenSettingsMusic }: MediaPlayerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isPlaylistExpanded, setIsPlaylistExpanded] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = createClient();

  // Fetch remote tracks from Supabase on mount
  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase.from('music').select('id, name, audio_url, persona');
      if (error) {
        console.error('Error fetching music tracks:', error);
      } else {
        const remoteTracks: Track[] = data.map((row: MusicRow) => ({
          id: row.id,
          name: row.name,
          url: row.audio_url,
          author: row.persona,
          source: undefined,
          file: undefined,
        }));
        setTracks(remoteTracks);
      }
    };
    fetchTracks();
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTrackSelect = useCallback((index: number, autoPlay: boolean = true) => {
    if (!audioRef.current) return;

    const track = tracks[index];
    if (!track) return;

    // Set loading state first
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    setDuration(0);

    // Stop current playback before loading new track to avoid AbortError
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    // Load new track
    audioRef.current.src = track.url;

    if (autoPlay) {
      const attemptPlay = () => {
        if (!audioRef.current) return;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.warn('Failed to auto-play track:', error);
          });
      };

      let fallbackTimeout: number | undefined;

      // Once metadata is ready, play immediately; otherwise fallback after short delay
      const metadataHandler = () => {
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout);
        }
        attemptPlay();
      };

      audioRef.current.addEventListener('loadedmetadata', metadataHandler, { once: true });

      fallbackTimeout = window.setTimeout(() => {
        audioRef.current?.removeEventListener('loadedmetadata', metadataHandler);
        attemptPlay();
      }, 150);
    }

  }, [tracks, isPlaying]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0 || currentTrackIndex === null) return;

    // If repeat is enabled, replay the current track
    if (isRepeat) {
      handleTrackSelect(currentTrackIndex);
      return;
    }

    if (currentTrackIndex < tracks.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      handleTrackSelect(nextIndex);
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [tracks, currentTrackIndex, handleTrackSelect, isRepeat]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      // If repeat is enabled, replay the current track
      if (isRepeat && currentTrackIndex !== null) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleNext, isRepeat, currentTrackIndex]);

  // Handle drawer close - music continues playing
  // User must explicitly pause the music using the pause button

  // Handle external track selection from settings (overrides current playback)
  useEffect(() => {
    if (externalTrackSelect && tracks.length > 0) {
      console.log('🎵 External track selection received:', externalTrackSelect.name);
      
      // Find the track index in our tracks array
      const trackIndex = tracks.findIndex(track => track.id === externalTrackSelect.id);
      
      if (trackIndex !== -1) {
        console.log('🎵 Found track at index:', trackIndex);
        handleTrackSelect(trackIndex);
      } else {
        // Track not in our current tracks array, add it and play it
        console.log('🎵 Track not found in current tracks, adding it');
        const newTrack: Track = {
          ...externalTrackSelect,
          duration: undefined,
          author: externalTrackSelect.author,
          source: 'settings'
        };
        
        setTracks(prev => [...prev, newTrack]);
        
        // Play the newly added track (it will be at the end)
        setTimeout(() => {
          const newIndex = tracks.length; // Will be at the end after state update
          handleTrackSelect(newIndex);
        }, 100);
      }
      
      // Clear the external selection after processing
      if (onExternalTrackProcessed) {
        setTimeout(() => {
          onExternalTrackProcessed();
        }, 1000); // Delay to ensure processing is complete
      }
    }
  }, [externalTrackSelect, tracks, handleTrackSelect]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const audioFiles = Array.from(files).filter(file =>
      file.type.startsWith('audio/')
    );

    const newTracks: Track[] = audioFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      file,
      url: URL.createObjectURL(file)
    }));

    setTracks(prev => [...prev, ...newTracks]);

  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || currentTrackIndex === null) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrackIndex]);

  const handlePrevious = useCallback(() => {
    if (tracks.length === 0 || currentTrackIndex === null) return;

    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    handleTrackSelect(prevIndex);
  }, [tracks, currentTrackIndex, handleTrackSelect]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressWidth = rect.width;
    const newTime = (clickX / progressWidth) * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleRemoveTrack = useCallback(async (index: number) => {
    const track = tracks[index];
    if (track) {
      if (track.file) {
        URL.revokeObjectURL(track.url);
      } else {
        // Remote track - delete from DB
        const { error } = await supabase.from('music').delete().eq('id', track.id);
        if (error) console.error('Error deleting remote track:', error);
      }
    }

    setTracks(prev => {
      const newTracks = prev.filter((_, i) => i !== index);
      return newTracks;
    });

    // Adjust current track index if necessary
    if (currentTrackIndex !== null) {
      if (index === currentTrackIndex) {
        // Currently playing track removed
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        setCurrentTrackIndex(null);
      } else if (index < currentTrackIndex) {
        setCurrentTrackIndex(currentTrackIndex - 1);
      }
    }
  }, [tracks, currentTrackIndex]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  return (
    <div
      className={`pointer-events-none ${positionClass} z-50 transition-all duration-300 ${
        open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div
        className="pointer-events-auto w-[340px] rounded-2xl border border-white/15 text-white shadow-[0_20px_70px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(135deg, rgba(18,18,18,0.98) 0%, rgba(24,24,24,0.96) 50%, rgba(18,18,18,0.98) 100%)",
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 p-1.5">
              <Music2 className="h-3.5 w-3.5 text-black" />
            </div>
            <p className="font-semibold text-sm text-white">Music Player</p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSettingsMusic && (
              <button
                type="button"
                aria-label="Open settings music tab"
                title="Open music settings"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettingsMusic();
                }}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                style={{ pointerEvents: 'auto' }}
              >
                <ListMusic className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              aria-label="Close media player"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="relative z-10 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ pointerEvents: 'auto' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Now Playing Section with Album Art */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            {/* Album Art */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                {currentTrack ? (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                    <Music2 className="h-7 w-7 text-black/80" />
                  </div>
                ) : (
                  <Music2 className="h-7 w-7 text-white/30" />
                )}
              </div>
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-400 rounded-full p-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                </div>
              )}
            </div>
            
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentTrack?.name ?? "No track selected"}
              </p>
              {currentTrack?.author ? (
                <p className="text-xs text-white/60 truncate">
                  {currentTrack.author}
                </p>
              ) : (
                <p className="text-xs text-white/50">Select a track to play</p>
              )}
              <p className="text-[10px] text-white/40 mt-0.5">{tracks.length} tracks in queue</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div
              className="group h-1 cursor-pointer rounded-full bg-white/10 hover:bg-white/15 transition-colors relative"
              onClick={handleProgressClick}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all relative"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-white/50 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2 flex-1">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={tracks.length === 0}
                className="rounded-full p-2 text-white/70 transition hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handlePlayPause}
                disabled={tracks.length === 0}
                className="rounded-full bg-white p-2.5 text-black shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={tracks.length === 0}
                className="rounded-full p-2 text-white/70 transition hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsRepeat(!isRepeat)}
                className={`rounded-full p-2 transition hover:bg-white/10 ${
                  isRepeat ? "text-emerald-400" : "text-white/70 hover:text-white"
                }`}
                title={isRepeat ? "Repeat: On" : "Repeat: Off"}
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>
            
            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-lg p-1.5 text-white/70 transition hover:text-white hover:bg-white/10"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <div className="relative w-20">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="volume-slider w-full h-1 cursor-pointer appearance-none rounded-full bg-transparent"
                  style={{
                    background: `linear-gradient(to right, rgb(52, 211, 153) 0%, rgb(52, 211, 153) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                  title="Volume"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Queue Section */}
        <div className="border-t border-white/10">
          <div className="px-4 py-2.5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-white/70">Queue</p>
              <button
                type="button"
                onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
                className="rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/10 transition"
                title={isPlaylistExpanded ? "Collapse" : "Expand"}
              >
                {isPlaylistExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition text-xs font-medium text-white"
            >
              <Upload className="h-3 w-3" />
              Add
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
          
          {/* Drag and Drop Zone (when empty) */}
          {isPlaylistExpanded && tracks.length === 0 && (
            <div
              className="mx-4 my-3 rounded-xl border-2 border-dashed border-white/20 p-6 text-center transition hover:border-white/30 hover:bg-white/5"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-full bg-white/10 p-3">
                  <Music2 className="h-5 w-5 text-white/50" />
                </div>
                <p className="text-xs font-medium text-white/70">No tracks yet</p>
                <p className="text-[10px] text-white/50">Drop files or click Add to begin</p>
              </div>
            </div>
          )}
          
          {/* Track List */}
          {isPlaylistExpanded && tracks.length > 0 && (
            <div className="max-h-52 overflow-y-auto custom-scrollbar">
              <div className="px-2 py-1.5 space-y-0.5">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                      index === currentTrackIndex
                        ? "bg-emerald-500/20 border border-emerald-400/30"
                        : "hover:bg-white/10 border border-transparent"
                    }`}
                    onClick={() => handleTrackSelect(index)}
                  >
                    {/* Track Number / Playing Indicator */}
                    <div className="flex-shrink-0 w-5 text-center">
                      {index === currentTrackIndex && isPlaying ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="w-0.5 h-3 bg-emerald-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                          <div className="w-0.5 h-2 bg-emerald-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                          <div className="w-0.5 h-3 bg-emerald-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <span className={`text-[10px] font-medium ${
                          index === currentTrackIndex ? "text-emerald-400" : "text-white/50 group-hover:text-white/70"
                        }`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    
                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        index === currentTrackIndex ? "text-emerald-400" : "text-white"
                      }`}>
                        {track.name}
                      </p>
                      {track.author && (
                        <p className="text-[10px] text-white/60 truncate">
                          {track.author}
                        </p>
                      )}
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTrack(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-white/60 hover:text-red-400 hover:bg-white/10 transition"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(52, 211, 153, 0.4);
          border-radius: 10px;
          transition: background 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(52, 211, 153, 0.6);
        }
        
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s;
        }
        
        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .volume-slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        
        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s;
        }
        
        .volume-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
        
        .volume-slider::-moz-range-thumb:active {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
