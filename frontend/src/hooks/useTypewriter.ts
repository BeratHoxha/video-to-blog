import { useState, useEffect, useRef } from "react";

interface UseTypewriterOptions {
  text: string;
  charDelayMs?: number;
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  charDelayMs = 12,
  onComplete,
}: UseTypewriterOptions) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!text) return;

    indexRef.current = 0;
    setDisplayed("");
    setIsComplete(false);

    intervalRef.current = setInterval(() => {
      if (indexRef.current >= text.length) {
        clearInterval(intervalRef.current!);
        setIsComplete(true);
        onComplete?.();
        return;
      }

      // Advance in chunks for speed on long content
      const chunkSize = text.length > 3000 ? 5 : 1;
      const end = Math.min(indexRef.current + chunkSize, text.length);
      setDisplayed(text.slice(0, end));
      indexRef.current = end;
    }, charDelayMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  return { displayed, isComplete };
}
