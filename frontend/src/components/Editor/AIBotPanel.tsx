import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useAIBot } from "@/hooks/useAIBot";

const QUICK_PROMPTS = [
  "Make it shorter",
  "More professional",
  "Simplify language",
  "Add more detail",
];

interface AIBotPanelProps {
  selectedText: string;
  onApply: (rewritten: string, remainingCalls: number | null) => void;
  onClose: () => void;
  callsRemaining: number | null;
}

export function AIBotPanel({
  selectedText,
  onApply,
  onClose,
  callsRemaining,
}: AIBotPanelProps) {
  const [prompt, setPrompt] = useState("");
  const { rewrite, isLoading, error, upgradeRequired } = useAIBot();

  const handleApply = async () => {
    if (!prompt.trim()) return;
    const result = await rewrite(selectedText, prompt);
    if (result) {
      onApply(result.result, result.ai_bot_calls_remaining);
      setPrompt("");
    }
  };

  const handleQuickPrompt = (p: string) => {
    setPrompt(p);
  };

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" />
          <span className="font-semibold text-sm text-white">AI Co-writer</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected text preview */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Selected text
          </p>
          <div className="bg-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-300 line-clamp-4 italic border-l-2 border-emerald-500">
            {selectedText.slice(0, 200)}
            {selectedText.length > 200 && "..."}
          </div>
        </div>

        {/* Quick prompts */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Quick actions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleQuickPrompt(p)}
                className="text-xs px-2.5 py-1.5 rounded-md bg-gray-800 border border-gray-700
                           text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400
                           transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Custom instruction
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should I change?"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg
                       px-3 py-2.5 text-white text-sm placeholder-gray-600
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                       focus:border-emerald-500 transition-colors resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleApply();
            }}
          />
        </div>

        {/* Error / upgrade prompt */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start gap-2 rounded-lg p-3 text-sm
                ${upgradeRequired
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"}`}
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>
                <p>{error}</p>
                {upgradeRequired && (
                  <a
                    href="#pricing"
                    className="underline mt-1 inline-block font-medium"
                  >
                    View upgrade options →
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        {callsRemaining !== null && (
          <p className="text-xs text-gray-600 text-center">
            {callsRemaining} of 10 AI rewrites remaining this week
          </p>
        )}
        <button
          onClick={handleApply}
          disabled={isLoading || !prompt.trim()}
          className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50
                     text-white font-semibold rounded-lg transition-colors
                     flex items-center justify-center gap-2 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Rewriting...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Apply
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
