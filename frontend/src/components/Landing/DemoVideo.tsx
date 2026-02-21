import { Play } from "lucide-react";

export function DemoVideo() {
  return (
    <section id="demo" className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">
          See it in action
        </p>
        <h2 className="text-3xl font-bold text-white mb-8">
          Watch how it works
        </h2>

        {/* Video placeholder */}
        <div className="relative aspect-video bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center
                            shadow-lg shadow-emerald-500/30 group-hover:bg-emerald-400 transition-colors">
              <Play size={24} className="text-white ml-1" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/80" />
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-600">
            Demo video coming soon
          </p>
        </div>
      </div>
    </section>
  );
}
