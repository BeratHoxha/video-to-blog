import { Mail } from "lucide-react";

export function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Mail size={28} className="text-emerald-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          We sent a verification link to your inbox. Click it to confirm your
          account and get started — it only takes a second.
        </p>

        <p className="text-xs text-gray-600">
          Didn't receive it?{" "}
          <a
            href="/users/confirmation/new"
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Resend verification email
          </a>
        </p>
      </div>
    </div>
  );
}
