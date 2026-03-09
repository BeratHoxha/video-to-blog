import { useState, useCallback } from "react";
import { Upload, FileVideo } from "lucide-react";

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

interface FileDropZoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  maxSize?: number;
}

export function FileDropZone({
  onFileSelect,
  selectedFile,
  maxSize = MAX_SIZE_BYTES,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > maxSize) {
        setSizeError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${(maxSize / 1024 / 1024).toFixed(0)} MB.`
        );
        onFileSelect(null);
        return;
      }
      setSizeError(null);
      onFileSelect(file);
    },
    [onFileSelect, maxSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <label
        htmlFor="file-drop-input"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 w-full
                    border-2 border-dashed rounded-lg p-8 cursor-pointer
                    transition-all text-center
                    ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-500/10"
                        : sizeError
                          ? "border-red-500/60 bg-red-500/5"
                          : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
                    }`}
      >
        <input
          id="file-drop-input"
          type="file"
          aria-label="Upload video or audio file"
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
            <Upload size={24} className={sizeError ? "text-red-400" : "text-gray-500"} />
            <p className="text-sm text-gray-400">
              Drop a video file here, or{" "}
              <span className="text-emerald-500 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-600">MP4, MOV, MP3, WAV — up to 500MB</p>
          </>
        )}
      </label>
      {sizeError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {sizeError}
        </p>
      )}
    </div>
  );
}
