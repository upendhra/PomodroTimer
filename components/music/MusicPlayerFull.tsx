import { useState } from 'react';
import { useMusic } from '@/hooks/useMusic';

export default function MusicPlayerFull() {
  const { selectedMusic, isPlaying, volume, loopMode, togglePlay, setVolume, enableLoopMode, disableLoopMode } = useMusic();
  const [ambientMode, setAmbientMode] = useState(false);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
      <h2>{selectedMusic?.name || 'No track'}</h2>
      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
      <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
      <button onClick={loopMode ? disableLoopMode : enableLoopMode}>{loopMode ? 'Disable Loop' : 'Enable Loop'}</button>
      <button onClick={() => setAmbientMode(!ambientMode)}>{ambientMode ? 'Disable Ambient' : 'Enable Ambient'}</button>
      <div>Track List Placeholder</div>
      <div>Waveform Placeholder</div>
    </div>
  );
}
