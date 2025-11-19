import Head from 'next/head';
import {
  EmailSubscription,
  DealOfTheWeekHero,
  SecondaryCTASection
} from '@/components/index';
import { getWeeklyDeal } from '@/lib/products';

export default function Home() {
  const weeklyDeal = getWeeklyDeal();

  return (
    <>
      <Head>
        <title>Victoria Flooring Outlet - Deal of the Week | Premium Flooring Deals in Victoria, BC</title>
        <meta name="description" content="Get this week's exclusive flooring deal from Victoria Flooring Outlet. Premium Harbinger luxury vinyl flooring at warehouse prices. Free shipping on orders over 500 sq ft." />

        {/* LocalBusiness Schema.org markup for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': 'https://victoriaflooringoutlet.ca',
              name: 'Victoria Flooring Outlet',
              description: 'Premium flooring deals in Victoria, BC. Weekly deals on luxury vinyl plank, laminate, and hardwood flooring at warehouse prices.',
              url: 'https://victoriaflooringoutlet.ca',
              priceRange: '$-$$',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Victoria',
                addressRegion: 'BC',
                addressCountry: 'CA',
              },
              areaServed: {
                '@type': 'GeoCircle',
                geoMidpoint: {
                  '@type': 'GeoCoordinates',
                  latitude: 48.4284,
                  longitude: -123.3656,
                },
                geoRadius: '50000', // 50km radius
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '00:00',
                closes: '23:59',
              },
              sameAs: [],
            }),
          }}
        />
      </Head>

      <main className="min-h-screen bg-vfo-sand">
        {/* 1. Hero - Full-width lifestyle with single strong CTA */}
        <DealOfTheWeekHero weeklyDeal={weeklyDeal} />

        {/* 2. Email Signup - Refined messaging */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-heading text-vfo-charcoal mb-4 tracking-tight">
              Never miss a deal.
            </h2>
            <p className="text-[15px] font-light text-vfo-grey leading-relaxed mb-8">
              Get next week's exclusive flooring deal delivered every Monday. One email, no spam, pure savings.
            </p>
            <div className="max-w-md mx-auto">
              <EmailSubscription />
            </div>
          </div>
        </section>

        {/* 6. Secondary CTA - Reinforcement */}
        <SecondaryCTASection weeklyDeal={weeklyDeal} />
      </main>
    </>
  );
}
