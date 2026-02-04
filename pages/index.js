import Head from 'next/head';
import {
  DealOfTheWeekHero,
  NextWeekPreviewSection,
  WhyChooseSection
} from '@/components/index';

export default function Home({ weeklyDeal }) {
  return (
    <>
      <Head>
        <title>Victoria Flooring Outlet - Deal of the Week | Premium Flooring Deals in Victoria, BC</title>
        <meta name="description" content="Get this week's exclusive flooring deal from Victoria Flooring Outlet. Premium Harbinger luxury vinyl flooring at outlet pricing. Free shipping on orders over 500 sq ft. Serving Victoria and all Vancouver Island including Nanaimo, Comox Valley, and Cowichan Valley." />
        <link rel="canonical" href="https://victoriaflooringoutlet.ca/" />

        {/* LocalBusiness Schema.org markup for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': 'https://victoriaflooringoutlet.ca',
              name: 'Victoria Flooring Outlet',
              description: 'Premium flooring deals across Vancouver Island. Weekly deals on luxury vinyl plank, laminate, and hardwood flooring at outlet pricing. Serving Victoria, Nanaimo, Comox Valley, Cowichan Valley, and all Vancouver Island communities.',
              url: 'https://victoriaflooringoutlet.ca',
              telephone: '+1-778-871-7681',
              email: 'hello@victoriaflooringoutlet.ca',
              priceRange: '$-$$',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Victoria',
                addressRegion: 'BC',
                addressCountry: 'CA',
              },
              areaServed: [
                {
                  '@type': 'City',
                  name: 'Victoria',
                  containedIn: { '@type': 'AdministrativeArea', name: 'British Columbia' }
                },
                {
                  '@type': 'City',
                  name: 'Nanaimo',
                  containedIn: { '@type': 'AdministrativeArea', name: 'British Columbia' }
                },
                {
                  '@type': 'City',
                  name: 'Courtenay',
                  containedIn: { '@type': 'AdministrativeArea', name: 'British Columbia' }
                },
                {
                  '@type': 'City',
                  name: 'Duncan',
                  containedIn: { '@type': 'AdministrativeArea', name: 'British Columbia' }
                },
                {
                  '@type': 'City',
                  name: 'Campbell River',
                  containedIn: { '@type': 'AdministrativeArea', name: 'British Columbia' }
                },
                {
                  '@type': 'City',
                  name: 'Parksville',
                  containedIn: { '@type': 'AdministrativeArea', name: 'British Columbia' }
                },
                {
                  '@type': 'City',
                  name: 'Port Alberni',
                  containedIn: { '@type': 'AdministrativeArea', name: 'British Columbia' }
                }
              ],
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 48.4284,
                longitude: -123.3656
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '09:00',
                closes: '17:00',
              },
              sameAs: [],
            }),
          }}
        />

        {/* Organization Schema.org markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://victoriaflooringoutlet.ca/#organization',
              name: 'Victoria Flooring Outlet',
              url: 'https://victoriaflooringoutlet.ca',
              telephone: '+1-778-871-7681',
              email: 'hello@victoriaflooringoutlet.ca',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Victoria',
                addressRegion: 'BC',
                addressCountry: 'CA'
              },
              sameAs: [],
            }),
          }}
        />

        {/* FAQ Schema for geographic/shipping questions */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Do you ship to Nanaimo and Central Vancouver Island?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, we ship to Nanaimo, Parksville, Qualicum Beach, and all Central Vancouver Island communities with zone-based pricing. Shipping to Nanaimo is just $5 per box.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Do you deliver to Comox Valley and North Island?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, we deliver to Courtenay, Comox, Campbell River, and all North Island areas. Shipping rates are calculated based on your postal code zone.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'What areas of Vancouver Island do you serve?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We serve all of Vancouver Island including Victoria, Nanaimo, Comox Valley, Cowichan Valley, Duncan, Parksville, Courtenay, Campbell River, Port Alberni, Sooke, and West Coast communities. Shipping rates vary by zone - Greater Victoria starts at $3 per box.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Is there free shipping on Vancouver Island?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, we offer free shipping on orders over 500 sq ft to all Vancouver Island addresses including Victoria, Nanaimo, Comox Valley, and Cowichan Valley.'
                  }
                }
              ]
            })
          }}
        />
      </Head>

      <main className="min-h-screen bg-vfo-sand">
        {/* 1. Hero - Full-width lifestyle with single strong CTA */}
        <DealOfTheWeekHero weeklyDeal={weeklyDeal} />

        {/* 2. Why Choose Section - Value props */}
        <WhyChooseSection />

        {/* 3. Next Week Preview - Blurred teaser with newsletter signup */}
        <NextWeekPreviewSection />
      </main>
    </>
  );
}

export async function getServerSideProps() {
  const { getWeeklyDeal } = await import('@/lib/products-server');
  const weeklyDeal = await getWeeklyDeal();
  return {
    props: {
      weeklyDeal,
    }
  };
}
