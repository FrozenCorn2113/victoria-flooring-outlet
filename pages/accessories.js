import Head from 'next/head';
import Link from 'next/link';
import { ProductCard } from '@/components/index';
import { getAccessoryProducts } from '@/lib/products';
import { useState } from 'react';

export default function Accessories() {
  const [disabled, setDisabled] = useState(false);
  const accessories = getAccessoryProducts();

  // Badge mapping for accessories
  const getBadge = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('glue') || lowerName.includes('adhesive')) {
      return { text: 'Best for LVP', color: 'bg-vfo-accent/10 text-vfo-accent' };
    }
    if (lowerName.includes('underlay')) {
      return { text: 'Contractor favourite', color: 'bg-blue-50 text-blue-600' };
    }
    if (lowerName.includes('transition') || lowerName.includes('molding')) {
      return { text: 'Essential', color: 'bg-vfo-bluegrey/10 text-vfo-bluegrey' };
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>Flooring Accessories | Victoria Flooring Outlet</title>
        <meta 
          name="description" 
          content="Shop flooring accessories including glue, underlayment, transition strips, and molding. Essential supplies for your flooring installation project in Victoria, BC." 
        />
      </Head>

      <div className="min-h-screen bg-vfo-bg">
        {/* Hero Section */}
        <section className="bg-white py-12 md:py-16 border-b border-vfo-muted/20">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
                Flooring Accessories
              </h1>
              <p className="text-base md:text-lg text-vfo-bluegrey leading-relaxed max-w-2xl mx-auto">
                Complete your flooring project with essential accessories. Glue, underlayment, 
                transition strips, and more from trusted brands.
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            {accessories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {accessories.map(product => {
                  const badge = getBadge(product.name);
                  return (
                    <div key={product.id} className="relative">
                      {badge && (
                        <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                          {badge.text}
                        </div>
                      )}
                      <ProductCard
                        disabled={disabled}
                        onClickAdd={() => setDisabled(true)}
                        onAddEnded={() => setDisabled(false)}
                        {...product}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-vfo-bluegrey text-lg mb-4">No accessories available at this time.</p>
                <Link href="/" className="inline-block px-6 py-3 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide">
                  View Weekly Deal →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-vfo-slate mb-4 uppercase tracking-heading">
              Need Installation Help?
            </h2>
            <p className="text-base text-vfo-bluegrey mb-6 leading-relaxed">
              Connect with one of our trusted installers in Victoria, BC for professional installation services.
            </p>
            <Link href="/trusted-installers" className="inline-block px-8 py-4 bg-vfo-accent hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors uppercase tracking-wide">
              Find a Trusted Installer →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

