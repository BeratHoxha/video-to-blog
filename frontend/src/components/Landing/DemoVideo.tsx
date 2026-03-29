export function DemoVideo() {
  return (
    <section id="demo" className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3">
          See it in action
        </p>
        <h2 className="text-3xl font-bold text-white mb-8">Watch how it works</h2>

        <div className="relative aspect-video bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
          <video className="w-full h-full object-cover" controls preload="metadata">
            <source src="/promo-video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
