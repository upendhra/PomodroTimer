interface MusicVolumeSliderProps {
  volume: number;
  onChange: (vol: number) => void;
}

export default function MusicVolumeSlider({ volume, onChange }: MusicVolumeSliderProps) {
  return (
    <input
      type="range"
      min="0"
      max="1"
      step="0.1"
      value={volume}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  );
}
