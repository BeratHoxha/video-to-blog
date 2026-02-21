import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { TypewriterText } from "@/components/shared/TypewriterText";
import { SignUpPrompt } from "./SignUpPrompt";
import { useGenerationPoller } from "@/hooks/useGenerationPoller";

interface GenerationModalProps {
  articleId: number;
  onClose: () => void;
}

export function GenerationModal({ articleId, onClose }: GenerationModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

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
          className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh]
                     overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between px-6 py-4
                          border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
            <div>
              <h2 className="font-semibold text-white">Your article preview</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ~300 word preview — sign up to unlock the full article
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {status === "processing" || !content ? (
              <div className="space-y-3 animate-pulse">
                {[80, 100, 72, 90, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-800 rounded"
                    style={{ width: `${w}%` }}
                  />
                ))}
                <p className="text-xs text-gray-600 pt-2">Generating your article...</p>
              </div>
            ) : (
              <>
                <div className="prose prose-invert max-w-none text-gray-200 text-[15px] leading-relaxed">
                  <TypewriterText
                    text={content}
                    isHtml
                    onComplete={() => setAnimationComplete(true)}
                  />
                </div>

                <AnimatePresence>
                  {animationComplete && (
                    <SignUpPrompt
                      onSignUp={() => window.location.href = "/users/sign_up"}
                      onSeePricing={() => {
                        onClose();
                        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    />
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
