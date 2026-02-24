import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { TypewriterText } from "@/components/shared/TypewriterText";
import { SignUpPrompt } from "./SignUpPrompt";
import { useGenerationPoller } from "@/hooks/useGenerationPoller";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";

interface GenerationModalProps {
  articleId: number;
  onClose: () => void;
}

export function GenerationModal({ articleId, onClose }: GenerationModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const loadingMessage = useRotatingMessage(10_000);

  const { status } = useGenerationPoller({
    articleId,
    onComplete: (data) => {
      if (data.content) setContent(data.content);
    },
    onError: (err) => console.error(err),
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl
                     shadow-2xl flex flex-col"
          style={{ maxHeight: "85vh" }}
        >
          {/* Header */}
          <div
            className="shrink-0 flex items-center justify-between px-6 py-4
                          border-b border-gray-800"
          >
            <div>
              <h2 className="font-semibold text-white">Your article preview</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ~150 word preview — sign up to unlock the full article
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable article content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            {status === "processing" || !content ? (
              <div className="animate-pulse space-y-5">
                {/* Title */}
                <div className="h-6 bg-gray-800 rounded w-3/4" />

                {/* Paragraph 1 */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-800 rounded w-[96%]" />
                  <div className="h-4 bg-gray-800 rounded w-4/5" />
                </div>

                {/* Subheading */}
                <div className="h-5 bg-gray-800 rounded w-2/5" />

                {/* Paragraph 2 */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-800 rounded w-[92%]" />
                  <div className="h-4 bg-gray-800 rounded w-[88%]" />
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                </div>

                {/* Subheading 2 */}
                <div className="h-5 bg-gray-800 rounded w-1/3" />

                {/* Paragraph 3 */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-800 rounded w-[94%]" />
                  <div className="h-4 bg-gray-800 rounded w-4/5" />
                </div>

                <p
                  key={loadingMessage}
                  className="text-xs text-gray-500 text-center pt-1 transition-opacity duration-500"
                >
                  {loadingMessage}
                </p>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-gray-200 text-[15px] leading-relaxed">
                <TypewriterText text={content} isHtml />
              </div>
            )}
          </div>

          {/* CTA — always visible, never scrolled away */}
          <div className="shrink-0 border-t border-gray-700 px-6 py-5">
            <SignUpPrompt
              onSignUp={() => (window.location.href = "/users/sign_up")}
              onSeePricing={() => {
                onClose();
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
