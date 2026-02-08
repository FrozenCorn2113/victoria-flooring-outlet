import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';
import getStripe from '@/lib/get-stripe';
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
  const viewCartTrackedRef = useRef(false);

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

  const buildCartItemsForTracking = (details) => {
    return Object.values(details || {}).map((item) => {
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
  };

  const buildCartItemsForCapture = (details) => {
    return Object.values(details || {}).map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.pricePerSqFt ? Math.round(item.pricePerSqFt * 100) : item.price,
      sqft: item.pricePerSqFt ? item.quantity : null,
    }));
  };

  const calculateCartTotal = (details) => {
    return Object.values(details || {}).reduce((sum, item) => {
      if (item.pricePerSqFt) {
        return sum + Math.round(item.pricePerSqFt * 100) * item.quantity;
      }
      return sum + (item.price || 0) * item.quantity;
    }, 0);
  };

  const cartItemsForTracking = useMemo(() => {
    return buildCartItemsForTracking(cartDetails || {});
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

  const accessoriesCalculatorRef = useRef(null);

  const mergeCartDetailsWithSelections = (details, selections) => {
    if (!selections) return { ...details };

    const merged = { ...details };
    const applySelection = (product, desiredQty) => {
      if (!product || desiredQty <= 0) return;
      const existing = merged[product.id];
      const existingQty = existing?.quantity || 0;
      const nextQty = Math.max(existingQty, desiredQty);
      if (nextQty !== existingQty) {
        merged[product.id] = { ...(existing || product), quantity: nextQty };
      }
    };

    if (selections.adhesive) {
      applySelection(selections.adhesive.product, selections.adhesive.quantity);
    }
    if (selections.transitions) {
      applySelection(selections.transitions.tMoulding?.product, selections.transitions.tMoulding?.quantity || 0);
      applySelection(selections.transitions.reducer?.product, selections.transitions.reducer?.quantity || 0);
      applySelection(selections.transitions.nosing?.product, selections.transitions.nosing?.quantity || 0);
    }

    return merged;
  };

  const addAccessoriesToCartFromSelections = (selections) => {
    if (!selections) return;
    const applySelection = (product, desiredQty) => {
      if (!product || desiredQty <= 0) return;
      const existingQty = cartDetails?.[product.id]?.quantity || 0;
      if (desiredQty > existingQty) {
        addItem(product, desiredQty - existingQty);
      }
    };

    if (selections.adhesive) {
      applySelection(selections.adhesive.product, selections.adhesive.quantity);
    }
    if (selections.transitions) {
      applySelection(selections.transitions.tMoulding?.product, selections.transitions.tMoulding?.quantity || 0);
      applySelection(selections.transitions.reducer?.product, selections.transitions.reducer?.quantity || 0);
      applySelection(selections.transitions.nosing?.product, selections.transitions.nosing?.quantity || 0);
    }
  };

  const getCheckoutSnapshot = () => {
    const selections = accessoriesCalculatorRef.current?.getSelectedAccessories?.() || null;
    const mergedCartDetails = mergeCartDetailsWithSelections(cartDetails || {}, selections);
    const mergedTotalPrice = calculateCartTotal(mergedCartDetails);
    const dealItem = Object.values(mergedCartDetails).find(item => item.id === 'deal-of-the-week');

    return {
      selections,
      mergedCartDetails,
      mergedTotalPrice,
      cartItemsForTracking: buildCartItemsForTracking(mergedCartDetails),
      cartItems: buildCartItemsForCapture(mergedCartDetails),
      cartTotal: mergedTotalPrice,
      dealId: dealItem?.id || null,
      dealEndsAt: dealItem?.endsAt || null,
    };
  };

  const handleCheckout = async (email, sessionToken, snapshot) => {
    setRedirecting(true);
    
    try {
      const resolvedSnapshot = snapshot || getCheckoutSnapshot();
      const mergedCartDetails = resolvedSnapshot.mergedCartDetails || cartDetails || {};
      const mergedTotalPrice = resolvedSnapshot.mergedTotalPrice ?? calculateCartTotal(mergedCartDetails);
      const mergedCartItemsForTracking = resolvedSnapshot.cartItemsForTracking || buildCartItemsForTracking(mergedCartDetails);

      addAccessoriesToCartFromSelections(resolvedSnapshot.selections);

      trackEcommerce('begin_checkout', {
        currency: 'CAD',
        value: Number((mergedTotalPrice / 100).toFixed(2)),
        items: mergedCartItemsForTracking,
      });

      // Create Stripe checkout session
      const {
        data: { id },
      } = await axios.post('/api/checkout_sessions', {
        items: Object.entries(mergedCartDetails).map(([_, product]) => {
          if (product.pricePerSqFt) {
            return {
              price_data: {
                currency: 'cad',
                product_data: {
                  name: product.name,
                },
                unit_amount: Math.round(product.pricePerSqFt * 100),
              },
              quantity: product.quantity,
            };
          }
          return {
            price_data: {
              currency: 'cad',
              product_data: {
                name: product.name,
              },
              unit_amount: product.price,
            },
            quantity: product.quantity,
          };
        }),
        email,
        sessionToken,
      });

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      await stripe.redirectToCheckout({ sessionId: id });
    } catch (error) {
      console.error('Checkout error:', error);
      setRedirecting(false);
      throw error; // Re-throw so CheckoutEmailCapture can handle it
    }
  };

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
          <div className="mt-12 grid lg:grid-cols-3 gap-8">
            {/* Left Column: Cart Items + Accessories Calculator */}
            <div className="lg:col-span-2 space-y-4">
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
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <ProjectAccessoriesCalculator ref={accessoriesCalculatorRef} sqFt={totalFlooringSqFt} />
                </div>
              )}
            </div>

            {/* Right Column: Order Summary (Sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <div className="bg-vfo-sand border border-vfo-border rounded-sm p-6">
                  <h3 className="text-xl font-heading text-vfo-charcoal mb-6">Order Summary</h3>
                  
                  <div className="space-y-3 mb-6 pb-6 border-b border-vfo-border">
                    <div className="flex justify-between text-base">
                      <span className="text-vfo-grey">Subtotal:</span>
                      <span className="font-medium text-vfo-charcoal">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-vfo-grey">
                      <span>Shipping:</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-vfo-grey">
                      💰 Free shipping on orders over 500 sq ft • Zone-based rates for all Vancouver Island
                    </p>
                  </div>

                  {/* Email capture + checkout */}
                  <CheckoutEmailCapture
                    onCheckout={handleCheckout}
                    getCartSnapshot={getCheckoutSnapshot}
                    cartItems={buildCartItemsForCapture(cartDetails)}
                    cartTotal={totalPrice}
                    dealId={Object.values(cartDetails).find(item => item.id === 'deal-of-the-week')?.id || null}
                    dealEndsAt={Object.values(cartDetails).find(item => item.id === 'deal-of-the-week')?.endsAt || null}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Cart;
