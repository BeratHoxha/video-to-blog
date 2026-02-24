import { Sparkles } from "lucide-react";

export function HeroEyebrow() {
  return (
    <div className="text-center mb-8">
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                      border border-emerald-500/30 bg-emerald-500/10 mb-6"
      >
        <Sparkles size={13} className="text-emerald-500" />
        <span className="text-xs font-medium text-emerald-400">
          Free to try — no signup required
        </span>
      </div>

      <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-4">
        Turn any video into a <span className="text-emerald-500">polished blog post.</span>
      </h1>

      <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
        Paste a URL or drop a file. Choose your style. Get a blog post in seconds.
      </p>
    </div>
  );
}
