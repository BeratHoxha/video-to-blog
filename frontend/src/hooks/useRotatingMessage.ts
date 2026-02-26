import { useState, useEffect, useRef } from "react";
import { shuffleMessages } from "@/lib/loadingMessages";

/**
 * Returns a message that changes every `intervalMs` milliseconds.
 * Messages are shuffled once on mount so each session sees a fresh order.
 */
export function useRotatingMessage(intervalMs = 10_000): string {
  const messages = useRef<string[]>(shuffleMessages());
  const indexRef = useRef(0);
  const [message, setMessage] = useState(messages.current[0]);

  useEffect(() => {
    const id = window.setInterval(() => {
      indexRef.current = (indexRef.current + 1) % messages.current.length;
      setMessage(messages.current[indexRef.current]);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs]);

  return message;
}
