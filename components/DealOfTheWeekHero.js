// components/DealOfTheWeekHero.js

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/outline';
import { CountdownTimer } from './CountdownTimer';
import { TalkToTy } from './TalkToTy';

export function DealOfTheWeekHero({ weeklyDeal }) {
  if (!weeklyDeal) return null;

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
    'Scratch-resistant wear layer',
    'Ships direct from Richmond, BC'
  ];

  const highlights = weeklyDeal.highlights || defaultHighlights;

  return (
    <section className="relative bg-vfo-sand">
      {/* Full-width container */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-0">

          {/* LEFT: Editorial Copy Block */}
          <div className="relative px-6 md:px-12 lg:px-16 py-12 md:py-16 lg:py-20 flex flex-col justify-center bg-vfo-sand">

            {/* Urgent label */}
            <p className="text-xl md:text-2xl lg:text-3xl font-bold uppercase text-vfo-accent mb-4 text-center">
              This Week Only
            </p>

            {/* Countdown Timer - Prominent placement */}
            <div className="mb-5 bg-white/60 backdrop-blur-sm border border-vfo-accent/20 rounded-sm px-4 py-3 inline-flex flex-col items-center">
              <p className="text-xs uppercase tracking-wider text-vfo-accent mb-2.5 font-medium text-center">
                Deal ends in:
              </p>
              <CountdownTimer targetDay={1} />
            </div>

            {/* Large heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading tracking-tight text-vfo-charcoal leading-[1.1] mb-4">
              {weeklyDeal.name}
            </h1>

            {/* Subheading */}
            <p className="text-sm md:text-base font-light text-vfo-grey leading-relaxed max-w-md mb-5">
              {weeklyDeal.shortTagline || 'Commercial-grade luxury vinyl plank flooring. Exceptional durability meets timeless design.'}
            </p>

            {/* Inline pricing - Tilebar style */}
            <div className="mb-5">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl md:text-4xl font-medium text-vfo-charcoal">
                  ${pricePerSqFt.toFixed(2)}
                </span>
                <span className="text-base font-light text-vfo-grey">/sq ft</span>
                {compareAtPricePerSqFt > 0 && (
                  <span className="text-sm text-vfo-lightgrey line-through ml-2">
                    ${compareAtPricePerSqFt.toFixed(2)}
                  </span>
                )}
              </div>
              {savingsPercent > 0 && (
                <p className="text-sm font-medium text-vfo-accent">
                  Save {savingsPercent}% this week only
                </p>
              )}
              {weeklyDeal.coverageSqFtPerBox && (
                <p className="text-xs font-light text-vfo-grey mt-1">
                  {weeklyDeal.coverageSqFtPerBox} sq ft per box
                </p>
              )}
            </div>

            {/* Feature bullets - refined */}
            <ul className="space-y-2 mb-6">
              {highlights.slice(0, 4).map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm font-light text-vfo-grey">
                  <CheckIcon className="w-4 h-4 text-vfo-accent flex-shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

            {/* Talk to Ty Helper Box */}
            <TalkToTy />

            {/* CTA - Clean, rectangular Tilebar style */}
            <div className="text-center">
              <Link
                href={`/products/${weeklyDeal.id}`}
                className="inline-flex items-center justify-center px-8 py-3 bg-vfo-charcoal text-white text-sm font-medium tracking-wide uppercase hover:bg-vfo-slate transition-colors"
              >
                View This Week's Deal
              </Link>
              <p className="text-xs text-vfo-lightgrey mt-2 font-light">
                Limited weekly inventory · Ships within 3-5 days
              </p>
            </div>
          </div>

          {/* RIGHT: Full-bleed lifestyle image */}
          <div className="relative min-h-[300px] md:min-h-[400px] lg:min-h-[450px]">
            <Image
              src={weeklyDeal.image || '/images/Untitled design (21).png'}
              alt={`${weeklyDeal.name} installed in a beautiful interior`}
              fill
              className="object-cover"
              priority
            />

            {/* Floating badge on image */}
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 shadow-lg">
              <p className="text-[10px] tracking-[0.3em] uppercase text-vfo-accent font-medium">
                Deal of the Week
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

