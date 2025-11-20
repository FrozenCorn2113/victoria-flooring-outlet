import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export function NextWeekPreviewSection() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setEmail('');
        toast.success('Successfully subscribed! You\'ll get the full preview every Sunday.');
      } else {
        toast.error(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#F7F5F1] border-t border-[#E4DFD6]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* LEFT: Blurred preview card */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-xl border border-[#D2C5AE] bg-white shadow-sm">
              {/* Tag */}
              <div className="absolute left-5 top-5 z-10">
                <span className="inline-flex items-center rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#FBECD0]">
                  Next week&apos;s deal
                </span>
              </div>

              {/* Lock overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70">
                  <span className="text-sm text-white">🔒</span>
                </div>
                <p className="px-6 text-center text-xs font-medium uppercase tracking-[0.22em] text-[#FBECD0]">
                  Preview for subscribers only
                </p>
              </div>

              {/* Blurred image */}
              <div className="relative h-64 md:h-72 lg:h-80">
                <Image
                  src="/images/next-week-preview.jpg"
                  alt="Next week's flooring deal preview"
                  fill
                  className="object-cover filter blur-sm scale-105"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#8A7A63]">
              *Actual colour and pattern may vary slightly on launch. Subscribers
              get the full unblurred preview every Sunday evening.
            </p>
          </div>

          {/* RIGHT: Copy + email form */}
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-medium text-[#1E1A15]">
              Never miss Victoria&apos;s best flooring deals.
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#716553] max-w-md md:max-w-none">
              Get an early, unblurred look at next week&apos;s featured floor every
              Sunday. One email, once a week. No spam, just beautiful floors at
              outlet pricing.
            </p>

            {submitted ? (
              <div className="mt-6 bg-white border border-[#D2C5AE] rounded-xl p-6 text-center">
                <p className="text-[#1E1A15] font-semibold text-base mb-2">Thank you for subscribing!</p>
                <p className="text-[#716553] text-sm">Check your inbox every Sunday for next week&apos;s preview.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-[#8A7A63] hover:text-[#1E1A15] text-sm underline transition-colors"
                >
                  Subscribe another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-full border border-[#D2C5AE] bg-white px-4 py-3 text-sm text-[#1E1A15] placeholder:text-[#B0A28E] focus:outline-none focus:ring-2 focus:ring-[#D8C59A]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-[#1F1C19] px-6 py-3 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Unlocking...' : 'Unlock next week\'s deal'}
                </button>
              </form>
            )}

            <p className="mt-2 text-xs text-[#8A7A63]">
              We&apos;ll email you the full preview and early access link before it
              goes live on the site.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
