import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/router';
import { formatCurrency } from '@/lib/utils';

export function HomeHero({ weeklyDeal, onOrderDeal }) {
  const router = useRouter();
  
  if (!weeklyDeal) return null;

  const handleClick = () => {
    router.push(`/products/${weeklyDeal.id}`);
  };

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

  return (
    <section className="bg-vfo-sand cursor-pointer" onClick={handleClick}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.1fr,1.2fr] items-center">
          {/* LEFT: Copy + pricing */}
          <div>
            <p className="text-xs font-medium tracking-[0.25em] text-vfo-grey uppercase">
              This week only
            </p>

            <h1 className="mt-3 text-4xl md:text-5xl font-heading tracking-wide text-vfo-charcoal leading-tight">
              {weeklyDeal.name}
            </h1>

            <p className="mt-3 text-[17px] font-light tracking-wide text-vfo-grey">
              {weeklyDeal.shortTagline || 'Beautiful floors, amazing prices.'}
            </p>

            {/* Pricing card */}
            <div className="mt-6 rounded-lg border border-vfo-border bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  {compareAtPricePerSqFt > 0 && (
                    <div className="flex items-center gap-3 text-xs text-vfo-lightgrey">
                      <span className="line-through">${compareAtPricePerSqFt.toFixed(2)}/sq ft</span>
                      {savingsPercent > 0 && (
                        <span className="inline-flex rounded-full bg-vfo-sand px-3 py-1 font-medium text-vfo-grey">
                          Save {savingsPercent}% this week
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-medium text-vfo-charcoal">
                      ${pricePerSqFt.toFixed(2)}
                    </span>
                    <span className="text-sm font-light text-vfo-grey">/sq ft</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage line */}
            {weeklyDeal.coverageSqFtPerBox && (
              <p className="mt-4 text-sm font-light text-vfo-grey">
                {weeklyDeal.coverageSqFtPerBox} sq ft per box
              </p>
            )}

            {/* Bullets */}
            <ul className="mt-5 space-y-2 text-[15px] font-light text-vfo-grey">
              {weeklyDeal.highlights && weeklyDeal.highlights.slice(0, 3).map((highlight, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1 h-4 w-4 rounded-full bg-vfo-grey"></span>
                  <span>{highlight}</span>
                </li>
              ))}
              {(!weeklyDeal.highlights || weeklyDeal.highlights.length === 0) && (
                <>
                  <li className="flex gap-2">
                    <span className="mt-1 h-4 w-4 rounded-full bg-vfo-grey"></span>
                    <span>Commercial-grade Harbinger flooring</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-4 w-4 rounded-full bg-vfo-grey"></span>
                    <span>Shipped direct to Victoria from the warehouse</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-4 w-4 rounded-full bg-vfo-grey"></span>
                    <span>Limited weekly stock</span>
                  </li>
                </>
              )}
            </ul>

            {/* CTA */}
            <div className="mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="inline-flex items-center justify-center rounded-sm bg-vfo-charcoal px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-vfo-slate transition-colors"
              >
                View this week's deal
              </button>
            </div>
          </div>

          {/* RIGHT: Big room image card */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg border border-vfo-border bg-white shadow-md">
              <div className="absolute left-5 top-5 z-10">
                <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-vfo-grey">
                  Deal of the week
                </span>
              </div>
              <div className="relative w-full h-[500px] md:h-[650px]">
                <Image
                  src={weeklyDeal.image || '/images/Untitled design (21).png'}
                  alt={weeklyDeal.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

