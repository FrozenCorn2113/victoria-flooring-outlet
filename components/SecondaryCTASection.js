// components/SecondaryCTASection.js

import Link from 'next/link';

export function SecondaryCTASection({ weeklyDeal }) {
  if (!weeklyDeal) return null;

  return (
    <section className="py-16 md:py-20 bg-vfo-sand border-t border-vfo-border/30">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-heading text-vfo-charcoal mb-6">
          Ready to upgrade your floors?
        </h2>
        <p className="text-base font-light text-vfo-grey mb-8 max-w-2xl mx-auto">
          This week's deal won't last long. Stock is limited and refreshes every Monday.
        </p>
        <Link
          href={`/products/${weeklyDeal.id}`}
          className="inline-flex items-center justify-center px-10 py-4 bg-vfo-charcoal text-white text-sm font-medium tracking-wide uppercase hover:bg-vfo-slate transition-colors"
        >
          View This Week's Deal
        </Link>
      </div>
    </section>
  );
}
