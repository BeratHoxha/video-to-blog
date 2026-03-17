import { Nav } from "@/components/Landing/Nav";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      <Nav authenticated={false} />

      <main className="max-w-3xl mx-auto px-6 py-32">
        <h1 className="text-3xl font-bold text-white mb-2">
          Terms of Service &amp; Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-12">
          Last updated: March 2026
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Video To Blog ("the Service", "we", "us", or
            "our"), you agree to be bound by these Terms of Service and Privacy
            Policy. If you do not agree to these terms, please do not use the
            Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Video To Blog is an online platform that processes video content
            (via URL or file upload) and generates written blog articles using
            artificial intelligence. The Service may be accessed through a
            subscription plan or on a pay-per-use basis.
          </p>
        </Section>

        <Section title="3. Video Data — No Permanent Storage">
          <p>
            We do <strong className="text-white">not</strong> permanently store
            your videos or video files. Uploaded files and video URLs are
            processed in memory solely for the purpose of generating a
            transcript and article. Once processing is complete, all raw video
            data is discarded from our servers. We do not retain, sell, or share
            your video content.
          </p>
          <p className="mt-3">
            The generated article text is stored in your account so you can
            access and edit it later. You may delete any article at any time,
            which permanently removes it from our systems.
          </p>
        </Section>

        <Section title="4. Payments and Subscriptions">
          <p>
            The Service offers paid subscription tiers and/or one-time credit
            purchases. By completing a purchase, you agree to the following:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-2">
            <li>
              All payments are processed by a third-party payment provider
              (e.g., Stripe). We do not store your full payment card details on
              our servers.
            </li>
            <li>
              Subscription fees are billed on a recurring basis (monthly or
              annually) at the rate shown at the time of purchase, unless
              cancelled before the next billing date.
            </li>
            <li>
              You may cancel your subscription at any time through your account
              settings. Cancellation takes effect at the end of the current
              billing period; you retain access until then.
            </li>
            <li>
              <strong className="text-white">Refunds.</strong> All sales are
              final. We do not offer refunds except where required by applicable
              law or at our sole discretion in exceptional circumstances. If you
              believe you are entitled to a refund, contact us at{" "}
              <a
                href="mailto:support@videotoblog.ai"
                className="text-emerald-400 hover:underline"
              >
                support@videotoblog.ai
              </a>
              .
            </li>
            <li>
              Prices are subject to change. We will provide reasonable notice of
              any price changes before they take effect.
            </li>
            <li>
              One-time credit purchases are non-transferable and expire as stated
              at the time of purchase.
            </li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc list-inside mt-3 space-y-2">
            <li>
              Process video content you do not own or have the right to use.
            </li>
            <li>
              Generate content that is unlawful, harmful, threatening, abusive,
              defamatory, or otherwise objectionable.
            </li>
            <li>
              Circumvent, disable, or interfere with the security or integrity
              of the Service.
            </li>
            <li>
              Resell or redistribute access to the Service without written
              permission.
            </li>
          </ul>
          <p className="mt-3">
            We reserve the right to suspend or terminate accounts that violate
            these terms.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            You retain all ownership rights to the video content you submit. You
            also own the articles generated from your content.
          </p>
          <p className="mt-3">
            We retain ownership of the Service itself, including all software,
            design, and underlying AI models. You are granted a limited,
            non-exclusive, non-transferable licence to use the Service for its
            intended purpose.
          </p>
        </Section>

        <Section title="7. Privacy and Data Collection">
          <p>We collect the following data to operate the Service:</p>
          <ul className="list-disc list-inside mt-3 space-y-2">
            <li>
              <strong className="text-white">Account data:</strong> email
              address, name, and authentication credentials.
            </li>
            <li>
              <strong className="text-white">Usage data:</strong> articles
              generated, article content, and generation history.
            </li>
            <li>
              <strong className="text-white">Payment data:</strong> billing
              details are handled entirely by our payment processor; we only
              store a tokenised reference.
            </li>
            <li>
              <strong className="text-white">Technical data:</strong> IP
              address, browser type, and usage analytics to improve the Service.
            </li>
          </ul>
          <p className="mt-3">
            We do not sell your personal data to third parties. We may share
            data with trusted service providers (hosting, payment processing,
            email delivery) strictly as necessary to operate the Service, and
            only under confidentiality obligations.
          </p>
          <p className="mt-3">
            You may request deletion of your account and associated data by
            contacting us. We will fulfil such requests within 30 days.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            We use strictly necessary cookies to maintain your session and
            authentication state. We may use analytics cookies to understand
            aggregate usage patterns. You can disable cookies in your browser,
            though this may affect the functionality of the Service.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>
            The Service is provided "as is" and "as available" without
            warranties of any kind, express or implied. We do not guarantee
            that the Service will be uninterrupted, error-free, or that
            AI-generated content will be accurate, complete, or suitable for
            any particular purpose. You are solely responsible for reviewing
            and verifying any generated content before publishing or relying on
            it.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Video To Blog and its
            operators shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising out of your use of or
            inability to use the Service, even if we have been advised of the
            possibility of such damages. Our total aggregate liability shall not
            exceed the amount you paid us in the three months preceding the
            claim.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may update these Terms from time to time. When we do, we will
            update the "Last updated" date above and, for material changes,
            notify you by email or via the Service. Continued use of the Service
            after changes take effect constitutes acceptance of the revised
            Terms.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with
            applicable law. Any disputes shall be resolved in the competent
            courts of the jurisdiction in which we operate. If any provision of
            these Terms is found to be unenforceable, the remaining provisions
            will continue in full force.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            If you have any questions about these Terms or our privacy
            practices, please contact us at:{" "}
            <a
              href="mailto:support@videotoblog.ai"
              className="text-emerald-400 hover:underline"
            >
              support@videotoblog.ai
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-gray-800 py-8 px-4 text-center">
        <p className="text-xs text-gray-700">
          © {new Date().getFullYear()} Video To Blog. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm leading-relaxed text-gray-400">{children}</div>
    </section>
  );
}
