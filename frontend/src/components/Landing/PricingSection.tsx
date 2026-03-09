import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try it out. No credit card required.",
    cta: "Get started free",
    ctaHref: "/users/sign_up",
    planKey: null,
    featured: false,
    features: [
      "Up to 2,000 words per article",
      "10 AI rewrites per week",
      "Copy to clipboard",
      "Article history",
      "YouTube + file upload",
    ],
  },
  {
    name: "Basic",
    price: "$12",
    period: "per month",
    description: "For creators who publish regularly.",
    cta: "Start with Basic",
    ctaHref: "/users/sign_up",
    planKey: "basic_monthly",
    featured: true,
    features: [
      "Unlimited word count",
      "Unlimited AI rewrites",
      "Export as PDF, DOCX, PPTX",
      "Article history",
      "Priority generation",
      "All output styles",
    ],
  },
  {
    name: "Premium",
    price: "$29",
    period: "per month",
    description: "For teams and power users.",
    cta: "Go Premium",
    ctaHref: "/users/sign_up",
    planKey: "premium_monthly",
    featured: false,
    features: [
      "Everything in Basic",
      "API access (coming soon)",
      "Bulk generation (coming soon)",
      "Priority support",
      "Custom output templates",
    ],
  },
];

interface PricingSectionProps {
  /** CSRF token — passed when the user is authenticated. */
  csrfToken?: string;
  /** Current user ID — used in Paddle customData for reconciliation. */
  userId?: number;
}

export function PricingSection({ csrfToken, userId }: PricingSectionProps = {}) {
  async function handlePlanClick(planKey: string) {
    if (!csrfToken) {
      // Not signed in — redirect to sign up
      window.location.href = "/users/sign_up";
      return;
    }

    try {
      const res = await fetch("/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!res.ok) return;

      const { client_token, customer_id, price_id } = await res.json();

      if (!window.Paddle) return;

      window.Paddle.Initialize({ token: client_token });
      window.Paddle.Checkout.open({
        items: [{ priceId: price_id, quantity: 1 }],
        customer: { id: customer_id },
        customData: { user_id: userId, plan_key: planKey },
      });
    } catch {
      // Silently fall back — user can try from the billing settings page
    }
  }

  return (
    <section id="pricing" className="py-24 px-4 bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl font-bold text-white">Simple, transparent pricing</h2>
          <p className="text-gray-400 mt-3 text-sm">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 border transition-all
                ${
                  plan.featured
                    ? "border-emerald-500 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10 bg-gray-900"
                    : "border-gray-800 bg-gray-900/60"
                }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500">/{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.planKey ? (
                <button
                  onClick={() => handlePlanClick(plan.planKey!)}
                  className={`block w-full text-center py-2.5 rounded-lg text-sm font-semibold
                              transition-colors
                    ${
                      plan.featured
                        ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                        : "border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white"
                    }`}
                >
                  {plan.cta}
                </button>
              ) : (
                <a
                  href={plan.ctaHref}
                  className="block text-center py-2.5 rounded-lg text-sm font-semibold
                             border border-gray-700 hover:border-gray-600 text-gray-300
                             hover:text-white transition-colors"
                >
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
