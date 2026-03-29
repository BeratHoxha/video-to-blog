import { useState, useEffect } from "react";
import { OUTPUT_TYPES, OUTPUT_FORMATS } from "@/lib/tokens";
import { Lock } from "lucide-react";

const INSTRUCTION_HINTS = [
  "How many times was 'John Doe' mentioned?",
  "What should I take away from this?",
  "List every action item the speaker mentions",
  "Explain this to a 10-year-old",
  "What problems does the speaker claim this solves?",
  "Focus only on the statistics and numbers",
  "What questions are left unanswered?",
  "Highlight any deadlines or dates mentioned",
  "Write this for a non-technical audience",
  "Extract every tool or product name mentioned",
];

function useTypingPlaceholder(phrases: string[]) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[idx];

    if (!deleting) {
      if (text.length < phrase.length) {
        const t = setTimeout(() => setText(phrase.slice(0, text.length + 1)), 55);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }

    if (text.length > 0) {
      const t = setTimeout(() => setText(text.slice(0, -1)), 28);
      return () => clearTimeout(t);
    }

    setDeleting(false);
    setIdx((i) => (i + 1) % phrases.length);
  }, [text, deleting, idx, phrases]);

  return text;
}

interface OptionsPanelProps {
  contentMode: "article" | "summary";
  outputType: string;
  outputFormat: string;
  useExternalLinks: boolean;
  additionalInstructions: string;
  authenticated: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export function OptionsPanel({
  contentMode,
  outputType,
  outputFormat,
  useExternalLinks,
  additionalInstructions,
  authenticated,
  onChange,
}: OptionsPanelProps) {
  const isSummary = contentMode === "summary";
  const hintPlaceholder = useTypingPlaceholder(INSTRUCTION_HINTS);

  return (
    <div className="space-y-5">
      {/* Content Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Output</label>
        <div className="flex rounded-lg bg-gray-800 border border-gray-700 p-1 gap-1">
          <button
            type="button"
            onClick={() => onChange("contentMode", "article")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              !isSummary ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Article
          </button>
          <button
            type="button"
            onClick={() => onChange("contentMode", "summary")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              isSummary ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Summary
          </button>
        </div>
        {isSummary && (
          <p className="mt-1.5 text-xs text-gray-500">
            Generates a concise overview with key points — great for quick comprehension.
          </p>
        )}
      </div>

      {/* Output Type — hidden in summary mode */}
      {!isSummary && (
        <div>
          <label htmlFor="output-type" className="block text-sm font-medium text-gray-300 mb-1.5">
            Output Type
          </label>
          <select
            id="output-type"
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
      )}

      {/* Output Format */}
      <div>
        <label htmlFor="output-format" className="block text-sm font-medium text-gray-300 mb-1.5">
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
      <Toggle
        label="External Links"
        checked={useExternalLinks}
        onChange={(v) => onChange("useExternalLinks", v)}
      />

      {/* Additional Instructions */}
      <div>
        <label
          htmlFor="additional-instructions"
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          Additional Instructions <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <textarea
          id="additional-instructions"
          aria-label="Additional instructions"
          value={additionalInstructions}
          onChange={(e) => onChange("additionalInstructions", e.target.value)}
          placeholder={hintPlaceholder || " "}
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
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onChange(!checked);
      }}
      className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 cursor-pointer select-none"
    >
      <span className="text-sm text-gray-300">{label}</span>
      <div
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${checked ? "bg-emerald-500" : "bg-gray-600"}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </div>
    </div>
  );
}
