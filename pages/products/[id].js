import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import { getUpsellProducts } from '@/lib/products';
import { calculateShipping, formatCanadianPostalCode, validateCanadianPostalCode } from '@/lib/shipping';
import SquareFootageCalculator from '@/components/SquareFootageCalculator';

import products from '../../products';

const Product = props => {
  const router = useRouter();
  const { cartCount, addItem } = useShoppingCart();
  const [sqFt, setSqFt] = useState(0);
  const [postalCode, setPostalCode] = useState('');
  const [shippingResult, setShippingResult] = useState(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showGoToCart, setShowGoToCart] = useState(false);
  const upsellProducts = getUpsellProducts(props.id);

  const toastId = useRef();
  const firstRun = useRef(true);

  // Calculate boxes needed for internal calculations (if needed)
  const boxesNeeded = props.coverageSqFtPerBox && sqFt > 0
    ? Math.ceil(sqFt / props.coverageSqFtPerBox)
    : 1;

  // Calculate price per sq ft - use pricePerSqFt if available, otherwise calculate from price and coverage
  const pricePerSqFt = props.pricePerSqFt 
    ? props.pricePerSqFt 
    : props.coverageSqFtPerBox
    ? (props.price / 100) / props.coverageSqFtPerBox
    : 0;

  // Calculate total price based on square footage
  const totalPrice = pricePerSqFt * sqFt;

  // Calculate compare at price per sq ft
  const compareAtPricePerSqFt = props.compareAtPricePerSqFt
    ? props.compareAtPricePerSqFt
    : props.compareAtPrice && props.coverageSqFtPerBox
    ? (props.compareAtPrice / 100) / props.coverageSqFtPerBox
    : 0;

  const savingsPercent = compareAtPricePerSqFt > 0 && pricePerSqFt > 0
    ? Math.round(((compareAtPricePerSqFt - pricePerSqFt) / compareAtPricePerSqFt) * 100)
    : 0;

  const handleCalculateShipping = () => {
    if (!sqFt || sqFt <= 0) {
      toast.error('Please enter a square footage amount');
      return;
    }

    if (!validateCanadianPostalCode(postalCode)) {
      toast.error('Please enter a valid Canadian postal code (e.g., V8V 1A1)');
      return;
    }

    setCalculatingShipping(true);
    const result = calculateShipping({ postalCode, totalSqFt: sqFt });
    setShippingResult(result);
    setCalculatingShipping(false);
  };

  const handleOnAddToCart = () => {
    setAdding(true);
    toastId.current = toast.loading(
      `Adding ${sqFt} sq ft...`
    );
    addItem(props, sqFt);
  };

  const handleAddUpsell = (upsellProduct) => {
    addItem(upsellProduct, 1);
    setShowGoToCart(true);
    toast.success(`${upsellProduct.name} added to cart`);
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setAdding(false);
    setShowGoToCart(true);
    toast.success(`${sqFt} sq ft of ${props.name} added`, {
      id: toastId.current,
    });
  }, [cartCount]);

  return router.isFallback ? (
    <>
      <Head>
        <title>Loading...</title>
      </Head>
      <div className="min-h-screen bg-vfo-sand flex items-center justify-center">
        <p className="text-center text-lg text-vfo-grey">Loading...</p>
      </div>
    </>
  ) : (
    <>
      <Head>
        <title>{props.name} | Victoria Flooring Outlet</title>
        {props.description && (
          <meta name="description" content={props.description} />
        )}

        {/* Product Schema.org markup for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Product',
              name: props.name,
              image: `https://victoriaflooringoutlet.ca${props.image}`,
              description: props.description,
              brand: {
                '@type': 'Brand',
                name: props.brand || 'Victoria Flooring Outlet',
              },
              offers: {
                '@type': 'Offer',
                url: `https://victoriaflooringoutlet.ca/products/${props.id}`,
                priceCurrency: 'CAD',
                price: pricePerSqFt.toFixed(2),
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: pricePerSqFt.toFixed(2),
                  priceCurrency: 'CAD',
                  unitText: 'square foot',
                },
                availability: 'https://schema.org/InStock',
                seller: {
                  '@type': 'Organization',
                  name: 'Victoria Flooring Outlet',
                },
              },
              ...(props.rating && {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: props.rating.rate,
                  reviewCount: props.rating.count,
                },
              }),
            }),
          }}
        />
      </Head>
      
      <div className="min-h-screen bg-vfo-sand">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          {/* Breadcrumb */}
          <Link href="/" className="text-sm text-vfo-grey hover:text-vfo-charcoal mb-6 inline-block">
            ← Back
          </Link>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-xl bg-white">
                <Image
                  src={props.image || '/flooring/placeholder.jpg'}
                  alt={props.name}
                  fill
                  className="object-cover"
                />
                {props.isWeeklyDeal && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 rounded-full">
                    <span className="text-xs font-medium uppercase tracking-[0.25em] text-vfo-grey">This Week's Deal</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-5">
              <div>
                <h1 className="text-3xl md:text-4xl font-heading tracking-wide text-vfo-charcoal mb-2 leading-tight">
                  {props.name}
                </h1>
                {props.brand && (
                  <p className="text-[15px] font-light text-vfo-grey mb-2">Brand: {props.brand}</p>
                )}
                {props.description && (
                  <p className="text-[15px] font-light text-vfo-grey leading-relaxed">
                    {props.description}
                  </p>
                )}
              </div>

              {/* Square Footage Calculator */}
              <SquareFootageCalculator
                coverageSqFtPerBox={props.coverageSqFtPerBox}
                pricePerSqFt={pricePerSqFt}
                compareAtPricePerSqFt={compareAtPricePerSqFt}
                sqFt={sqFt}
                onSqFtChange={(value) => setSqFt(parseInt(value) || 0)}
                currency="CAD"
              />

              {/* Add to Cart Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOnAddToCart}
                  disabled={adding || !sqFt || sqFt <= 0}
                  className="w-full px-8 py-3.5 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium text-base rounded-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adding...' : `Add ${sqFt > 0 ? `${sqFt} sq ft` : 'to Cart'}`}
                </button>

                <Link
                  href="/cart"
                  className={`block w-full px-8 py-3.5 bg-vfo-accent hover:bg-vfo-accent/90 text-white font-medium text-base rounded-sm shadow-sm transition-all text-center ${
                    showGoToCart ? 'opacity-100 animate-pulse' : 'opacity-0 pointer-events-none'
                  }`}
                  tabIndex={showGoToCart ? 0 : -1}
                  aria-hidden={!showGoToCart}
                >
                  Go to Cart →
                </Link>
              </div>

              {/* Shipping Calculator */}
              <div className="p-5 bg-white rounded-lg border border-vfo-border space-y-4">
                <div>
                  <label htmlFor="postalcode" className="block text-sm font-medium text-vfo-charcoal mb-2">
                    Calculate Shipping (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="postalcode"
                      value={postalCode}
                      onChange={(e) => {
                        const formatted = formatCanadianPostalCode(e.target.value);
                        setPostalCode(formatted);
                      }}
                      placeholder="V8V 1A1"
                      maxLength="7"
                      className="flex-1 px-4 py-2.5 border border-vfo-border rounded-sm focus:ring-1 focus:ring-vfo-charcoal focus:border-vfo-charcoal text-base text-vfo-charcoal uppercase"
                    />
                    <button
                      onClick={handleCalculateShipping}
                      disabled={calculatingShipping || !sqFt || !postalCode}
                      className="px-5 py-2.5 bg-vfo-charcoal hover:bg-vfo-slate text-white text-sm font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {calculatingShipping ? 'Calculating...' : 'Calculate'}
                    </button>
                  </div>
                  {shippingResult && shippingResult.valid && (
                    <div className="mt-3 p-3 bg-vfo-sand rounded-sm">
                      <p className="text-sm font-light text-vfo-grey">
                        Shipping to {shippingResult.formattedPostalCode}:{' '}
                        <span className="font-medium text-vfo-charcoal">
                          {formatCurrency(shippingResult.shipping)}
                        </span>
                      </p>
                      {shippingResult.isRemote && (
                        <p className="text-xs font-light text-vfo-lightgrey mt-1">Remote area surcharge applied</p>
                      )}
                    </div>
                  )}
                  {shippingResult && !shippingResult.valid && (
                    <p className="mt-2 text-sm text-red-600">{shippingResult.error}</p>
                  )}
                </div>
              </div>

              {/* Specs - Collapsed/Compact */}
              {(props.dimensionsIn || props.thicknessMm || props.wearLayerMm || props.wearLayerMil || props.edge || props.construction || props.installation || props.coverageSqFtPerBox || props.waterproof !== undefined || props.radiantHeatCompatible !== undefined || props.texture || props.warrantyResidential || props.warrantyCommercial) && (
                <div className="p-5 bg-white rounded-lg border border-vfo-border">
                  <h3 className="text-base font-heading tracking-wide text-vfo-charcoal mb-3">Key Specifications</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                    {props.dimensionsIn && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-vfo-grey">Dimensions:</span>
                        <span className="ml-2 font-light text-vfo-charcoal">
                          {props.dimensionsIn.width}" × {props.dimensionsIn.length}"
                        </span>
                      </div>
                    )}
                    {props.thicknessMm && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-vfo-grey">Thickness:</span>
                        <span className="ml-2 font-light text-vfo-charcoal">{props.thicknessMm} mm</span>
                      </div>
                    )}
                    {(props.wearLayerMm || props.wearLayerMil) && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-vfo-grey">Wear Layer:</span>
                        <span className="ml-2 font-light text-vfo-charcoal">
                          {props.wearLayerMil ? `${props.wearLayerMil} mil` : `${props.wearLayerMm} mm`}
                        </span>
                      </div>
                    )}
                    {props.installation && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-vfo-grey">Install:</span>
                        <span className="ml-2 font-light text-vfo-charcoal">{props.installation}</span>
                      </div>
                    )}
                    {props.coverageSqFtPerBox && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-vfo-grey">Coverage:</span>
                        <span className="ml-2 font-light text-vfo-charcoal">{props.coverageSqFtPerBox} sq ft/box</span>
                      </div>
                    )}
                    {props.waterproof !== undefined && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-vfo-grey">Waterproof:</span>
                        <span className="ml-2 font-light text-vfo-charcoal">{props.waterproof ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                    {(props.warrantyResidential || props.warrantyCommercial) && (
                      <div className="col-span-2">
                        <span className="text-vfo-grey">Warranty:</span>
                        <span className="ml-2 font-light text-vfo-charcoal">
                          {props.warrantyResidential && props.warrantyCommercial
                            ? `${props.warrantyResidential} / ${props.warrantyCommercial}`
                            : props.warrantyResidential || props.warrantyCommercial}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Need Help? Phone Contact */}
              <div className="pt-4 border-t border-vfo-border/50">
                <p className="text-xs font-medium uppercase tracking-widest text-vfo-grey mb-3 text-center">
                  Need Help?
                </p>
                <a
                  href="tel:+1-778-871-7681"
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-vfo-accent text-vfo-accent hover:bg-vfo-accent hover:text-white font-medium text-sm rounded-sm transition-all"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>Call us at (778) 871-7681</span>
                </a>
                <p className="text-xs font-light text-vfo-grey text-center mt-2">
                  Questions about measurements, installation, or shipping?
                </p>
              </div>
            </div>
          </div>

          {/* Marketing Copy Sections */}
          {props.collection === 'Contract Series' && (
            <>
              {/* About Harbinger Contract Series */}
              <section className="mb-8 p-6 bg-white rounded-lg border border-vfo-border">
                <h2 className="text-xl font-heading tracking-wide text-vfo-charcoal mb-4">
                  About Harbinger Contract Series
                </h2>
                <p className="text-[15px] font-light text-vfo-grey leading-relaxed">
                  Harbinger's Contract Series is a durable, stylish and low-maintenance glue-down vinyl plank built for heavy use at contractor pricing. With a 2.0 mm core, 12 mil wear layer and Harbinger's 4S coating, it delivers excellent resistance to scratches, stains and scuffs while staying soft and warm underfoot.
                </p>
              </section>

              {/* Why we chose Coastal Oak as this week's deal */}
              {props.isWeeklyDeal && props.colourName === 'Coastal Oak' && (
                <section className="mb-8 p-6 bg-white rounded-lg border border-vfo-border">
                  <h2 className="text-xl font-heading tracking-wide text-vfo-charcoal mb-4">
                    Why we chose Coastal Oak as this week's deal
                  </h2>
                  <p className="text-[15px] font-light text-vfo-grey leading-relaxed">
                    Coastal Oak combines a clean, modern grain with a soft oak tone that works in rentals, renos and new builds. It's an easy-to-install glue-down plank that performs in kitchens, basements and light commercial spaces, with 100% waterproof construction and a lifetime residential warranty.
                  </p>
                </section>
              )}
            </>
          )}

          {/* Why This Week's Deal Section */}
          {props.isWeeklyDeal && (
            <section className="mb-12 p-6 bg-vfo-sand rounded-lg border border-vfo-border">
              <h2 className="text-xl font-heading tracking-wide text-vfo-charcoal mb-3">
                Why This Week's Deal is Special
              </h2>
              <p className="text-[15px] font-light text-vfo-grey leading-relaxed mb-3">
                This week only, we're offering {props.name} at a special discounted price. This premium Harbinger flooring 
                features commercial-grade quality and is perfect for high-traffic areas. Limited stock available this week.
              </p>
              <ul className="space-y-2 text-[15px] font-light text-vfo-grey">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-vfo-grey flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Direct shipping from Harbinger warehouse to Victoria</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-vfo-grey flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free shipping on orders over 500 sq ft</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-vfo-grey flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Commercial-grade durability and style</span>
                </li>
              </ul>
            </section>
          )}

          {/* Upsell Products Section */}
          {upsellProducts.length > 0 && (
            <section className="mt-12 pt-12 border-t border-vfo-border">
              <h2 className="text-2xl md:text-3xl font-heading tracking-wide text-vfo-charcoal mb-6">
                You'll Also Need
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upsellProducts.map((upsell) => (
                  <div
                    key={upsell.id}
                    className="bg-white border border-vfo-border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <Link href={`/products/${upsell.id}`}>
                      <div className="relative w-full h-48 mb-4 bg-vfo-sand rounded-sm overflow-hidden">
                        <Image
                          src={upsell.image || '/accessories/placeholder.jpg'}
                          alt={upsell.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="font-heading text-lg text-vfo-charcoal mb-2">{upsell.name}</h3>
                      {upsell.description && (
                        <p className="text-sm font-light text-vfo-grey mb-3 line-clamp-2 leading-relaxed">
                          {upsell.description}
                        </p>
                      )}
                      <p className="text-lg font-medium text-vfo-charcoal mb-4">
                        {formatCurrency(upsell.price)}
                      </p>
                    </Link>
                    <button
                      onClick={() => handleAddUpsell(upsell)}
                      className="w-full px-4 py-2 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-sm transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export async function getStaticPaths() {
  return {
    paths: products?.map(product => ({
      params: { id: product.id },
    })) || [],
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  try {
    const props = products?.find(product => product.id === params.id) ?? {};

    return {
      props,
      revalidate: 1,
    };
  } catch (error) {
    return { notFound: true };
  }
}

export default Product;
