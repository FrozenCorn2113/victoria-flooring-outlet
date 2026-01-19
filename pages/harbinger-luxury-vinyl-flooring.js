import Head from 'next/head';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import SeoPageLayout from '@/components/SeoPageLayout';

export default function HarbingerLuxuryVinylFlooring({ weeklyDeal }) {
  const isHarbinger = weeklyDeal && weeklyDeal.brand === 'Harbinger';

  return (
    <>
      <Head>
        <title>Harbinger Luxury Vinyl Flooring | Victoria Flooring Outlet</title>
        <meta 
          name="description" 
          content="Shop Harbinger luxury vinyl plank flooring in Victoria, BC. Premium waterproof LVP with easy click-lock installation. Weekly deals available. Free shipping on orders over 500 sq ft." 
        />
      </Head>

      <SeoPageLayout title="Harbinger Luxury Vinyl Flooring">
        <p className="text-base md:text-lg text-vfo-bluegrey leading-relaxed mb-6">
          Harbinger luxury vinyl plank (LVP) flooring is one of the most popular choices 
          for Victoria homeowners looking for durable, waterproof, and beautiful flooring. 
          At Victoria Flooring Outlet, we feature exclusive weekly deals on Harbinger products.
        </p>

        {isHarbinger && weeklyDeal ? (
          <div className="bg-vfo-accent/10 border border-vfo-accent/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-vfo-slate mb-4 uppercase tracking-heading">
              This Week's Harbinger Deal
            </h2>
            <h3 className="text-lg font-semibold text-vfo-slate mb-2">
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
                  Shop This Deal →
                </a>
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="text-base text-vfo-bluegrey mb-8">
            Check our homepage for current Harbinger deals!
          </p>
        )}

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Why Choose Harbinger Luxury Vinyl Plank?
        </h2>

        <ul className="list-disc list-inside space-y-3 text-base text-vfo-bluegrey mb-8 leading-relaxed pl-4">
          <li><strong className="text-vfo-slate">100% Waterproof:</strong> Perfect for bathrooms, kitchens, and basements</li>
          <li><strong className="text-vfo-slate">Durable Wear Layer:</strong> Resistant to scratches, dents, and stains</li>
          <li><strong className="text-vfo-slate">Easy Installation:</strong> Click-lock system makes DIY installation possible</li>
          <li><strong className="text-vfo-slate">Realistic Appearance:</strong> Beautiful wood and stone looks without the maintenance</li>
          <li><strong className="text-vfo-slate">Comfortable Underfoot:</strong> Softer than tile, warmer than hardwood</li>
          <li><strong className="text-vfo-slate">Low Maintenance:</strong> Easy to clean with regular sweeping and mopping</li>
        </ul>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Harbinger LVP Specifications
        </h2>

        <p className="text-base text-vfo-bluegrey mb-4 leading-relaxed">
          Harbinger luxury vinyl plank flooring typically features:
        </p>

        <ul className="list-disc list-inside space-y-2 text-base text-vfo-bluegrey mb-8 leading-relaxed pl-4">
          <li>Thickness: 5mm to 7mm for stability and durability</li>
          <li>Wear Layer: 12-20 mil for residential use</li>
          <li>Coverage: Approximately 20-25 square feet per box</li>
          <li>Installation: Floating floor with click-lock system</li>
          <li>Underlayment: Optional foam underlayment recommended for sound reduction</li>
        </ul>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Perfect for Victoria Homes
        </h2>

        <p className="text-base text-vfo-bluegrey mb-4 leading-relaxed">
          Harbinger LVP is an excellent choice for Victoria, BC homes because:
        </p>

        <ul className="list-disc list-inside space-y-2 text-base text-vfo-bluegrey mb-8 leading-relaxed pl-4">
          <li>Handles Victoria's humid climate with its waterproof construction</li>
          <li>Resistant to moisture from ground floors and basements</li>
          <li>Easy to maintain in high-traffic areas</li>
          <li>Works well with radiant floor heating systems</li>
          <li>Available in styles that complement West Coast design aesthetics</li>
        </ul>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Installation Tips
        </h2>

        <p className="text-base text-vfo-bluegrey mb-4 leading-relaxed">
          While Harbinger LVP is designed for easy installation, here are some tips:
        </p>

        <ul className="list-disc list-inside space-y-2 text-base text-vfo-bluegrey mb-8 leading-relaxed pl-4">
          <li>Ensure subfloor is clean, dry, and level</li>
          <li>Allow flooring to acclimate to room temperature for 48 hours</li>
          <li>Use proper underlayment for sound reduction and moisture protection</li>
          <li>Leave expansion gaps around perimeter (1/4 inch recommended)</li>
          <li>Stagger planks for a natural appearance</li>
        </ul>

        <p className="text-base text-vfo-bluegrey mb-6 leading-relaxed">
          For professional installation, check out our{' '}
          <Link href="/trusted-installers" className="text-vfo-accent hover:text-teal-600 underline">
            trusted installers in Victoria
          </Link>.
        </p>

        <h2 className="text-2xl font-bold text-vfo-slate mt-8 mb-4 uppercase tracking-heading">
          Shop Harbinger Flooring Today
        </h2>

        <p className="text-base text-vfo-bluegrey mb-6 leading-relaxed">
          Ready to transform your Victoria home with Harbinger luxury vinyl flooring? 
          Check out our current deals and get free shipping on orders over 500 square feet.
        </p>

        <Link href="/" className="inline-block px-6 py-3 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide">
          View Current Deals →
        </Link>
      </SeoPageLayout>
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
