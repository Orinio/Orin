'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/footer';
import {
  User,
  Mail,
  MessageSquare,
  Send,
  Clock,
  HelpCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Validation */
  const [touched, setTouched] = useState({ name: false, email: false, message: false });

  const errors = {
    name: touched.name && !name.trim() ? 'Name is required' : '',
    email:
      touched.email && !email.trim()
        ? 'Email is required'
        : touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          ? 'Please enter a valid email'
          : '',
    message:
      touched.message && !message.trim()
        ? 'Message is required'
        : touched.message && message.trim().length < 10
          ? 'Message must be at least 10 characters'
          : '',
  };

  const isValid = name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && message.trim().length >= 10;

  const handleBlur = (field: keyof typeof touched) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || undefined,
          message: message.trim().slice(0, 1000),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSuccess(false);
    setError(null);
    setTouched({ name: false, email: false, message: false });
  };

  return (
    <>
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section
        className="relative overflow-hidden pt-28 pb-16 px-6"
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #fff7ed 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[var(--color-primary-emerald)] opacity-[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[var(--color-primary-orange)] opacity-[0.06] blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border border-[var(--color-primary-emerald)]/20 bg-[var(--color-primary-soft)] px-4 py-1.5 text-xs font-semibold tracking-wide text-[var(--color-primary-emerald)] uppercase">
            Get in touch
          </span>
          <h1 className="mt-5 font-serif text-4xl font-bold text-[var(--color-neutral-text)] md:text-5xl">
            We&apos;d love to hear
            <br />
            from you
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-[var(--color-neutral-text-secondary)]">
            Have a question, feedback, or just want to say hello? Drop us a line and our team will
            get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* ─── Content Grid ─── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
          {/* ─── Left: Contact Info ─── */}
          <div className="space-y-8">
            {/* Email card */}
            <div className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary-emerald)]">
                <Mail size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--color-neutral-text)]">
                Email us
              </h3>
              <a
                href="mailto:support@orin.app"
                className="mt-1 block text-sm text-[var(--color-primary-emerald)] hover:underline"
              >
                support@orin.app
              </a>
            </div>

            {/* Response time card */}
            <div className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-orange-light)] text-[var(--color-primary-orange)]">
                <Clock size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--color-neutral-text)]">
                Response time
              </h3>
              <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                We typically respond within <strong className="text-[var(--color-neutral-text)]">24 hours</strong> on business days.
              </p>
            </div>

            {/* FAQ link card */}
            <div className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary-emerald)]">
                <HelpCircle size={20} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--color-neutral-text)]">
                Check our FAQ
              </h3>
              <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                Find quick answers to common questions about proof cards, verification, and more.
              </p>
              <Link
                href="/faq"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary-emerald)] hover:underline"
              >
                Browse FAQ
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* ─── Right: Form ─── */}
          <div className="rounded-2xl border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-8 shadow-sm">
            {success ? (
              /* ─── Success State ─── */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] animate-[scaleIn_0.4s_ease-out]">
                  <CheckCircle2 size={32} className="text-[var(--color-primary-emerald)]" />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-semibold text-[var(--color-neutral-text)]">
                  Message sent!
                </h3>
                <p className="mt-2 max-w-sm text-sm text-[var(--color-neutral-text-secondary)]">
                  Thank you for reaching out, {name.split(' ')[0]}! We&apos;ve received your
                  message and will get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-6 rounded-lg border border-[var(--color-neutral-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-neutral-text)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              /* ─── Form ─── */
              <>
                <h2 className="font-serif text-xl font-semibold text-[var(--color-neutral-text)]">
                  Send us a message
                </h2>
                <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                  Fill out the form below and we&apos;ll get back to you soon.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contactName"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-neutral-text)]"
                    >
                      Name
                    </label>
                    <div
                      className={`flex items-center rounded-lg border bg-[var(--color-neutral-bg)] transition ${
                        errors.name
                          ? 'border-[var(--color-danger)] ring-2 ring-[var(--color-danger)]/10'
                          : 'border-[var(--color-neutral-border)] focus-within:border-[var(--color-primary-emerald)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]'
                      }`}
                    >
                      <span className="pl-3.5 text-[var(--color-neutral-text-tertiary)]">
                        <User size={16} />
                      </span>
                      <input
                        id="contactName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="Your name"
                        className="w-full border-0 bg-transparent px-3 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] focus:outline-none"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contactEmail"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-neutral-text)]"
                    >
                      Email
                    </label>
                    <div
                      className={`flex items-center rounded-lg border bg-[var(--color-neutral-bg)] transition ${
                        errors.email
                          ? 'border-[var(--color-danger)] ring-2 ring-[var(--color-danger)]/10'
                          : 'border-[var(--color-neutral-border)] focus-within:border-[var(--color-primary-emerald)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]'
                      }`}
                    >
                      <span className="pl-3.5 text-[var(--color-neutral-text-tertiary)]">
                        <Mail size={16} />
                      </span>
                      <input
                        id="contactEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="you@example.com"
                        className="w-full border-0 bg-transparent px-3 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] focus:outline-none"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.email}</p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="contactSubject"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-neutral-text)]"
                    >
                      Subject <span className="text-[var(--color-neutral-text-tertiary)]">(optional)</span>
                    </label>
                    <div className="flex items-center rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] transition focus-within:border-[var(--color-primary-emerald)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]">
                      <span className="pl-3.5 text-[var(--color-neutral-text-tertiary)]">
                        <MessageSquare size={16} />
                      </span>
                      <input
                        id="contactSubject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="What's this about?"
                        className="w-full border-0 bg-transparent px-3 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contactMessage"
                      className="mb-1.5 block text-sm font-medium text-[var(--color-neutral-text)]"
                    >
                      Message
                    </label>
                    <div
                      className={`flex rounded-lg border bg-[var(--color-neutral-bg)] transition ${
                        errors.message
                          ? 'border-[var(--color-danger)] ring-2 ring-[var(--color-danger)]/10'
                          : 'border-[var(--color-neutral-border)] focus-within:border-[var(--color-primary-emerald)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]'
                      }`}
                    >
                      <span className="pl-3.5 pt-3 text-[var(--color-neutral-text-tertiary)]">
                        <MessageSquare size={16} />
                      </span>
                      <textarea
                        id="contactMessage"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onBlur={() => handleBlur('message')}
                        placeholder="Tell us what's on your mind..."
                        rows={5}
                        maxLength={1000}
                        className="w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      {errors.message ? (
                        <p className="text-xs text-[var(--color-danger)]">{errors.message}</p>
                      ) : (
                        <span />
                      )}
                      <p className="text-xs text-[var(--color-neutral-text-tertiary)]">
                        {message.length}/1000
                      </p>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-green inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Animation keyframes ─── */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <Footer />
    </>
  );
}
