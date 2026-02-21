import { motion } from "framer-motion";
import { useTypewriter } from "@/hooks/useTypewriter";

interface TypewriterTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
  isHtml?: boolean;
}

export function TypewriterText({
  text,
  onComplete,
  className = "",
  isHtml = false,
}: TypewriterTextProps) {
  const { displayed, isComplete } = useTypewriter({ text, onComplete });

  if (isHtml) {
    return (
      <div className={`relative ${className}`}>
        <div dangerouslySetInnerHTML={{ __html: displayed }} />
        {!isComplete && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
            className="inline-block w-0.5 h-5 bg-emerald-500 ml-0.5 align-middle"
          />
        )}
      </div>
    );
  }

  return (
    <span className={`relative ${className}`}>
      {displayed}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
          className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 align-middle"
        />
      )}
    </span>
  );
}
