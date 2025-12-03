interface MusicTrackItemProps {
  track: any;
  isActive: boolean;
  onSelect: () => void;
}

export default function MusicTrackItem({ track, isActive, onSelect }: MusicTrackItemProps) {
  return (
    <div onClick={onSelect} style={{ padding: 10, background: isActive ? 'lightblue' : 'white' }}>
      <p>{track.name}</p>
    </div>
  );
}
