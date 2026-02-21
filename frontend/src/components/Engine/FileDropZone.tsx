import { useState, useCallback } from "react";
import { Upload, FileVideo } from "lucide-react";

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export function FileDropZone({ onFileSelect, selectedFile }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2 w-full
                  border-2 border-dashed rounded-lg p-8 cursor-pointer
                  transition-all text-center
                  ${isDragging
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
    >
      <input
        type="file"
        accept="video/*,audio/*"
        className="sr-only"
        onChange={handleChange}
      />
      {selectedFile ? (
        <>
          <FileVideo size={24} className="text-emerald-500" />
          <p className="text-sm text-gray-300 font-medium">{selectedFile.name}</p>
          <p className="text-xs text-gray-600">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </>
      ) : (
        <>
          <Upload size={24} className="text-gray-500" />
          <p className="text-sm text-gray-400">
            Drop a video file here, or{" "}
            <span className="text-emerald-500 font-medium">browse</span>
          </p>
          <p className="text-xs text-gray-600">MP4, MOV, MP3, WAV — up to 500MB</p>
        </>
      )}
    </label>
  );
}
