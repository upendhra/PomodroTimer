"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";

const TRACKS = [
  {
    id: "forest",
    title: "Forest Breeze",
    subtitle: "Calm woodland ambience",
    url: "https://cdn.pixabay.com/download/audio/2022/10/30/audio_3c162792e5.mp3?filename=forest-lullaby-124869.mp3",
  },
  {
    id: "waves",
    title: "Ocean Waves",
    subtitle: "Gentle shoreline rhythm",
    url: "https://cdn.pixabay.com/download/audio/2022/03/09/audio_4aa8bc3cb7.mp3?filename=the-ocean-110150.mp3",
  },
  {
    id: "rain",
    title: "Quiet Rain",
    subtitle: "Soft raindrops for deep focus",
    url: "https://cdn.pixabay.com/download/audio/2022/03/03/audio_284d27410b.mp3?filename=rain-ambient-110046.mp3",
  },
  {
    id: "piano",
    title: "Serene Keys",
    subtitle: "Minimal piano in the distance",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_beb644d5ec.mp3?filename=piano-ambient-110331.mp3",
  },
];

interface MusicDrawerProps {
  open: boolean;
  onClose: () => void;
  onTrackSelect?: (track: { id: string; title: string } | null) => void;
  currentTrackId?: string | null;
  positionClass?: string;
}

export default function MusicDrawer({ open, onClose, onTrackSelect, currentTrackId, positionClass = "absolute right-6 top-20" }: MusicDrawerProps) {
  const [activeTrack, setActiveTrack] = useState<string | null>(currentTrackId ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActiveTrack(currentTrackId ?? null);
  }, [currentTrackId]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [open]);

  const handleToggleTrack = (trackId: string, url: string) => {
    if (activeTrack === trackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setActiveTrack(trackId);
    setIsPlaying(true);
    const selected = TRACKS.find((t) => t.id === trackId);
    onTrackSelect?.(selected ? { id: selected.id, title: selected.title } : null);
    audio.onended = () => {
      setIsPlaying(false);
      setActiveTrack(null);
      onTrackSelect?.(null);
    };
  };

  return (
    <div
      className={`pointer-events-none ${positionClass} z-30 transition-all duration-300 ${
        open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div className="pointer-events-auto w-64 rounded-3xl border border-white/20 bg-white/10 p-4 text-white shadow-xl backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span>Tracks</span>
          <button
            type="button"
            aria-label="Close music drawer"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 p-1 text-white transition hover:bg-white/15"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {TRACKS.map((track) => {
            const isActive = activeTrack === track.id && isPlaying;
            return (
              <div
                key={track.id}
                className={`flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition ${
                  isActive ? "border-emerald-300/60 bg-emerald-400/10" : "hover:bg-white/10"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {track.title}
                  </p>
                  <p className="text-xs text-white/70">{track.subtitle}</p>
                </div>
                <button
                  type="button"
                  aria-label={isActive ? `Pause ${track.title}` : `Play ${track.title}`}
                  onClick={() => handleToggleTrack(track.id, track.url)}
                  className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                >
                  {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
