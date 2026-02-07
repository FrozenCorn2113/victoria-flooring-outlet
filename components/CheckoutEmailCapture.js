// components/CheckoutEmailCapture.js
// Email capture component for cart page (abandoned cart tracking)

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { event } from '@/lib/analytics';

const CheckoutEmailCapture = ({ 
  onEmailCaptured,
  onProceedToCheckout, // New prop to auto-proceed after capture
  cartItems, 
  cartTotal, 
  dealId, 
  dealEndsAt,
  postalCode,
  shippingZone 
}) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [captured, setCaptured] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
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
          postalCode,
          shippingZone,
          cartTotal,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCaptured(true);
        onEmailCaptured(email, data.sessionToken);
        toast.success('Email saved! Redirecting to checkout...');
        event({
          action: 'generate_lead',
          category: 'checkout',
          label: 'email_capture',
          value: Number(((cartTotal || 0) / 100).toFixed(2)),
          method: 'email',
          currency: 'CAD',
        });
        
        // Auto-proceed to checkout after capture
        if (onProceedToCheckout) {
          setTimeout(() => {
            onProceedToCheckout();
          }, 500); // Small delay so user sees the success message
        }
      } else {
        toast.error(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Email capture error:', error);
      toast.error('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (captured) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-4" role="status">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="w-4 h-4 animate-spin text-green-600" />
          <p className="text-green-800 text-sm">
            Email saved! Redirecting to secure checkout...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-vfo-sand border border-vfo-border rounded-sm p-6 mb-6">
      <h3 className="text-vfo-charcoal font-heading text-lg mb-2">
        Complete your order
      </h3>
      <p className="text-vfo-grey text-sm mb-4">
        Enter your email to proceed to secure checkout
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 border border-vfo-border rounded-sm focus:ring-1 focus:ring-vfo-charcoal focus:border-vfo-charcoal text-base bg-white text-vfo-charcoal placeholder-vfo-lightgrey"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
          {submitting ? 'Saving...' : 'Proceed to Checkout'}
        </button>

        <p className="text-xs text-vfo-grey">
          We'll use this to send order updates and save your cart if you need to come back later.
        </p>
      </form>
    </div>
  );
};

export default CheckoutEmailCapture;
