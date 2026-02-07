import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';
import getStripe from '@/lib/get-stripe';
import { calculateShipping } from '@/lib/shipping';
import { trackEcommerce } from '@/lib/analytics';
import ProjectAccessoriesCalculator from '@/components/ProjectAccessoriesCalculator';
import CheckoutEmailCapture from '@/components/CheckoutEmailCapture';
import {
  XCircleIcon,
  XMarkIcon as XIcon,
  MinusSmallIcon as MinusSmIcon,
  PlusSmallIcon as PlusSmIcon,
} from '@heroicons/react/24/outline';

const Cart = () => {
  const { cartDetails, totalPrice, cartCount, addItem, removeItem, clearCart, expiredItems, clearExpiredNotification } =
    useShoppingCart();
  const [redirecting, setRedirecting] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [shippingResult, setShippingResult] = useState(null);
  const [shippingNotice, setShippingNotice] = useState(false);
  const [email, setEmail] = useState('');
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const viewCartTrackedRef = useRef(false);
  const shippingInfoTrackedRef = useRef('');

  const adhesiveIds = [
    'uzin_ke_2000_s',
    'uzin_ke_66',
    'uzin_kr_430',
  ];
  const transitionIds = [
    'harbinger-t-moulding',
    'harbinger-reducer',
    'harbinger-flush-overlap-nosing',
    'harbinger-sac-square-nosing',
  ];

  const totalFlooringSqFt = Object.values(cartDetails || {})
    .filter(item => item.pricePerSqFt)
    .reduce((sum, item) => sum + item.quantity, 0);

  const cartItemsForTracking = useMemo(() => {
    return Object.values(cartDetails || {}).map((item) => {
      const itemPrice = item.pricePerSqFt ? item.pricePerSqFt : (item.price || 0) / 100;
      return {
        item_id: item.id,
        item_name: item.name,
        item_brand: item.brand || 'Victoria Flooring Outlet',
        item_category: item.type || item.collection || 'Flooring',
        item_variant: item.collection || item.series || undefined,
        price: Number(itemPrice.toFixed(2)),
        quantity: item.quantity || 1,
      };
    });
  }, [cartDetails]);

  // Calculate actual item count (boxes for flooring, units for accessories)
  const cartItemCount = Object.values(cartDetails || {}).reduce((count, item) => {
    if (item.pricePerSqFt && item.coverageSqFtPerBox) {
      // Flooring: count boxes
      return count + Math.ceil(item.quantity / item.coverageSqFtPerBox);
    }
    // Accessories: count units
    return count + item.quantity;
  }, 0);

  const hasAdhesiveInCart = Object.values(cartDetails || {})
    .some(item => adhesiveIds.includes(item.id));
  const hasTransitionInCart = Object.values(cartDetails || {})
    .some(item => transitionIds.includes(item.id));

  const shouldShowAccessoriesCalculator = totalFlooringSqFt > 0;

  // Calculate shipping when postal code or cart changes
  useEffect(() => {
    if (postalCode && cartCount > 0) {
      const result = calculateShipping({ postalCode, cartDetails });
      setShippingResult(result);
    } else {
      setShippingResult(null);
    }
  }, [postalCode, cartDetails, cartCount]);

  useEffect(() => {
    if (cartCount > 0 && !viewCartTrackedRef.current) {
      trackEcommerce('view_cart', {
        currency: 'CAD',
        value: Number((totalPrice / 100).toFixed(2)),
        items: cartItemsForTracking,
      });
      viewCartTrackedRef.current = true;
    }
  }, [cartCount, totalPrice, cartItemsForTracking]);

  useEffect(() => {
    if (!shippingResult?.valid || cartCount === 0) return;
    const shippingKey = `${postalCode}-${shippingResult.shipping}-${cartCount}`;
    if (shippingInfoTrackedRef.current === shippingKey) return;

    trackEcommerce('add_shipping_info', {
      currency: 'CAD',
      value: Number(((totalPrice + shippingResult.shipping) / 100).toFixed(2)),
      shipping: Number((shippingResult.shipping / 100).toFixed(2)),
      shipping_tier: shippingResult.zone || undefined,
      items: cartItemsForTracking,
    });
    shippingInfoTrackedRef.current = shippingKey;
  }, [shippingResult, postalCode, cartCount, totalPrice, cartItemsForTracking]);

  const handlePostalCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Auto-format as user types (A1A1A1 -> A1A 1A1)
    if (value.length <= 6) {
      let formatted = value;
      if (value.length > 3) {
        formatted = `${value.slice(0, 3)} ${value.slice(3)}`;
      }
      setPostalCode(formatted.trim());
      setShippingNotice(false);
    }
  };

  const handleEmailCaptured = (capturedEmail, token) => {
    setEmail(capturedEmail);
    setSessionToken(token);
    setEmailCaptured(true);
  };

  const redirectToCheckout = async () => {
    if (!shippingResult?.valid) {
      setShippingNotice(true);
      return;
    }
    if (!emailCaptured) {
      setShippingNotice(true);
      return;
    }
    setRedirecting(true);
    try {
      trackEcommerce('begin_checkout', {
        currency: 'CAD',
        value: Number((grandTotal / 100).toFixed(2)),
        items: cartItemsForTracking,
      });
      // Create Stripe checkout
      const {
        data: { id },
      } = await axios.post('/api/checkout_sessions', {
        items: Object.entries(cartDetails).map(([_, product]) => {
          // If product has pricePerSqFt, use price_data instead of price ID
          if (product.pricePerSqFt) {
            return {
              price_data: {
                currency: 'cad',
                product_data: {
                  name: product.name,
                },
                unit_amount: Math.round(product.pricePerSqFt * 100), // Convert to cents per sq ft
              },
              quantity: product.quantity, // quantity is square footage
            };
          }
          // For accessories and other products without pricePerSqFt, use price_data
          return {
            price_data: {
              currency: 'cad',
              product_data: {
                name: product.name,
              },
              unit_amount: product.price, // price is already in cents
            },
            quantity: product.quantity,
          };
        }),
        shipping: shippingResult?.shipping || 0,
        postalCode: postalCode || '',
        shippingZone: shippingResult?.zone || '',
        sessionToken: sessionToken, // Include session token for abandoned cart tracking
      });

      // Redirect to checkout
      const stripe = await getStripe();
      await stripe.redirectToCheckout({ sessionId: id });
    } catch (error) {
      console.error('Checkout error:', error);
      setRedirecting(false);
    }
  };

  const grandTotal = totalPrice + (shippingResult?.shipping || 0);

  return (
    <>
      <Head>
        <title>Shopping Cart | Victoria Flooring Outlet</title>
      </Head>
      <div className="container xl:max-w-screen-xl mx-auto py-12 px-6">
        {/* Expired items notification */}
        {expiredItems && expiredItems.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-amber-800">Some items were removed from your cart</h3>
                <p className="text-sm text-amber-700 mt-1">
                  The following weekly deals have expired and were removed:
                </p>
                <ul className="mt-2 text-sm text-amber-700">
                  {expiredItems.map((item) => (
                    <li key={item.id}>• {item.name}</li>
                  ))}
                </ul>
                <p className="text-sm text-amber-700 mt-2">
                  Check out our <a href="/" className="underline font-medium">current weekly deal</a>!
                </p>
              </div>
              <button
                onClick={clearExpiredNotification}
                className="text-amber-600 hover:text-amber-800"
                aria-label="Dismiss notification"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {cartCount > 0 ? (
          <>
            <h2 className="text-4xl font-heading tracking-wide">Your shopping cart</h2>
            <p className="mt-1 text-xl font-light">
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}{' '}
              <button
                onClick={clearCart}
                className="opacity-50 hover:opacity-100 text-base capitalize"
              >
                (Clear all)
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-heading tracking-wide">
              Your shopping cart is empty.
            </h2>
            <p className="mt-1 text-xl font-light">
              Check out this week's flooring deal{' '}
              <Link href="/" className="text-emerald-600 hover:text-emerald-700 underline">
                here!
              </Link>
            </p>
          </>
        )}

        {cartCount > 0 ? (
          <div className="mt-12">
            {Object.entries(cartDetails).map(([key, product]) => (
              <div
                key={key}
                className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:space-x-4 hover:shadow-lg hover:border-opacity-50 border border-opacity-0 rounded-md p-4"
              >
                {/* Image + Name */}
                <Link
                  href={`/products/${product.id}`}
                  className="flex items-center gap-4 group min-w-0"
                >
                  <div className="relative w-20 h-20 group-hover:scale-110 transition-transform">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="font-heading text-base sm:text-xl group-hover:underline break-words">
                    {product.name}
                  </p>
                </Link>

                {/* Price + Actions */}
                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[8rem_1fr_auto] sm:items-center sm:gap-6 sm:w-[22rem] sm:justify-end">
                  {/* Quantity */}
                  <div className="grid grid-cols-[2.5rem_3rem_2.5rem] items-center text-center justify-self-start">
                    {(() => {
                      // For flooring products, calculate boxes
                      const isFlooring = product.pricePerSqFt && product.coverageSqFtPerBox;
                      const boxSize = product.coverageSqFtPerBox || 1;
                      const boxes = isFlooring ? Math.ceil(product.quantity / boxSize) : product.quantity;
                      const minBoxes = 1;

                      return (
                        <>
                          <button
                            onClick={() => {
                              if (isFlooring) {
                                // Remove one box worth of sq ft
                                removeItem(product, boxSize);
                              } else {
                                removeItem(product, 1);
                              }
                            }}
                            disabled={boxes <= minBoxes}
                            className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current hover:bg-rose-100 hover:text-rose-500 rounded-md p-1 mx-auto"
                          >
                            <MinusSmIcon className="w-6 h-6 flex-shrink-0" />
                          </button>
                          <p className="font-medium text-lg sm:text-xl whitespace-nowrap">
                            {isFlooring ? boxes : product.quantity}
                          </p>
                          <button
                            onClick={() => {
                              if (isFlooring) {
                                // Add one box worth of sq ft
                                addItem(product, boxSize);
                              } else {
                                addItem(product, 1);
                              }
                            }}
                            className="hover:bg-green-100 hover:text-green-500 rounded-md p-1 mx-auto"
                          >
                            <PlusSmIcon className="w-6 h-6 flex-shrink-0 " />
                          </button>
                        </>
                      );
                    })()}
                  </div>

                  {/* Price */}
                  <div className="sm:text-right">
                  {product.priceOnRequest ? (
                    <p className="font-medium text-xl text-vfo-charcoal">
                      {product.priceNote || 'Call for price'}
                    </p>
                  ) : product.pricePerSqFt ? (
                      <>
                        <p className="font-light text-sm text-gray-600">
                          {product.quantity} sq ft @ ${product.pricePerSqFt.toFixed(2)}/sq ft
                        </p>
                        <p className="font-medium text-xl">
                          {formatCurrency(product.itemTotalPrice || (product.pricePerSqFt * product.quantity * 100))}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium text-xl">
                        <XIcon className="w-4 h-4 text-gray-500 inline-block" />
                        {formatCurrency(product.price)}
                      </p>
                    )}
                  </div>

                  {/* Remove item */}
                  <button
                    onClick={() => removeItem(product, product.quantity)}
                    className="hover:text-rose-500 self-start sm:self-auto"
                  >
                    <XCircleIcon className="w-6 h-6 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            ))}

            {/* Project Accessories Calculator */}
            {shouldShowAccessoriesCalculator && (
              <div className="mt-12 mb-8 pb-8 border-b border-gray-200">
                <ProjectAccessoriesCalculator sqFt={totalFlooringSqFt} />
              </div>
            )}

            {/* Shipping Calculator */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-heading tracking-wide mb-4">Calculate Shipping</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1">
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                    placeholder="V8V 1N1"
                    maxLength={7}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {shippingResult && !shippingResult.valid && (
                    <p className="mt-1 text-sm text-red-600">{shippingResult.error}</p>
                  )}
                </div>
              </div>

              {shippingResult && shippingResult.valid && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Zone:</span>
                      <span className="font-medium">{shippingResult.zone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Boxes:</span>
                      <span>{shippingResult.boxes} {shippingResult.boxes === 1 ? 'box' : 'boxes'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rate:</span>
                      <span>{formatCurrency(shippingResult.ratePerBox)} per box</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Shipping Total:</span>
                      <span className="text-emerald-600">{formatCurrency(shippingResult.shipping)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t py-4 mt-8">
              <div className="space-y-2 text-right mb-6">
                <p className="text-lg">
                  Subtotal:{' '}
                  <span className="font-medium">
                    {formatCurrency(totalPrice)}
                  </span>
                </p>
                {shippingResult && shippingResult.valid && (
                  <p className="text-lg">
                    Shipping:{' '}
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(shippingResult.shipping)}
                    </span>
                  </p>
                )}
                <p className="text-2xl font-medium pt-2 border-t">
                  Total:{' '}
                  <span className="text-emerald-600">
                    {formatCurrency(grandTotal)}
                  </span>
                </p>
              </div>

              {/* Email capture for abandoned cart tracking */}
              {shippingResult?.valid && !emailCaptured && (
                <CheckoutEmailCapture
                  onEmailCaptured={handleEmailCaptured}
                  cartItems={Object.values(cartDetails).map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.pricePerSqFt ? Math.round(item.pricePerSqFt * 100) : item.price,
                    sqft: item.pricePerSqFt ? item.quantity : null,
                  }))}
                  cartTotal={Math.round(grandTotal * 100)}
                  dealId={Object.values(cartDetails).find(item => item.id === 'deal-of-the-week')?.id || null}
                  dealEndsAt={Object.values(cartDetails).find(item => item.id === 'deal-of-the-week')?.endsAt || null}
                  postalCode={postalCode}
                  shippingZone={shippingResult?.zone}
                />
              )}

              {/* Checkout button (only visible after email captured) */}
              {emailCaptured && (
                <div className="flex flex-col items-end">
                  <button
                    onClick={redirectToCheckout}
                    disabled={redirecting}
                    className="border rounded py-2 px-6 bg-emerald-500 hover:bg-emerald-600 border-emerald-500 hover:border-emerald-600 focus:ring-4 focus:ring-opacity-50 focus:ring-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 max-w-max"
                  >
                    {redirecting ? 'Redirecting...' : 'Go to Checkout'}
                  </button>
                </div>
              )}

              {/* Validation messages */}
              {!shippingResult?.valid && (postalCode || shippingNotice) && (
                <p className="mt-2 text-sm text-red-600 text-right">
                  {postalCode
                    ? 'Please enter a valid Canadian postal code'
                    : 'Please calculate shipping before proceeding to checkout'}
                </p>
              )}
              {!shippingResult?.valid && !postalCode && !shippingNotice && (
                <p className="mt-2 text-sm text-gray-600 text-right">
                  Please calculate shipping to enable checkout.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Cart;
