// components/HarbingerInfoSection.js

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function HarbingerInfoSection() {
  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-[1fr,1.3fr] gap-12 md:gap-16 items-center">

          {/* Left: Image */}
          <div className="relative h-[300px] md:h-[400px] overflow-hidden">
            <Image
              src="/images/harbinger-warehouse.jpg"
              alt="Harbinger Floors facility in Richmond, BC"
              fill
              className="object-cover"
            />
          </div>

          {/* Right: Copy */}
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-vfo-accent mb-4">
              Featured Brand
            </p>
            <h2 className="text-3xl md:text-4xl font-heading text-vfo-charcoal mb-6 leading-tight">
              Crafted by Harbinger Floors in Richmond, BC
            </h2>
            <div className="space-y-4 text-[15px] font-light text-vfo-grey leading-relaxed">
              <p>
                Every week, we highlight commercial-grade luxury vinyl plank from Harbinger Floors at exceptional prices.
              </p>
              <p>
                Harbinger is a trusted Canadian manufacturer specializing in waterproof, scratch-resistant flooring built for real life—from busy families to high-traffic commercial spaces.
              </p>
              <p>
                Orders ship direct to your door in Victoria, with fast, dependable delivery.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/harbinger-luxury-vinyl-flooring"
                className="inline-flex items-center gap-2 text-sm font-medium text-vfo-accent hover:text-vfo-charcoal transition-colors group"
              >
                <span>Learn more about Harbinger</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
