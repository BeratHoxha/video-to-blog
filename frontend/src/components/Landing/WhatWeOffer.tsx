import { FileText, Wand2, FolderOpen } from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Video → Blog in seconds",
    description:
      "Drop any video or URL and get a structured, readable blog post. Our AI handles transcription and writing — you just choose the style.",
  },
  {
    icon: Wand2,
    title: "AI co-writing editor",
    description:
      "Highlight any sentence and ask the AI to rewrite it. Make it shorter, more professional, or completely restructured — all inline.",
  },
  {
    icon: FolderOpen,
    title: "Article history & workspace",
    description:
      "Every article you generate is saved to your account. Re-open, continue editing, and export any time.",
  },
];

export function WhatWeOffer() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">
            Why Video To Blog
          </p>
          <h2 className="text-3xl font-bold text-white">More than just a transcription tool</h2>
          <p className="text-gray-400 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
            We exist because turning a great video into a great blog post should take minutes, not
            hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6
                         hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-4">
                <Icon size={18} className="text-emerald-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
