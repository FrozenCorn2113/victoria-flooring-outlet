// components/DealClosedBanner.js
// Banner shown when deal has expired

import Link from 'next/link';

export function DealClosedBanner({ className = '' }) {
  return (
    <div className={`bg-amber-50 border-l-4 border-amber-400 p-6 ${className}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-amber-900 mb-1">
            This deal has ended
          </h3>
          <p className="text-sm text-amber-800">
            This Deal of the Week has expired. Subscribe to get early access to next week's exclusive deal!
          </p>
        </div>
        <Link
          href="/#email-signup"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-sm transition-colors whitespace-nowrap"
        >
          Get Next Week's Deal
        </Link>
      </div>
    </div>
  );
}
