// components/DealOfTheWeekHero.js

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/outline';
import { CountdownTimer } from './CountdownTimer';

export function DealOfTheWeekHero({ weeklyDeal }) {
  if (!weeklyDeal) {
    return (
      <section className="bg-white border-b border-vfo-border/30">
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-vfo-accent/10 text-vfo-accent border border-vfo-accent/20">
              Weekly Deal
            </span>
            <h1 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-medium text-vfo-charcoal leading-tight">
              New deal coming soon
            </h1>
            <p className="mt-4 text-base md:text-lg text-vfo-grey">
              We’re updating the weekly deal right now. Join the list and we’ll notify you as
              soon as the next special goes live.
            </p>
            <Link
              href="/#email-signup"
              className="mt-6 inline-flex items-center justify-center px-8 py-3.5 bg-vfo-charcoal text-white text-base font-medium tracking-wide uppercase hover:bg-vfo-slate transition-colors rounded-sm shadow-sm"
            >
              Get Weekly Deals
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Calculate price per sq ft - use pricePerSqFt if available, otherwise calculate from price and coverage
  const pricePerSqFt = weeklyDeal.pricePerSqFt
    ? weeklyDeal.pricePerSqFt
    : weeklyDeal.coverageSqFtPerBox
    ? (weeklyDeal.price / 100) / weeklyDeal.coverageSqFtPerBox
    : 0;

  // Calculate compare at price per sq ft
  const compareAtPricePerSqFt = weeklyDeal.compareAtPricePerSqFt
    ? weeklyDeal.compareAtPricePerSqFt
    : weeklyDeal.compareAtPrice && weeklyDeal.coverageSqFtPerBox
    ? (weeklyDeal.compareAtPrice / 100) / weeklyDeal.coverageSqFtPerBox
    : 0;

  const savingsPercent = compareAtPricePerSqFt > 0 && pricePerSqFt > 0
    ? Math.round(((compareAtPricePerSqFt - pricePerSqFt) / compareAtPricePerSqFt) * 100)
    : 0;

  const defaultHighlights = [
    'Commercial-grade Harbinger flooring',
    '100% waterproof luxury vinyl plank',
    'Scratch-resistant wear layer'
  ];

  const highlights = weeklyDeal.highlights || defaultHighlights;

  return (
    <section className="bg-white border-b border-vfo-border/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-0">
          {/* LEFT: Product info and pricing */}
          <div className="px-6 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20 flex flex-col justify-center">
            {/* Urgency label */}
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-vfo-accent/10 text-vfo-accent border border-vfo-accent/20">
                This Week Only
              </span>
            </div>

            {/* Countdown timer */}
            <div className="mb-6">
              <p className="text-sm text-vfo-grey mb-3 tracking-wide">Deal ends in:</p>
              <CountdownTimer targetDay={1} />
            </div>

            {/* Product heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-vfo-charcoal mb-3 leading-tight">
              {weeklyDeal.name}
            </h1>

            {/* Subheading */}
            {weeklyDeal.shortTagline && (
              <p className="text-lg md:text-xl text-vfo-grey font-light mb-6">
                {weeklyDeal.shortTagline}
              </p>
            )}

            {/* Inline price display */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl md:text-5xl font-semibold text-vfo-charcoal">
                {formatCurrency(pricePerSqFt * 100)}
              </span>
              <span className="text-lg text-vfo-grey">/sq ft</span>
              {compareAtPricePerSqFt > 0 && (
                <>
                  <span className="text-xl text-vfo-lightgrey line-through">
                    {formatCurrency(compareAtPricePerSqFt * 100)}
                  </span>
                  {savingsPercent > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 text-sm font-medium rounded">
                      Save {savingsPercent}%
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Feature highlights */}
            <ul className="space-y-3 mb-8">
              {highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-vfo-accent flex-shrink-0 mt-0.5" />
                  <span className="text-base text-vfo-charcoal font-light">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Button - Links to product page */}
            <div className="space-y-4">
              <Link
                href={`/products/${weeklyDeal.id}`}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-vfo-charcoal text-white text-base font-medium tracking-wide uppercase hover:bg-vfo-slate transition-colors rounded-sm shadow-sm w-full md:w-auto"
              >
                View This Week's Deal
              </Link>

              <p className="text-sm text-vfo-grey">
                Free shipping on orders over 500 sq ft
              </p>
            </div>
          </div>

          {/* RIGHT: Full-bleed lifestyle image */}
          <Link
            href={`/products/${weeklyDeal.id}`}
            className="relative min-h-[300px] md:min-h-[400px] lg:min-h-[450px] block"
            aria-label={`View this week's deal: ${weeklyDeal.name}`}
          >
            {weeklyDeal.image ? (
              <Image
                src={weeklyDeal.image}
                alt={`${weeklyDeal.name} installed in a beautiful interior`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-vfo-lightgrey/40">
                <span className="text-sm uppercase tracking-[0.2em] text-vfo-grey">
                  Image coming soon
                </span>
              </div>
            )}

            {/* Floating badge on image */}
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 shadow-lg">
              <p className="text-[10px] tracking-[0.3em] uppercase text-vfo-accent font-medium">
                Deal of the Week
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
