import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types";

const PLANS = [
  {
    key: "free",
    label: "Free",
    price: "$0",
    period: "forever",
    features: ["2,000 words/month", "10 AI rewrites/week", "Basic export"],
  },
  {
    key: "basic",
    label: "Basic",
    price: "$12",
    period: "/mo",
    features: [
      "Unlimited words",
      "Unlimited AI rewrites",
      "PDF & DOCX export",
      "Priority processing",
    ],
  },
  {
    key: "premium",
    label: "Premium",
    price: "$29",
    period: "/mo",
    features: [
      "Everything in Basic",
      "PowerPoint export",
      "Custom tone settings",
      "Early access to features",
    ],
  },
];

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
          <PlanTab user={currentUser} csrfToken={csrfToken} onUserUpdate={updateUser} />
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
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

        <FormField label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </FormField>

        <FormField label="Email">
          <input type="email" value={user.email} disabled className={inputDisabledClass} />
          <p className="text-xs text-gray-600">Email address cannot be changed.</p>
        </FormField>
      </div>

      {!isOAuth && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5 mt-8">
          <h2 className="text-sm font-semibold text-white">Change Password</h2>

          <FormField label="Current Password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </FormField>

          <FormField label="New Password">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </FormField>

          <FormField label="Confirm New Password">
            <input
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

function PlanTab({
  user,
  csrfToken,
  onUserUpdate,
}: {
  user: User;
  csrfToken: string;
  onUserUpdate: (updates: Partial<User>) => void;
}) {
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSwitch(planKey: string) {
    setSwitching(planKey);
    setError(null);
    try {
      const res = await fetch("/api/users/plan", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        onUserUpdate(data as User);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 mb-6">
        You are currently on the{" "}
        <span className="text-emerald-400 font-medium capitalize">{user.plan}</span> plan.
      </p>

      {error && (
        <p className="text-sm font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {PLANS.map((plan) => {
          const isCurrent = user.plan === plan.key;
          const isLoading = switching === plan.key;
          const isPremium = plan.key === "premium";
          const isBasic = plan.key === "basic";

          const borderClass = isPremium
            ? "border-amber-500/40 bg-amber-500/[0.03]"
            : isBasic
              ? "border-sky-500/40 bg-sky-500/[0.03]"
              : isCurrent
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-gray-800 bg-gray-900";

          return (
            <div
              key={plan.key}
              className={`relative flex items-center gap-6 rounded-xl border px-6 py-5 transition-colors ${borderClass}`}
            >
              <div className="w-44 shrink-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3
                    className={`text-sm font-bold ${
                      isPremium ? "text-amber-400" : isBasic ? "text-sky-400" : "text-white"
                    }`}
                  >
                    {plan.label}
                  </h3>
                  {isPremium && !isCurrent && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                      ✦ Best
                    </span>
                  )}
                  {isBasic && !isCurrent && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400/80 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                      ★ Popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-xs text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="flex flex-wrap gap-x-5 gap-y-1 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Check size={11} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="shrink-0">
                {isCurrent ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                    <Check size={12} strokeWidth={2.5} />
                    Active
                  </div>
                ) : (
                  <button
                    onClick={() => handleSwitch(plan.key)}
                    disabled={isLoading}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors
                      ${
                        isPremium
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50"
                          : isBasic
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50"
                            : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600"
                      }`}
                  >
                    {isLoading ? "Switching…" : `Switch to ${plan.label}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
