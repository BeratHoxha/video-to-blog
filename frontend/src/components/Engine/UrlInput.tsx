import { Link } from "lucide-react";

interface UrlInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function UrlInput({ value, onChange }: UrlInputProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Link size={16} className="text-gray-500" />
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://youtube.com/watch?v=..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg
                   pl-9 pr-4 py-3 text-white placeholder-gray-600 text-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                   focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}
