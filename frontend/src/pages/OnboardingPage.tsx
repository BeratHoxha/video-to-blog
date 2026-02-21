import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface OnboardingPageProps {
  csrfToken: string;
}

const USE_CASES = [
  { value: "content_creator", label: "Content Creator", description: "YouTube, podcasts, social media" },
  { value: "blogger", label: "Blogger", description: "Personal or professional blog" },
  { value: "marketer", label: "Marketer", description: "Content marketing, SEO articles" },
  { value: "student", label: "Student", description: "Assignments, study notes" },
  { value: "researcher", label: "Researcher", description: "Academic or professional research" },
  { value: "other", label: "Other", description: "Something else" },
] as const;

export function OnboardingPage({ csrfToken }: OnboardingPageProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <a href="/" className="mb-10 flex items-center gap-1 font-bold text-lg tracking-tight">
        <span className="text-white">Video</span>
        <span className="text-emerald-500">·</span>
        <span className="text-white">Blog</span>
      </a>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            How will you use Video·Blog?
          </h1>
          <p className="text-gray-400 text-sm">
            This helps us tailor your experience. You can change it later.
          </p>
        </div>

        <form method="POST" action="/onboarding">
          <input type="hidden" name="authenticity_token" value={csrfToken} />
          <input type="hidden" name="onboarding[use_case]" value={selected ?? ""} />
          <input type="hidden" name="onboarding[plan]" value="free" />

          <div className="grid grid-cols-2 gap-3 mb-8">
            {USE_CASES.map(({ value, label, description }) => {
              const active = selected === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected(value)}
                  className={`relative text-left p-4 rounded-xl border transition-all
                    ${active
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                >
                  {active && (
                    <CheckCircle2
                      size={16}
                      className="absolute top-3 right-3 text-emerald-500"
                    />
                  )}
                  <p className="font-medium text-white text-sm">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={!selected}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40
                       disabled:cursor-not-allowed text-white font-semibold rounded-xl
                       transition-colors text-sm"
          >
            Continue to dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
