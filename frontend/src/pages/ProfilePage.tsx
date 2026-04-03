import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBilling } from "@/hooks/useBilling";
import type { User, PaymentTransaction } from "@/types";

// Static feature lists per billing plan key — prices come from the backend
const PLAN_FEATURES: Record<string, string[]> = {
  basic_monthly: [
    "Unlimited words",
    "Unlimited AI rewrites",
    "PDF & DOCX export",
    "Priority processing",
  ],
  premium_monthly: [
    "Everything in Basic",
    "PowerPoint export",
    "Custom tone settings",
    "Early access to features",
  ],
};

function formatPrice(amount_cents: number, currency: string, interval: string) {
  const amount = (amount_cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  });
  const period = interval === "month" ? "/mo" : `/${interval}`;
  return { amount, period };
}

export function ProfilePage() {
  const { currentUser, updateUser, csrfToken } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam === "plan" || tabParam === "account" ? tabParam : "account";
  const [activeTab, setActiveTab] = useState<"account" | "plan">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">Profile</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your account and subscription.</p>

        <div className="flex gap-1 mb-8 border-b border-gray-800">
          <TabButton
            label="Account"
            active={activeTab === "account"}
            onClick={() => setActiveTab("account")}
          />
          <TabButton
            label="Plan"
            active={activeTab === "plan"}
            onClick={() => setActiveTab("plan")}
          />
        </div>

        {activeTab === "account" ? (
          <AccountTab user={currentUser} csrfToken={csrfToken} onUserUpdate={updateUser} />
        ) : (
          <PlanTab user={currentUser} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? "border-emerald-500 text-emerald-400"
          : "border-transparent text-gray-500 hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-gray-400 uppercase tracking-wide"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm" +
  " text-white placeholder-gray-600 focus:outline-none focus:ring-1" +
  " focus:ring-emerald-500 focus:border-emerald-500 transition-colors";

const inputDisabledClass =
  "w-full bg-gray-800/40 border border-gray-700/40 rounded-lg px-4 py-2.5" +
  " text-sm text-gray-500 cursor-not-allowed";

function AccountTab({
  user,
  csrfToken,
  onUserUpdate,
}: {
  user: User;
  csrfToken: string;
  onUserUpdate: (updates: Partial<User>) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const isOAuth = !!user.provider;

  async function handleSave() {
    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    setSaving(true);
    setStatus(null);

    const body: Record<string, string> = { name };
    if (newPassword) {
      body.current_password = currentPassword;
      body.password = newPassword;
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error ?? "Something went wrong." });
      } else {
        onUserUpdate(data as User);
        setStatus({ type: "success", message: "Profile updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Basic Information</h2>

        <FormField label="Name" htmlFor="profile-name">
          <input
            id="profile-name"
            aria-label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </FormField>

        <FormField label="Email" htmlFor="profile-email">
          <input
            id="profile-email"
            aria-label="Email"
            type="email"
            value={user.email}
            disabled
            className={inputDisabledClass}
          />
          <p className="text-xs text-gray-600">Email address cannot be changed.</p>
        </FormField>
      </div>

      {!isOAuth && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5 mt-8">
          <h2 className="text-sm font-semibold text-white">Change Password</h2>

          <FormField label="Current Password" htmlFor="current-password">
            <input
              id="current-password"
              aria-label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </FormField>

          <FormField label="New Password" htmlFor="new-password">
            <input
              id="new-password"
              aria-label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </FormField>

          <FormField label="Confirm New Password" htmlFor="confirm-password">
            <input
              id="confirm-password"
              aria-label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </FormField>
        </div>
      )}

      <div className="flex flex-col items-start gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500
            hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50
            disabled:cursor-not-allowed text-white text-sm font-semibold
            rounded-lg shadow-md shadow-emerald-900/40 transition-colors cursor-pointer"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        {status && (
          <p
            className={`text-sm font-medium ${
              status.type === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    trialing: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    past_due: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    canceled: "bg-red-500/10 border-red-500/20 text-red-400",
    inactive: "bg-gray-700/40 border-gray-600/20 text-gray-400",
  };
  return map[status] ?? "bg-gray-700/40 border-gray-600/20 text-gray-400";
}

function PlanTab({ user }: { user: User }) {
  const {
    billingInfo,
    loading,
    processing,
    error,
    message,
    fetchBillingInfo,
    startCheckout,
    cancelSubscription,
  } = useBilling();

  useEffect(() => {
    fetchBillingInfo();
  }, [fetchBillingInfo]);

  const isActive = billingInfo?.entitlements.active ?? false;
  const planStatus = billingInfo?.plan_status ?? user.plan_status ?? "inactive";

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-3">
          {message}
        </p>
      )}
      {processing && (
        <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-3">
          Processing your subscription — this may take a few seconds.
        </p>
      )}

      {/* ── Current subscription card ── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Current subscription
        </p>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold text-white capitalize">{user.plan}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusPill(planStatus)}`}
                >
                  {planStatus.replace("_", " ")}
                </span>
              </div>
              {billingInfo?.plan_expires_at && (
                <p className="text-xs text-gray-500">
                  {planStatus === "canceled" ? "Access until" : "Renews"}{" "}
                  <span className="text-gray-300">
                    {new Date(billingInfo.plan_expires_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
              )}
              {billingInfo?.entitlements && (
                <div className="flex gap-4 pt-1">
                  {billingInfo.entitlements.word_count_limit != null ? (
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">
                        {billingInfo.entitlements.word_count_limit.toLocaleString()}
                      </span>{" "}
                      words/mo
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">Unlimited</span> words
                    </span>
                  )}
                  {billingInfo.entitlements.ai_bot_limit != null ? (
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">
                        {billingInfo.entitlements.ai_bot_limit}
                      </span>{" "}
                      AI rewrites/mo
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">Unlimited</span> AI rewrites
                    </span>
                  )}
                </div>
              )}
            </div>
            {isActive && (
              <button
                onClick={cancelSubscription}
                className="shrink-0 text-xs text-red-400/70 hover:text-red-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Plan cards ── */}
      {billingInfo && (
        <div className="flex flex-col gap-3">
          {billingInfo.available_plans.map((plan) => {
            const features = PLAN_FEATURES[plan.key] ?? [];
            const { amount, period } = formatPrice(plan.amount_cents, plan.currency, plan.interval);
            // plan.key is e.g. "basic_monthly"; user.plan is e.g. "basic"
            const tier = plan.key.replace("_monthly", "");
            const isCurrent = tier === user.plan && isActive;
            const isPremium = plan.key === "premium_monthly";
            const isBasic = plan.key === "basic_monthly";

            const borderClass = isCurrent
              ? isPremium
                ? "border-amber-500/50 bg-amber-500/[0.04]"
                : isBasic
                  ? "border-sky-500/50 bg-sky-500/[0.04]"
                  : "border-emerald-500 bg-emerald-500/5"
              : isPremium
                ? "border-amber-500/20 bg-amber-500/[0.02]"
                : isBasic
                  ? "border-sky-500/20 bg-sky-500/[0.02]"
                  : "border-gray-800 bg-gray-900";

            return (
              <div
                key={plan.key}
                className={`relative flex items-center gap-6 rounded-xl border px-6 py-5 transition-colors ${borderClass}`}
              >
                {/* Plan name + price */}
                <div className="w-40 shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`text-sm font-bold ${
                        isPremium ? "text-amber-400" : isBasic ? "text-sky-400" : "text-white"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    {isPremium && !isCurrent && (
                      <span className="text-[10px] font-semibold text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-full px-1.5 py-px">
                        ✦ Best
                      </span>
                    )}
                    {isBasic && !isCurrent && (
                      <span className="text-[10px] font-semibold text-sky-400/80 bg-sky-500/10 border border-sky-500/20 rounded-full px-1.5 py-px">
                        ★ Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-white">{amount}</span>
                    <span className="text-xs text-gray-500">{period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="flex flex-wrap gap-x-5 gap-y-1 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Check size={11} className="text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="shrink-0">
                  {isCurrent ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                      <Check size={12} strokeWidth={2.5} />
                      Active
                    </div>
                  ) : (
                    <button
                      onClick={() => startCheckout(plan.key)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        isPremium
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
                          : isBasic
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50"
                            : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {user.plan === "free" ? "Subscribe" : `Switch to ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Payment history ── */}
      {billingInfo && billingInfo.payment_transactions.length > 0 && (
        <PaymentHistory transactions={billingInfo.payment_transactions} />
      )}
    </div>
  );
}

function PaymentHistory({ transactions }: { transactions: PaymentTransaction[] }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="flex items-center gap-2 mb-5">
        <CreditCard size={14} className="text-gray-500" />
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Payment history
        </h2>
      </div>
      <div className="divide-y divide-gray-800/60">
        {transactions.map((txn) => (
          <div key={txn.id} className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <div className="text-sm text-white capitalize font-medium">
                {txn.plan_key ?? "—"} plan
              </div>
              <div className="text-xs text-gray-500">
                {(txn.paid_at
                  ? new Date(txn.paid_at)
                  : new Date(txn.created_at)
                ).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              {txn.failure_reason && (
                <div className="text-xs text-red-400">{txn.failure_reason}</div>
              )}
            </div>
            <div className="text-right shrink-0">
              {txn.amount_cents != null && txn.currency && (
                <div className="text-sm text-white font-semibold">
                  {(txn.amount_cents / 100).toFixed(2)}{" "}
                  <span className="text-gray-400 font-normal">{txn.currency.toUpperCase()}</span>
                </div>
              )}
              <span
                className={`inline-block mt-0.5 text-[10px] font-semibold capitalize px-2 py-px rounded-full border ${
                  txn.status === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : txn.status === "failed"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-gray-700/40 border-gray-600/20 text-gray-400"
                }`}
              >
                {txn.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
