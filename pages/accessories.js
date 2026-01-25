import Head from 'next/head';
import Link from 'next/link';
import { ProductCard } from '@/components/index';
import { getAccessoryProducts } from '@/lib/products';
import AccessoryGuide from '@/components/AccessoryGuide';
import products from '../products';
import { useState } from 'react';

export default function Accessories() {
  const [disabled, setDisabled] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const accessories = getAccessoryProducts();

  // Group accessories by category
  const adhesives = accessories.filter(p => p.subType === 'Adhesive');
  const transitions = accessories.filter(p => p.subType === 'Trim');
  const underlayment = accessories.filter(p => p.subType === 'Underlayment');
  const other = accessories.filter(p => !['Adhesive', 'Trim', 'Underlayment'].includes(p.subType));

  // Badge mapping for accessories
  const getBadge = (product) => {
    if (product.id === 'uzin_ke_2000_s') {
      return { text: 'Most Popular', color: 'bg-vfo-accent/10 text-vfo-accent' };
    }
    if (product.subType === 'Adhesive') {
      return { text: 'For Glue-Down', color: 'bg-blue-50 text-blue-600' };
    }
    if (product.subType === 'Underlayment') {
      return { text: 'Contractor Favourite', color: 'bg-amber-50 text-amber-700' };
    }
    if (product.subType === 'Trim') {
      return { text: 'Colour Matched', color: 'bg-vfo-bluegrey/10 text-vfo-bluegrey' };
    }
    return null;
  };

  const ProductSection = ({ title, description, items }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-12">
        <h2 className="text-xl md:text-2xl font-bold text-vfo-slate mb-2">{title}</h2>
        {description && <p className="text-vfo-bluegrey mb-6">{description}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(product => {
            const badge = getBadge(product);
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
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Flooring Accessories | Victoria Flooring Outlet</title>
        <meta
          name="description"
          content="Shop flooring accessories including glue, underlayment, transition strips, and molding. Essential supplies for your flooring installation project. Serving Victoria and all Vancouver Island."
        />
        <link rel="canonical" href="https://victoriaflooringoutlet.ca/accessories" />
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
                Complete your flooring project with essential accessories. Not sure what you need? 
                Use our guide below to find the right products.
              </p>
            </div>

            {/* Toggle Guide/Products */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowGuide(true)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  showGuide
                    ? 'bg-vfo-accent text-white'
                    : 'bg-vfo-bg text-vfo-bluegrey hover:bg-vfo-muted/20'
                }`}
              >
                Selection Guide
              </button>
              <button
                onClick={() => setShowGuide(false)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  !showGuide
                    ? 'bg-vfo-accent text-white'
                    : 'bg-vfo-bg text-vfo-bluegrey hover:bg-vfo-muted/20'
                }`}
              >
                All Products
              </button>
            </div>
          </div>
        </section>

        {/* Guide Section */}
        {showGuide && (
          <section className="py-12 md:py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
              <AccessoryGuide products={products} />
            </div>
          </section>
        )}

        {/* Products Grid - Grouped by Category */}
        {!showGuide && (
          <section className="py-12 md:py-16">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
              {accessories.length > 0 ? (
                <>
                  <ProductSection
                    title="Adhesives"
                    description="Professional-grade adhesives for glue-down flooring installations. Choose based on your subfloor type and traffic level."
                    items={adhesives}
                  />
                  <ProductSection
                    title="Transitions & Nosings"
                    description="Colour-matched trims for doorways, stairs, and where your flooring meets other surfaces. Only available with Harbinger flooring."
                    items={transitions}
                  />
                  <ProductSection
                    title="Underlayment"
                    description="Sound-dampening and moisture-protecting underlayment for your flooring installation."
                    items={underlayment}
                  />
                  {other.length > 0 && (
                    <ProductSection
                      title="Other Accessories"
                      description="Additional accessories for your flooring project."
                      items={other}
                    />
                  )}
                </>
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
        )}

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

