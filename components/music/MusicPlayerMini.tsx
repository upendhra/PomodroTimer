'use client';

import { useState } from 'react';
import { useMusic } from '@/hooks/useMusic';

export default function MusicPlayerMini() {
  const { selectedMusic, isPlaying, volume, togglePlay, setVolume } = useMusic();
  const [showFull, setShowFull] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'white', padding: 10, borderRadius: 8 }}>
      <p>{selectedMusic?.name || 'No track'}</p>
      <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
      <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
      <button onClick={() => setShowFull(true)}>Full Player</button>
      <input type="file" accept="audio/*" onChange={(e) => e.target.files && useMusic().setCustomMusic(e.target.files[0])} />
      {/* Full player modal placeholder */}
      {showFull && <div>Full Player Modal</div>}
    </div>
  );
}
