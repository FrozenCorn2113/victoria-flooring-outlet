// components/CheckoutEmailCapture.js
// Inline email capture + checkout button (abandoned cart tracking)

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { event } from '@/lib/analytics';

const CheckoutEmailCapture = ({ 
  onCheckout, // Function to call after email is captured
  cartItems, 
  cartTotal, 
  dealId, 
  dealEndsAt 
}) => {
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setProcessing(true);

    try {
      // Capture email for abandoned cart tracking
      const response = await fetch('/api/cart/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          cartItems,
          dealId,
          dealEndsAt,
          cartTotal,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        event({
          action: 'generate_lead',
          category: 'checkout',
          label: 'email_capture',
          value: Number(((cartTotal || 0) / 100).toFixed(2)),
          method: 'email',
          currency: 'CAD',
        });
        
        // Immediately proceed to checkout with email and sessionToken
        await onCheckout(email, data.sessionToken);
      } else {
        toast.error(data.error || 'Something went wrong. Please try again.');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Network error. Please check your connection.');
      setProcessing(false);
    }
  };

  return (
    <div className="bg-vfo-sand border border-vfo-border rounded-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="checkout-email" className="block text-sm font-medium text-vfo-charcoal mb-2">
            Email address
          </label>
          <input
            id="checkout-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={processing}
            className="w-full px-4 py-3 border border-vfo-border rounded-sm focus:ring-1 focus:ring-vfo-charcoal focus:border-vfo-charcoal text-base bg-white text-vfo-charcoal placeholder-vfo-lightgrey disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1.5 text-xs text-vfo-grey">
            For order updates and cart recovery if you need to come back later
          </p>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full px-6 py-4 bg-vfo-charcoal hover:bg-vfo-slate text-white font-semibold rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing && <ArrowPathIcon className="w-5 h-5 animate-spin" />}
          {processing ? 'Processing...' : 'Proceed to Secure Checkout'}
        </button>
      </form>
    </div>
  );
};

export default CheckoutEmailCapture;
