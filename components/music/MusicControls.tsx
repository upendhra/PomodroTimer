import { useMusic } from '@/hooks/useMusic';

export default function MusicControls() {
  const { togglePlay, nextTrack, previousTrack } = useMusic();

  return (
    <div>
      <button onClick={previousTrack}>Prev</button>
      <button onClick={togglePlay}>Play/Pause</button>
      <button onClick={nextTrack}>Next</button>
    </div>
  );
}
