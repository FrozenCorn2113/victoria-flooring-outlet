import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import axios from 'axios';
import { formatCurrency } from '@/lib/utils';
import getStripe from '@/lib/get-stripe';
import { calculateShipping } from '@/lib/shipping';
import {
  XCircleIcon,
  XMarkIcon as XIcon,
  MinusSmallIcon as MinusSmIcon,
  PlusSmallIcon as PlusSmIcon,
} from '@heroicons/react/24/outline';

const Cart = () => {
  const { cartDetails, totalPrice, cartCount, addItem, removeItem, clearCart } =
    useShoppingCart();
  const [redirecting, setRedirecting] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [shippingResult, setShippingResult] = useState(null);

  // Calculate shipping when postal code or cart changes
  useEffect(() => {
    if (postalCode && cartCount > 0) {
      const result = calculateShipping({ postalCode, cartDetails });
      setShippingResult(result);
    } else {
      setShippingResult(null);
    }
  }, [postalCode, cartDetails, cartCount]);

  const handlePostalCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Auto-format as user types (A1A1A1 -> A1A 1A1)
    if (value.length <= 6) {
      let formatted = value;
      if (value.length > 3) {
        formatted = `${value.slice(0, 3)} ${value.slice(3)}`;
      }
      setPostalCode(formatted.trim());
    }
  };

  const redirectToCheckout = async () => {
    setRedirecting(true);
    try {
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
          // Legacy: use price ID for products without pricePerSqFt
          return {
            price: product.id,
            quantity: product.quantity,
          };
        }),
        shipping: shippingResult?.shipping || 0,
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
        {cartCount > 0 ? (
          <>
            <h2 className="text-4xl font-heading tracking-wide">Your shopping cart</h2>
            <p className="mt-1 text-xl font-light">
              {cartCount} items{' '}
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
                className="flex justify-between space-x-4 hover:shadow-lg hover:border-opacity-50 border border-opacity-0 rounded-md p-4"
              >
                {/* Image + Name */}
                <Link href={`/products/${product.id}`} className="flex items-center space-x-4 group">
                  <div className="relative w-20 h-20 group-hover:scale-110 transition-transform">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="font-heading text-xl group-hover:underline">
                    {product.name}
                  </p>
                </Link>

                {/* Price + Actions */}
                <div className="flex items-center">
                  {/* Quantity */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        // Remove 10 sq ft increments for flooring, 1 for accessories
                        const removeAmount = product.pricePerSqFt ? 10 : 1;
                        removeItem(product, removeAmount);
                      }}
                      disabled={product?.quantity <= (product.pricePerSqFt ? 10 : 1)}
                      className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current hover:bg-rose-100 hover:text-rose-500 rounded-md p-1"
                    >
                      <MinusSmIcon className="w-6 h-6 flex-shrink-0" />
                    </button>
                    <p className="font-medium text-xl">
                      {product.quantity}
                      {product.pricePerSqFt ? ' sq ft' : ''}
                    </p>
                    <button
                      onClick={() => {
                        // Add 10 sq ft increments for flooring, 1 for accessories
                        const addAmount = product.pricePerSqFt ? 10 : 1;
                        addItem(product, addAmount);
                      }}
                      className="hover:bg-green-100 hover:text-green-500 rounded-md p-1"
                    >
                      <PlusSmIcon className="w-6 h-6 flex-shrink-0 " />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="ml-16 text-right">
                    {product.pricePerSqFt ? (
                      <>
                        <p className="font-light text-sm text-gray-600">
                          ${product.pricePerSqFt.toFixed(2)}/sq ft
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
                    className="ml-4 hover:text-rose-500"
                  >
                    <XCircleIcon className="w-6 h-6 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            ))}

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

            <div className="flex flex-col items-end border-t py-4 mt-8">
              <div className="space-y-2 text-right">
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

              <button
                onClick={redirectToCheckout}
                disabled={redirecting || (postalCode && !shippingResult?.valid)}
                className="border rounded py-2 px-6 bg-emerald-500 hover:bg-emerald-600 border-emerald-500 hover:border-emerald-600 focus:ring-4 focus:ring-opacity-50 focus:ring-emerald-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 max-w-max mt-4"
              >
                {redirecting ? 'Redirecting...' : 'Go to Checkout'}
              </button>
              {postalCode && !shippingResult?.valid && (
                <p className="mt-2 text-sm text-red-600">Please enter a valid Canadian postal code</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Cart;
