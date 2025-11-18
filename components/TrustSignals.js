// components/TrustSignals.js

import { ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';

export function TrustSignals() {
  return (
    <section className="py-12 bg-white border-y border-vfo-border/30">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">

          {/* Trust Signal 1: Warranty */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 flex items-center justify-center">
              <ShieldCheckIcon className="w-10 h-10 text-vfo-accent stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-medium text-vfo-charcoal mb-1 tracking-wide">
              Lifetime Warranty
            </h3>
            <p className="text-xs font-light text-vfo-grey leading-relaxed">
              Residential lifetime coverage on all Harbinger floors
            </p>
          </div>

          {/* Trust Signal 2: Canadian */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-vfo-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L8 7h3v5h2V7h3l-4-5zM7 13v8h10v-8h-2v6H9v-6H7z"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-vfo-charcoal mb-1 tracking-wide">
              Factory Direct
            </h3>
            <p className="text-xs font-light text-vfo-grey leading-relaxed">
              No middleman markup · Fast shipping
            </p>
          </div>

          {/* Trust Signal 3: Waterproof */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-vfo-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c0 0-6 6-6 10.5 0 3.314 2.686 6 6 6s6-2.686 6-6C18 9 12 3 12 3z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 13.5c0-1.5 1-3 3.5-3"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-vfo-charcoal mb-1 tracking-wide">
              100% Waterproof
            </h3>
            <p className="text-xs font-light text-vfo-grey leading-relaxed">
              Luxury vinyl perfect for kitchens, baths, and basements
            </p>
          </div>

          {/* Trust Signal 4: Installers */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-vfo-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-vfo-charcoal mb-1 tracking-wide">
              Trusted Installers
            </h3>
            <p className="text-xs font-light text-vfo-grey leading-relaxed">
              Vetted local contractors ready to help
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
