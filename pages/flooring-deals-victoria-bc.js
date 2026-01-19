import Head from 'next/head';
import Link from 'next/link';
import { getWeeklyDeal } from '@/lib/products-server';
import { formatCurrency } from '@/lib/utils';
import SeoPageLayout from '@/components/SeoPageLayout';

export default function FlooringDealsVictoriaBC({ weeklyDeal }) {
  return (
    <>
      <Head>
        <title>Flooring Deals Victoria BC | Victoria Flooring Outlet</title>
        <meta
          name="description"
          content="Find the best flooring deals in Victoria, BC. Weekly specials on luxury vinyl plank, laminate, and hardwood flooring. Free shipping on orders over 500 sq ft. Shop now!"
        />
        <link rel="canonical" href="https://victoriaflooringoutlet.ca/flooring-deals-victoria-bc" />
      </Head>

      <SeoPageLayout title="Flooring Deals Victoria BC">
        <p className="text-base md:text-lg text-vfo-bluegrey leading-relaxed mb-6">
          Looking for the best flooring deals in Victoria, BC? You've come to the right place. 
          Victoria Flooring Outlet features exclusive weekly deals on premium flooring products 
          from trusted brands like Harbinger.
        </p>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          This Week's Featured Deal
        </h2>

        {weeklyDeal ? (
          <div className="bg-vfo-accent/10 border border-vfo-accent/20 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-vfo-slate mb-2">
              {weeklyDeal.name}
            </h3>
            <p className="text-base text-vfo-bluegrey mb-4 leading-relaxed">{weeklyDeal.description}</p>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="text-3xl font-bold text-vfo-accent">
                {weeklyDeal.pricePerSqFt
                  ? `${formatCurrency(weeklyDeal.pricePerSqFt * 100)} / sq ft`
                  : formatCurrency(weeklyDeal.price)}
              </span>
              {weeklyDeal.compareAtPricePerSqFt || weeklyDeal.compareAtPrice ? (
                <span className="text-xl text-vfo-muted line-through">
                  {weeklyDeal.compareAtPricePerSqFt
                    ? `${formatCurrency(weeklyDeal.compareAtPricePerSqFt * 100)} / sq ft`
                    : formatCurrency(weeklyDeal.compareAtPrice)}
                </span>
              ) : null}
            </div>
            {weeklyDeal.id ? (
              <Link href={`/products/${weeklyDeal.id}`}>
                <a className="inline-block px-6 py-3 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide">
                  View This Week's Deal →
                </a>
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="text-base text-vfo-bluegrey mb-8">
            Check back soon for our next weekly deal!
          </p>
        )}

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Why Shop Victoria Flooring Outlet?
        </h2>

        <ul className="list-disc list-inside space-y-3 text-base text-vfo-bluegrey mb-8 leading-relaxed pl-4">
          <li>Exclusive weekly deals on premium flooring products</li>
          <li>Direct-to-door delivery across Victoria and nearby areas</li>
          <li>Free shipping on orders over 500 square feet</li>
          <li>Competitive prices on luxury vinyl plank, laminate, and more</li>
          <li>Trusted installers available throughout Victoria and surrounding areas</li>
        </ul>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Types of Flooring We Offer
        </h2>

        <p className="text-base text-vfo-bluegrey mb-4 leading-relaxed">
          Our weekly deals feature a variety of flooring options perfect for Victoria homes:
        </p>

        <ul className="list-disc list-inside space-y-2 text-base text-vfo-bluegrey mb-8 leading-relaxed pl-4">
          <li><strong className="text-vfo-slate">Luxury Vinyl Plank (LVP):</strong> Waterproof, durable, and perfect for high-traffic areas</li>
          <li><strong className="text-vfo-slate">Laminate Flooring:</strong> Affordable and easy to install</li>
          <li><strong className="text-vfo-slate">Hardwood:</strong> Classic beauty and long-lasting quality</li>
          <li><strong className="text-vfo-slate">Accessories:</strong> Glue, underlayment, transition strips, and more</li>
        </ul>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Get Notified of New Deals
        </h2>

        <p className="text-base text-vfo-bluegrey mb-6 leading-relaxed">
          Don't want to miss out on next week's deal? Subscribe to our email list and get 
          notified every Monday when we feature a new flooring product at a special price.
        </p>

        <Link href="/#email-signup">
          <a className="inline-block px-6 py-3 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide mb-8">
            Subscribe to Weekly Deals →
          </a>
        </Link>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Need Installation Help?
        </h2>

        <p className="text-base text-vfo-bluegrey mb-6 leading-relaxed">
          We've partnered with trusted flooring installers throughout Victoria, BC. 
          Whether you need help with a small bathroom or a whole house, we can connect 
          you with experienced professionals.
        </p>

        <Link href="/trusted-installers">
          <a className="inline-block px-6 py-3 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide">
            Find a Trusted Installer →
          </a>
        </Link>
      </SeoPageLayout>
    </>
  );
}

export async function getServerSideProps() {
  const weeklyDeal = await getWeeklyDeal();
  return {
    props: {
      weeklyDeal,
    }
  };
}
