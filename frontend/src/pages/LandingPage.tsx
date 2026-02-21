import { useState } from "react";
import { Nav } from "@/components/Landing/Nav";
import { HeroEyebrow } from "@/components/Landing/HeroEyebrow";
import { DemoVideo } from "@/components/Landing/DemoVideo";
import { HowToUse } from "@/components/Landing/HowToUse";
import { WhatWeOffer } from "@/components/Landing/WhatWeOffer";
import { PricingSection } from "@/components/Landing/PricingSection";
import { NewsletterSignup } from "@/components/Landing/NewsletterSignup";
import { VideoToBlogEngine } from "@/components/Engine/VideoToBlogEngine";
import { GenerationModal } from "@/components/Modal/GenerationModal";

interface LandingPageProps {
  authenticated: boolean;
}

export function LandingPage({ authenticated }: LandingPageProps) {
  const [guestArticleId, setGuestArticleId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-950">
      <Nav authenticated={authenticated} />

      <main className="pt-24">
        {/* Hero + Engine */}
        <section className="max-w-2xl mx-auto px-4 py-16">
          <HeroEyebrow />
          <VideoToBlogEngine
            authenticated={false}
            userTier={null}
            onGuestGenerated={setGuestArticleId}
          />
        </section>

        <DemoVideo />
        <HowToUse />
        <WhatWeOffer />
        <PricingSection />
        <NewsletterSignup />

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 px-4 text-center">
          <p className="text-xs text-gray-700">
            © {new Date().getFullYear()} Video To Blog. All rights reserved.
          </p>
        </footer>
      </main>

      {/* Generation modal for unauthenticated preview */}
      {guestArticleId && (
        <GenerationModal
          articleId={guestArticleId}
          onClose={() => setGuestArticleId(null)}
        />
      )}
    </div>
  );
}
