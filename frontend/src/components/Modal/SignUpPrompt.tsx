import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { SIGN_UP_BENEFITS } from "@/lib/tokens";

interface SignUpPromptProps {
  onSignUp: () => void;
  onSeePricing: () => void;
}

export function SignUpPrompt({ onSignUp, onSeePricing }: SignUpPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-8 pt-8 border-t border-gray-700"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-emerald-500" />
        <h3 className="text-lg font-semibold text-white">
          Unlock the full article
        </h3>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        You just saw a preview. Sign up free to generate complete, unrestricted articles.
      </p>

      <ul className="space-y-2.5 mb-6">
        {SIGN_UP_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm text-gray-300">
            <Check size={15} className="text-emerald-500 mt-0.5 shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>

      <div className="flex gap-3">
        <button
          onClick={onSignUp}
          className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-400 text-white
                     font-semibold rounded-lg transition-colors text-sm"
        >
          Sign up free
        </button>
        <button
          onClick={onSeePricing}
          className="flex-1 h-10 border border-gray-600 hover:border-gray-500
                     text-gray-300 hover:text-white font-medium rounded-lg
                     transition-colors text-sm"
        >
          See pricing
        </button>
      </div>
    </motion.div>
  );
}
