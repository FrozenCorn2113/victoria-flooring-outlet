import Link from 'next/link';
import { XCircleIcon } from '@heroicons/react/24/outline';

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-vfo-sand flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <XCircleIcon className="w-20 h-20 text-vfo-slate" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-vfo-charcoal mb-4">
          Checkout Canceled
        </h1>

        {/* Message */}
        <p className="text-vfo-grey mb-6">
          No charges were made to your card. You can return to the weekly deal page to try again or browse our other products.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block px-8 py-3 bg-vfo-charcoal text-white font-medium hover:bg-vfo-slate transition-colors"
          >
            View This Week's Deal
          </Link>

          <Link
            href="/products"
            className="block px-8 py-3 border border-vfo-border text-vfo-charcoal font-medium hover:bg-vfo-sand transition-colors"
          >
            Browse All Products
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-xs text-vfo-lightgrey mt-6">
          Need help? Text Ty at{' '}
          <a href="sms:+12508867775" className="text-vfo-accent hover:underline">
            250-886-7775
          </a>
        </p>
      </div>
    </div>
  );
}
