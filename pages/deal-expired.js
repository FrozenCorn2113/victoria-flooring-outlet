// pages/deal-expired.js
// Page shown when user tries to access an expired deal

import Head from 'next/head';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function DealExpired() {
  return (
    <>
      <Head>
        <title>Deal Expired | Victoria Flooring Outlet</title>
      </Head>

      <div className="min-h-screen bg-vfo-sand flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold text-vfo-charcoal mb-3">
              This deal has ended
            </h1>

            <p className="text-lg text-vfo-grey mb-6">
              The Deal of the Week you're looking for has expired. But don't worry – we have a new exclusive deal every week!
            </p>
          </div>

          <div className="bg-vfo-sand border border-vfo-border rounded-sm p-6 mb-6">
            <h2 className="text-vfo-charcoal font-semibold text-lg mb-4">
              Never miss a deal again
            </h2>
            <p className="text-sm text-vfo-grey mb-4">
              Subscribe to get <strong>24-hour early access</strong> to every Deal of the Week:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-vfo-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm text-vfo-charcoal">
                  Shop Sunday night before the public (Monday midnight)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-vfo-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm text-vfo-charcoal">
                  Weekly email with full product details and pricing
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-vfo-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm text-vfo-charcoal">
                  Preview of next week's deal every Sunday
                </span>
              </li>
            </ul>
            <Link
              href="/#email-signup"
              className="block w-full text-center px-6 py-3 bg-vfo-charcoal text-white text-sm font-medium tracking-wide uppercase hover:bg-vfo-slate transition-colors rounded-sm"
            >
              Subscribe for Early Access
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sm text-vfo-grey mb-4">
              Or browse our current products:
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-vfo-border text-vfo-charcoal text-sm font-medium rounded-sm hover:bg-vfo-sand transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
