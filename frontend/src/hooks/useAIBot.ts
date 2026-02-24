import { useState } from "react";

interface AIBotResult {
  result: string;
  ai_bot_calls_remaining: number | null;
}

interface AIBotError {
  error: string;
  upgrade_required?: boolean;
  ai_bot_calls_remaining?: number;
}

export function useAIBot() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const rewrite = async (selection: string, prompt: string): Promise<AIBotResult | null> => {
    setIsLoading(true);
    setError(null);
    setUpgradeRequired(false);

    const meta = document.querySelector("meta[name='csrf-token']");
    const csrfToken = meta?.getAttribute("content") ?? "";

    try {
      const res = await fetch("/api/ai_bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ selection, prompt }),
      });

      if (res.status === 403) {
        const data: AIBotError = await res.json();
        setUpgradeRequired(true);
        setError(data.error);
        return null;
      }

      if (!res.ok) {
        const data: AIBotError = await res.json();
        setError(data.error ?? "AI rewrite failed");
        return null;
      }

      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { rewrite, isLoading, error, upgradeRequired };
}
