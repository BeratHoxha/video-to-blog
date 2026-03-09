import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { BillingInfo } from "@/types";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: "sandbox" | "production") => void };
      Initialize: (opts: {
        token: string;
        eventCallback?: (event: { name: string }) => void;
      }) => void;
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          customer?: { id?: string; email?: string };
          customData?: Record<string, unknown>;
        }) => void;
      };
    };
  }
}

export function useBilling() {
  const { currentUser, csrfToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);

  const fetchBillingInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/settings/billing", {
        headers: { "X-CSRF-Token": csrfToken },
      });
      if (!res.ok) throw new Error("Failed to load billing info");
      const data = await res.json();
      setBillingInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [csrfToken]);

  const startCheckout = useCallback(
    async (planKey: string) => {
      setError(null);
      try {
        const res = await fetch("/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({ plan: planKey }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Checkout failed");
        }
        const { client_token, environment, email, price_id } = await res.json();

        if (!window.Paddle) {
          throw new Error("Paddle.js is not loaded");
        }

        if (environment === "sandbox") {
          window.Paddle.Environment.set("sandbox");
        }

        window.Paddle.Initialize({
          token: client_token,
          eventCallback: (event: { name: string }) => {
            if (event.name === "checkout.completed") {
              setProcessing(true);
            }
          },
        });
        window.Paddle.Checkout.open({
          items: [{ priceId: price_id, quantity: 1 }],
          customer: { email },
          customData: { user_id: currentUser.id, plan_key: planKey },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [csrfToken, currentUser.id]
  );

  const changePlan = useCallback(
    async (planKey: string) => {
      setError(null);
      try {
        const res = await fetch("/billing/change_plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({ plan: planKey }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Plan change failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [csrfToken]
  );

  const cancelSubscription = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/billing/cancel", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Cancel failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [csrfToken]);

  return {
    billingInfo,
    loading,
    processing,
    error,
    fetchBillingInfo,
    startCheckout,
    changePlan,
    cancelSubscription,
  };
}
