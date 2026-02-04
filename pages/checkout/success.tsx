import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function CheckoutSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session_id) {
      // Optionally fetch session details from Stripe
      // For MVP, we'll just display the confirmation without fetching
      setLoading(false);
    }
  }, [session_id]);

  return (
    <div className="min-h-screen bg-vfo-sand flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="w-20 h-20 text-vfo-trust" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-vfo-charcoal mb-4">
          Order Received!
        </h1>

        {/* Message */}
        <p className="text-vfo-grey mb-6">
          Thank you for your order. You'll receive an email confirmation shortly with your order details and shipping information.
        </p>

        {session_id && (
          <p className="text-sm text-vfo-slate mb-6">
            Order ID: <span className="font-mono">{session_id}</span>
          </p>
        )}

        {/* Contact Info */}
        <div className="border-t border-vfo-border pt-6 mb-6">
          <p className="text-vfo-grey mb-3">
            Questions about your order?
          </p>
          <a
            href="sms:+12508867775"
            className="inline-flex items-center justify-center px-6 py-3 bg-vfo-accent text-white font-medium hover:bg-vfo-accentLight transition-colors"
          >
            Text Ty: 250-886-7775
          </a>
        </div>

        {/* Return Home Button */}
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-vfo-charcoal text-white font-medium hover:bg-vfo-slate transition-colors"
        >
          Return to Home
        </Link>

        {/* Additional Info */}
        <p className="text-xs text-vfo-lightgrey mt-6">
          Your flooring will ship within 3-5 business days.
        </p>
      </div>
    </div>
  );
}
