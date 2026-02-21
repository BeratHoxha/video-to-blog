import { OUTPUT_TYPES, OUTPUT_FORMATS } from "@/lib/tokens";
import { Lock } from "lucide-react";

interface OptionsPanelProps {
  outputType: string;
  outputFormat: string;
  includeImages: boolean;
  useExternalLinks: boolean;
  additionalInstructions: string;
  authenticated: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export function OptionsPanel({
  outputType,
  outputFormat,
  includeImages,
  useExternalLinks,
  additionalInstructions,
  authenticated,
  onChange,
}: OptionsPanelProps) {
  return (
    <div className="space-y-5">
      {/* Output Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Output Type
        </label>
        <select
          value={outputType}
          onChange={(e) => onChange("outputType", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg
                     px-3 py-2.5 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                     focus:border-emerald-500 transition-colors"
        >
          {OUTPUT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Output Format
          {!authenticated && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500">
              <Lock size={11} /> Sign up to unlock
            </span>
          )}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {OUTPUT_FORMATS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={!authenticated}
              onClick={() => authenticated && onChange("outputFormat", value)}
              className={`py-2 rounded-lg text-sm font-medium border transition-all
                ${
                  outputFormat === value && authenticated
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }
                ${!authenticated ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <Toggle
          label="Include Images"
          checked={includeImages}
          onChange={(v) => onChange("includeImages", v)}
        />
        <Toggle
          label="External Links"
          checked={useExternalLinks}
          onChange={(v) => onChange("useExternalLinks", v)}
        />
      </div>

      {/* Additional Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Additional Instructions{" "}
          <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <textarea
          value={additionalInstructions}
          onChange={(e) => onChange("additionalInstructions", e.target.value)}
          placeholder="e.g. Focus on technical depth, include code examples..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg
                     px-3 py-2.5 text-white text-sm placeholder-gray-600
                     focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                     focus:border-emerald-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 cursor-pointer">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
                    transition-colors focus:outline-none
                    ${checked ? "bg-emerald-500" : "bg-gray-600"}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
                      transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </label>
  );
}
