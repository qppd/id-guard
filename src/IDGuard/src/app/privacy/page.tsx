import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy — IDGuard",
  description: "How IDGuard handles your data, smart lock credentials, and personal information.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
        </div>
        <p className="text-sm text-text-secondary mb-10">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              1. Information We Collect
            </h2>
            <p className="text-text-secondary leading-relaxed">
              IDGuard collects only the information necessary to manage your TTLock-compatible
              smart locks. This includes:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary list-disc pl-6">
              <li>Your TTLock Cloud API credentials (client ID and client secret)</li>
              <li>OAuth access tokens issued by TTLock for lock operations</li>
              <li>Lock metadata you view or manage (lock names, battery levels, locations)</li>
              <li>App activity logs including passcode creation, fingerprint enrollment, and IC card management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              2. How We Use Your Data
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Your data is used solely to provide the smart lock management features of IDGuard.
              We do not sell, rent, or share your data with third parties. Specifically:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary list-disc pl-6">
              <li>To authenticate and communicate with TTLock Cloud API on your behalf</li>
              <li>To display lock status, battery levels, and access history in your dashboard</li>
              <li>To manage passcodes, fingerprints, and IC cards for your locks</li>
              <li>To send webhook notifications about lock events you subscribe to</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              3. Data Storage &amp; Security
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Your TTLock API credentials and access tokens are stored securely in environment
              variables and encrypted at rest. All API communication is conducted over HTTPS.
              We do not store your lock data in external databases — all lock state is fetched
              live from the TTLock Cloud API on each request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              4. Third-Party Services
            </h2>
            <p className="text-text-secondary leading-relaxed">
              IDGuard integrates with the following third-party services:
            </p>
            <ul className="mt-3 space-y-2 text-text-secondary list-disc pl-6">
              <li><strong>TTLock Cloud API</strong> — for all smart lock operations and authentication</li>
              <li><strong>Vercel</strong> — for application hosting and serverless function execution</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-3">
              Each service has its own privacy policy that governs how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              5. Your Rights
            </h2>
            <p className="text-text-secondary leading-relaxed">
              You have the right to access, correct, or delete your data at any time. Since
              IDGuard fetches lock data live from the TTLock API, revoking the OAuth token in
              your TTLock account will immediately sever IDGuard&apos;s access. You can also
              clear cached data from the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              6. Cookies
            </h2>
            <p className="text-text-secondary leading-relaxed">
              IDGuard uses a single HTTP-only cookie for session authentication. We do not use
              tracking cookies, analytics cookies, or advertising cookies. Theme preferences
              (dark mode, accent color) are stored in your browser&apos;s local storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2 border-l-[3px] border-accent pl-3">
              7. Contact
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Questions about this policy? <Link href="/contact" className="text-accent hover:underline">Contact us</Link>.
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
