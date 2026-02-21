import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const meta = document.querySelector("meta[name='csrf-token']");
      const csrfToken = meta?.getAttribute("content") ?? "";

      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email }),
      });

      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-24 px-4">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Stay in the loop</h2>
        <p className="text-sm text-gray-500 mb-8">
          No spam. Just updates when we ship something worth seeing.
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <Check size={18} />
            <span className="font-medium">You're subscribed!</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 flex-col sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5
                         text-white text-sm placeholder-gray-600 focus:outline-none
                         focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white
                         font-medium rounded-lg text-sm transition-colors disabled:opacity-60
                         flex items-center gap-2"
            >
              {status === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Subscribe"
              )}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
        )}
      </div>
    </section>
  );
}
