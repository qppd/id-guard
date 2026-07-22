import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Terms of Service — IDGuard",
  description: "The terms and conditions for using IDGuard smart lock management.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-body">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Image
            src="/logos/id_guard_logo.png"
            alt="IDGuard"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-semibold font-poppins text-text-primary">
            Terms of Service
          </h1>
        </div>
        <p className="text-sm text-text-secondary mb-10">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-text-secondary leading-relaxed">
              By accessing and using IDGuard, you agree to be bound by these Terms of Service.
              If you do not agree with any part of these terms, you must not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              2. Description of Service
            </h2>
            <p className="text-text-secondary leading-relaxed">
              IDGuard is a web-based management interface for TTLock-compatible smart locks.
              It provides a dashboard to view lock status, manage passcodes, fingerprints,
              IC cards, gateways, and access records through the TTLock Cloud API.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              3. User Responsibilities
            </h2>
            <ul className="space-y-2 text-text-secondary list-disc pl-6">
              <li>You are responsible for keeping your TTLock API credentials and OAuth tokens secure.</li>
              <li>You must not use IDGuard to gain unauthorized access to locks you do not own or manage.</li>
              <li>You are responsible for all activities performed through your authenticated session.</li>
              <li>You must comply with all applicable local laws and TTLock&apos;s own terms of service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              4. Limitation of Liability
            </h2>
            <p className="text-text-secondary leading-relaxed">
              IDGuard is provided &quot;as is&quot; without warranties of any kind. The application
              relies on the TTLock Cloud API, and we are not responsible for any service disruptions,
              data loss, or lock malfunctions caused by TTLock&apos;s infrastructure. We are not
              liable for any damages arising from the use or inability to use IDGuard, including
              but not limited to lock access failures, unauthorized entry, or property damage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              5. Intellectual Property
            </h2>
            <p className="text-text-secondary leading-relaxed">
              The IDGuard application, including its design, source code, and visual assets,
              is the intellectual property of its creators. TTLock and related trademarks are
              property of their respective owners. IDGuard is an independent tool and is not
              affiliated with or endorsed by TTLock.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              6. Termination
            </h2>
            <p className="text-text-secondary leading-relaxed">
              You may stop using IDGuard at any time by revoking the OAuth token in your TTLock
              account. We reserve the right to discontinue or modify the service at any time
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              7. Changes to Terms
            </h2>
            <p className="text-text-secondary leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of IDGuard
              after any changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              8. Contact
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Questions about these terms? <Link href="/contact" className="text-accent hover:underline">Contact us</Link>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border-card">
          <Link href="/" className="text-sm text-accent hover:underline">
            ← Back to IDGuard
          </Link>
        </div>
      </div>
    </div>
  );
}
