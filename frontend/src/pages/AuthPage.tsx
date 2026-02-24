import { AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";

interface AuthPageProps {
  mode: "sign-in" | "sign-up";
  errors: string[];
  csrfToken: string;
}

type AuthField = "email" | "password" | "password_confirmation";
type FieldErrors = Partial<Record<AuthField, string[]>>;

export function AuthPage({ mode, errors, csrfToken }: AuthPageProps) {
  const isSignUp = mode === "sign-up";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formErrors, setFormErrors] = useState<string[]>(errors);

  const endpoint = isSignUp ? "/users" : "/users/sign_in";
  const hasAnyError =
    formErrors.length > 0 || Object.values(fieldErrors).some((messages) => messages?.length);

  const clearFieldError = (field: AuthField) => {
    setFieldErrors((prev) => {
      if (!prev[field]?.length) return prev;
      return { ...prev, [field]: [] };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormErrors([]);
    setFieldErrors({});

    const body = new URLSearchParams();
    body.set("authenticity_token", csrfToken);
    body.set("user[email]", email);
    body.set("user[password]", password);
    if (isSignUp) {
      body.set("user[password_confirmation]", passwordConfirmation);
    } else if (rememberMe) {
      body.set("user[remember_me]", "1");
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "same-origin",
        body: body.toString(),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.redirect_url) {
        window.location.assign(data.redirect_url);
        return;
      }

      const responseErrors = (data.errors ?? {}) as Record<string, string[]>;
      const nextFieldErrors: FieldErrors = {
        email: responseErrors.email ?? [],
        password: responseErrors.password ?? [],
        password_confirmation: responseErrors.password_confirmation ?? [],
      };
      const nextFormErrors = responseErrors.base ?? [data.error ?? "Authentication failed."];

      setFieldErrors(nextFieldErrors);
      setFormErrors(nextFormErrors);
    } catch {
      setFormErrors([`Network error. Please try again.`]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Back to home */}
      <a href="/" className="mb-8 flex items-center gap-1 font-bold text-lg tracking-tight">
        <span className="text-white">Video</span>
        <span className="text-emerald-500">·</span>
        <span className="text-white">Blog</span>
      </a>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {isSignUp ? "Start turning videos into blog posts." : "Sign in to your account."}
        </p>

        {/* Errors */}
        {hasAnyError && formErrors.length > 0 && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <ul className="text-sm text-red-300 space-y-0.5">
              {formErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input type="hidden" name="authenticity_token" value={csrfToken} />

          {/* Email */}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gray-300 mb-1.5">
              <span>Email</span>
              <input
                id="auth-email"
                type="email"
                name="user[email]"
                aria-label="Email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                  setFormErrors([]);
                }}
                className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5
                         text-white text-sm placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </label>
            {fieldErrors.email?.map((message, index) => (
              <p key={`email-${index}`} className="mt-1 text-xs text-red-300">
                {message}
              </p>
            ))}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              <span>Password</span>
              <input
                id="auth-password"
                type="password"
                name="user[password]"
                aria-label="Password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                  setFormErrors([]);
                }}
                className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5
                         text-white text-sm placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </label>
            {fieldErrors.password?.map((message, index) => (
              <p key={`password-${index}`} className="mt-1 text-xs text-red-300">
                {message}
              </p>
            ))}
          </div>

          {/* Password confirmation — sign up only */}
          {isSignUp && (
            <div>
              <label
                htmlFor="auth-password-confirmation"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                <span>Confirm password</span>
                <input
                  id="auth-password-confirmation"
                  type="password"
                  name="user[password_confirmation]"
                  aria-label="Confirm password"
                  autoComplete="new-password"
                  required
                  value={passwordConfirmation}
                  onChange={(event) => {
                    setPasswordConfirmation(event.target.value);
                    clearFieldError("password_confirmation");
                    setFormErrors([]);
                  }}
                  className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5
                           text-white text-sm placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </label>
              {fieldErrors.password_confirmation?.map((message, index) => (
                <p key={`password-confirmation-${index}`} className="mt-1 text-xs text-red-300">
                  {message}
                </p>
              ))}
            </div>
          )}

          {/* Remember me — sign in only */}
          {!isSignUp && (
            <label
              htmlFor="auth-remember-me"
              className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer"
            >
              <input
                id="auth-remember-me"
                type="checkbox"
                name="user[remember_me]"
                aria-label="Remember me"
                value="1"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-emerald-500
                           focus:ring-emerald-500"
              />
              <span id="auth-remember-me-label">Remember me</span>
            </label>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white
                       font-semibold rounded-lg transition-colors text-sm mt-2 disabled:opacity-70"
          >
            {submitting ? "Submitting..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        {/* Toggle link */}
        <p className="mt-5 text-center text-sm text-gray-500">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <a
                href="/users/sign_in"
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Sign in
              </a>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <a
                href="/users/sign_up"
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Get started
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
