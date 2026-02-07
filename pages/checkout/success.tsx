import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { TruckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { trackEcommerce } from '@/lib/analytics';

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ShippingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface OrderData {
  id: number;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress | null;
  shippingZone: string | null;
  createdAt: string;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatAddress(address: ShippingAddress | null): string {
  if (!address) return '';
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
  ].filter(Boolean);
  return parts.join(', ');
}

export default function CheckoutSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    if (session_id && typeof session_id === 'string') {
      fetch(`/api/orders/${session_id}`)
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              // Order not in DB yet - webhook might still be processing
              return null;
            }
            throw new Error('Failed to fetch order');
          }
          return res.json();
        })
        .then(data => {
          if (data?.order) {
            setOrder(data.order);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching order:', err);
          setError(err.message);
          setLoading(false);
        });
    } else if (router.isReady) {
      setLoading(false);
    }
  }, [session_id, router.isReady]);

  useEffect(() => {
    if (!order || purchaseTrackedRef.current) return;

    const items = order.items.map((item) => ({
      item_id: item.name,
      item_name: item.name,
      price: Number((item.unit_price / 100).toFixed(2)),
      quantity: item.quantity,
    }));

    trackEcommerce('purchase', {
      transaction_id: String(order.id),
      currency: 'CAD',
      value: Number((order.total / 100).toFixed(2)),
      shipping: Number((order.shipping / 100).toFixed(2)),
      items,
    });
    purchaseTrackedRef.current = true;
  }, [order]);


  return (
    <>
      <Head>
        <title>Order Confirmed | Victoria Flooring Outlet</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-vfo-bg py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-vfo-charcoal mb-3">
              Order Confirmed!
            </h1>

            <p className="text-vfo-grey mb-4">
              Thank you for your order{order?.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}!
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-vfo-grey">
              <EnvelopeIcon className="w-4 h-4" />
              <span>Confirmation email sent{order?.customerEmail ? ` to ${order.customerEmail}` : ''}</span>
            </div>
          </div>

          {/* Order Details */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          ) : order ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              {/* Order Number */}
              <div className="px-6 py-4 bg-vfo-charcoal text-white flex justify-between items-center">
                <span className="text-sm font-medium">Order #{order.id}</span>
                <span className="text-sm opacity-80">
                  {new Date(order.createdAt).toLocaleDateString('en-CA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Items */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-vfo-charcoal uppercase tracking-wide mb-4">
                  Items Ordered
                </h2>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-vfo-charcoal font-medium">{item.name}</p>
                        <p className="text-sm text-vfo-grey">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-vfo-charcoal font-medium">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-vfo-grey">Subtotal</span>
                    <span className="text-vfo-charcoal">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-vfo-grey">
                      Shipping{order.shippingZone ? ` (${order.shippingZone})` : ''}
                    </span>
                    <span className="text-vfo-charcoal">
                      {order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                    <span className="text-vfo-charcoal">Total</span>
                    <span className="text-vfo-charcoal">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <TruckIcon className="w-5 h-5 text-vfo-grey flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-vfo-charcoal mb-1">Shipping To</h3>
                      <p className="text-sm text-vfo-grey">{formatAddress(order.shippingAddress)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback when order not found yet */
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              {session_id && (
                <p className="text-sm text-vfo-grey text-center">
                  Order Reference: <span className="font-mono text-vfo-charcoal">{String(session_id).slice(-12)}</span>
                </p>
              )}
            </div>
          )}

          {/* What's Next */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-vfo-charcoal uppercase tracking-wide mb-4">
              What Happens Next?
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-vfo-accent text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                <p className="text-vfo-grey">We'll prepare your flooring for shipment within 1-2 business days.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-vfo-accent text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                <p className="text-vfo-grey">You'll receive a shipping confirmation email with tracking info.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-vfo-accent text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                <p className="text-vfo-grey">Delivery typically takes 3-7 business days depending on your location.</p>
              </div>
            </div>
          </div>

          {/* Contact & Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-vfo-grey mb-4">Questions about your order?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="sms:7788717681"
                className="inline-flex items-center justify-center px-6 py-3 bg-vfo-accent text-white font-medium rounded-lg hover:bg-teal-600 transition-colors"
              >
                Text Ty: 778-871-7681
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-vfo-charcoal text-white font-medium rounded-lg hover:bg-vfo-slate transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
