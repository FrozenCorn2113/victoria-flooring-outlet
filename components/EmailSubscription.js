import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { event } from '@/lib/analytics';

const EmailSubscription = ({ source = 'general_email_subscription' }) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      const errorMsg = 'Please enter a valid email address';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setSubmitting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setEmail('');
        toast.success('Successfully subscribed! You\'ll receive next week\'s deal.');
        event({
          action: 'sign_up',
          category: 'newsletter',
          label: source,
          method: 'email',
        });
      } else {
        const errorMsg = data.error || 'Something went wrong. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      let errorMsg = 'Something went wrong. Please try again.';
      if (error.name === 'AbortError') {
        errorMsg = 'Request timed out. Please check your connection and try again.';
      } else if (error.message === 'Failed to fetch') {
        errorMsg = 'Network error. Please check your connection.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-vfo-sand border border-vfo-border rounded-sm p-6 text-center" role="status" aria-live="polite">
        <p className="text-vfo-charcoal font-heading text-base mb-2">Thank you for subscribing!</p>
        <p className="text-vfo-grey font-light text-sm">Check your inbox for next week's flooring deal.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-vfo-grey hover:text-vfo-charcoal text-sm underline transition-colors"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(''); // Clear error when user starts typing
            }}
            placeholder="your@email.com"
            required
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'email-error' : undefined}
            className="flex-1 px-4 py-3 border border-vfo-border rounded-sm focus:ring-1 focus:ring-vfo-charcoal focus:border-vfo-charcoal text-base bg-white text-vfo-charcoal placeholder-vfo-lightgrey"
          />
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="px-6 py-3 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
          >
            {submitting && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            {submitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
        {error && (
          <p id="email-error" role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <p className="mt-2 text-xs text-vfo-grey">
          By subscribing, you agree to receive weekly flooring deals and updates. You can unsubscribe anytime. See our <a href="/privacy" className="underline hover:text-vfo-charcoal">privacy policy</a>.
        </p>
      </div>
    </form>
  );
};

export default EmailSubscription;

