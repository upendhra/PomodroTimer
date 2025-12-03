import { useMusic } from '@/hooks/useMusic';

export default function MusicUploadBox() {
  const { setCustomMusic } = useMusic();

  const handleFile = (file: File) => {
    if (file.type.startsWith('audio/')) {
      setCustomMusic(file);
    } else {
      alert('Invalid file type');
    }
  };

  return (
    <div
      style={{ border: '2px dashed gray', padding: 20 }}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input type="file" accept="audio/mp3,audio/wav,audio/aac" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
      <p>Drag and drop audio file or click to upload</p>
    </div>
  );
}
