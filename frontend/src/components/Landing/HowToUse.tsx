const STEPS = [
  {
    number: "01",
    title: "Paste a URL or upload",
    description: "Add a YouTube link or drop any video/audio file.",
  },
  {
    number: "02",
    title: "Choose your style",
    description: "Select output type, format, and optional preferences.",
  },
  {
    number: "03",
    title: "Click Generate",
    description: "Our AI transcribes and writes your article in seconds.",
  },
  {
    number: "04",
    title: "Review in real time",
    description: "Watch the article appear — then edit with AI assistance.",
  },
  {
    number: "05",
    title: "Export or save",
    description: "Download as PDF, DOCX, or PPTX — or save to your account.",
  },
];

export function HowToUse() {
  return (
    <section id="how-to-use" className="py-24 px-4 bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">
            Simple workflow
          </p>
          <h2 className="text-3xl font-bold text-white">How to use Video To Blog</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-start md:items-center text-left md:text-center"
            >
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-emerald-500">{step.number}</span>
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
