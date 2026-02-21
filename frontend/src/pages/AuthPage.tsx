import { AlertCircle } from "lucide-react";

interface AuthPageProps {
  mode: "sign-in" | "sign-up";
  errors: string[];
  csrfToken: string;
}

export function AuthPage({ mode, errors, csrfToken }: AuthPageProps) {
  const isSignUp = mode === "sign-up";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Back to home */}
      <a
        href="/"
        className="mb-8 flex items-center gap-1 font-bold text-lg tracking-tight"
      >
        <span className="text-white">Video</span>
        <span className="text-emerald-500">·</span>
        <span className="text-white">Blog</span>
      </a>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {isSignUp
            ? "Start turning videos into blog posts."
            : "Sign in to your account."}
        </p>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <ul className="text-sm text-red-300 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <form
          method="POST"
          action={isSignUp ? "/users" : "/users/sign_in"}
          className="space-y-4"
        >
          <input
            type="hidden"
            name="authenticity_token"
            value={csrfToken}
          />

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="user[email]"
              autoComplete="email"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5
                         text-white text-sm placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="user[password]"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5
                         text-white text-sm placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {/* Password confirmation — sign up only */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                name="user[password_confirmation]"
                autoComplete="new-password"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5
                           text-white text-sm placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Remember me — sign in only */}
          {!isSignUp && (
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                name="user[remember_me]"
                value="1"
                className="rounded border-gray-600 bg-gray-800 text-emerald-500
                           focus:ring-emerald-500"
              />
              Remember me
            </label>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white
                       font-semibold rounded-lg transition-colors text-sm mt-2"
          >
            {isSignUp ? "Create account" : "Sign in"}
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
