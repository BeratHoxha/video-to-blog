import { useState, useEffect, useRef } from "react";

interface GenerationStatus {
  id: number;
  status: "processing" | "complete" | "failed";
  title?: string;
  content?: string;
  word_count?: number;
}

interface UseGenerationPollerOptions {
  articleId: number | null;
  onComplete?: (data: GenerationStatus) => void;
  onError?: (error: string) => void;
  intervalMs?: number;
}

export function useGenerationPoller({
  articleId,
  onComplete,
  onError,
  intervalMs = 2000,
}: UseGenerationPollerOptions) {
  const [status, setStatus] = useState<GenerationStatus["status"] | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  const poll = async () => {
    if (!articleId) return;

    try {
      const res = await fetch(`/api/articles/${articleId}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: GenerationStatus = await res.json();
      setStatus(data.status);

      if (data.status === "complete") {
        stopPolling();
        onComplete?.(data);
      } else if (data.status === "failed") {
        stopPolling();
        onError?.("Article generation failed. Please try again.");
      }
    } catch (err) {
      stopPolling();
      onError?.(err instanceof Error ? err.message : "Polling error");
    }
  };

  useEffect(() => {
    if (!articleId) return;

    setStatus("processing");
    setIsPolling(true);
    poll();

    intervalRef.current = setInterval(poll, intervalMs);

    return stopPolling;
  }, [articleId]);

  return { status, isPolling };
}
