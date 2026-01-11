"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Trash2, Upload, X, Volume2, VolumeX } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface MusicRow {
  id: string;
  name: string;
  audio_url: string;
}

interface Track {
  id: string;
  name: string;
  file?: File;  // Optional for remote URLs
  url: string;
  duration?: number;
}

interface MediaPlayerProps {
  open: boolean;
  onClose: () => void;
  positionClass?: string;
}

export default function MediaPlayer({ open, onClose, positionClass = "fixed right-6 top-24" }: MediaPlayerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = createClient();

  // Fetch remote tracks from Supabase on mount
  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase.from('music').select('id, name, audio_url');
      if (error) {
        console.error('Error fetching music tracks:', error);
      } else {
        const remoteTracks: Track[] = data.map((row: MusicRow) => ({
          id: row.id,
          name: row.name,
          url: row.audio_url,
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

  const handleTrackSelect = useCallback((index: number) => {
    if (!audioRef.current) return;

    const track = tracks[index];
    if (!track) return;

    // Pause current if playing
    if (isPlaying) {
      audioRef.current.pause();
    }

    // Load new track
    audioRef.current.src = track.url;
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    setDuration(0);

    // Auto-play new track
    audioRef.current.play();
    setIsPlaying(true);
  }, [tracks, isPlaying]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0 || currentTrackIndex === null) return;

    if (currentTrackIndex < tracks.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      handleTrackSelect(nextIndex);
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [tracks, currentTrackIndex, handleTrackSelect]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [tracks]);

  // Handle drawer close
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [open]);

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
      className={`pointer-events-none ${positionClass} z-30 transition-all duration-300 ${
        open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div
        className="pointer-events-auto w-[320px] rounded-[24px] border border-white/10 p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(160deg, rgba(20,24,40,0.96) 0%, rgba(10,12,24,0.92) 70%, rgba(8,10,20,0.9) 100%)",
        }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.35em] text-white/40">Player</p>
            <p className="font-heading text-base font-semibold text-white">Compact Deck</p>
          </div>
          <button
            type="button"
            aria-label="Close media player"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 p-1.5 text-white transition hover:bg-white/15"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Upload */}
        <div
          className="mb-3 rounded-2xl border border-dashed border-white/20 p-3 text-center text-xs text-white/65 transition hover:border-white/40"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mx-auto flex flex-col items-center gap-1 text-white/70 hover:text-white transition"
          >
            <div className="rounded-xl bg-white/10 p-2">
              <Upload className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-medium">Drop or browse files</span>
          </button>
        </div>

        {/* Now playing + progress */}
        <div className="mb-2 rounded-2xl border border-white/10 bg-white/5/10 p-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.35em] text-white/40">Now</span>
              <span className="text-xs font-semibold text-white truncate">
                {currentTrack?.name ?? "Add a track"}
              </span>
              <span className="text-[10px] text-white/50">{tracks.length} in queue</span>
            </div>
          </div>
          <div
            className="mt-3 h-0.5 cursor-pointer rounded-full bg-white/15"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-white/45">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex flex-1 items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={tracks.length === 0}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-white transition hover:bg-white/15 disabled:opacity-40"
            >
              <span className="text-xs">⏮</span>
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={tracks.length === 0}
              className="rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2.5 text-black shadow-[0_12px_25px_rgba(45,212,191,0.45)] transition hover:scale-[1.02] disabled:opacity-70"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={tracks.length === 0}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-white transition hover:bg-white/15 disabled:opacity-40"
            >
              <span className="text-xs">⏭</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/15"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400"
            />
          </div>
        </div>

        {/* Playlist */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Playlist</p>
          </div>
          <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent">
            {tracks.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 py-4 text-center text-xs text-white/45">
                Empty queue · upload to begin
              </div>
            ) : (
              <div className="space-y-1.5">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition ${
                      index === currentTrackIndex
                        ? "border-emerald-300/40 bg-emerald-400/10"
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleTrackSelect(index)}
                      className="flex flex-1 flex-col text-left"
                    >
                      <span className="font-semibold text-white truncate">{track.name}</span>
                      <span className="text-[10px] text-white/45">Track {index + 1}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrack(index)}
                      className="rounded-full border border-white/10 bg-white/5 p-1 text-white/60 transition hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
