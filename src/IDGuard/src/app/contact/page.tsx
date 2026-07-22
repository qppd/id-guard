"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FadeInView } from "@/components/Parallax";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) {
      setError("Please fill in all fields.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again or email us directly.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary font-body">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <FadeInView>
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logos/id_guard_logo.png"
              alt="IDGuard"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-semibold font-poppins text-text-primary">
              Contact Us
            </h1>
          </div>
          <p className="text-text-secondary leading-relaxed mb-10">
            Have a question, feedback, or need help with IDGuard? Send us a message and
            we&apos;ll get back to you as soon as possible.
          </p>
        </FadeInView>

        <FadeInView delay={0.1}>
          {status === "sent" ? (
            <div className="bg-card border border-border-card rounded-lg p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Message Sent!</h2>
              <p className="text-text-secondary text-sm">
                Thanks for reaching out. We&apos;ll respond to your email shortly.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 bg-card border border-border-card rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-card border border-border-card rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full px-4 py-2.5 bg-card border border-border-card rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-focus-ring resize-none"
                  aria-required="true"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-status-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full px-6 py-3 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "sending" ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </FadeInView>

        <div className="mt-12 pt-8 border-t border-border-card flex items-center justify-between">
          <Link href="/" className="text-sm text-accent hover:underline">
            ← Back to IDGuard
          </Link>
          <div className="flex gap-4 text-sm text-text-secondary">
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-accent transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
