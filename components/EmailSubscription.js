import { useState } from 'react';
import { toast } from 'react-hot-toast';

const EmailSubscription = () => {
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
        toast.success('Successfully subscribed! You\'ll receive next week\'s deal.');
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

  if (submitted) {
    return (
      <div className="bg-vfo-sand border border-vfo-border rounded-sm p-6 text-center">
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-3 border border-vfo-border rounded-sm focus:ring-1 focus:ring-vfo-charcoal focus:border-vfo-charcoal text-base bg-white text-vfo-charcoal placeholder-vfo-lightgrey"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {submitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EmailSubscription;

