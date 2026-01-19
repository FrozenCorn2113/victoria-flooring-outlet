import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import { formatCurrency } from '@/lib/utils';
import { Rating } from '@/components/index';

const ProductCard = props => {
  const { cartCount, addItem } = useShoppingCart();
  const [adding, setAdding] = useState(false);

  const toastId = useRef();
  const firstRun = useRef(true);

  const handleOnAddToCart = event => {
    event.preventDefault();

    setAdding(true);
    toastId.current = toast.loading('Adding 1 item...');

    if (typeof props.onClickAdd === 'function') {
      props.onClickAdd();
    }

    addItem(props);
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (adding) {
      setAdding(false);
      toast.success(`${props.name} added`, {
        id: toastId.current,
      });
    }

    if (typeof props.onAddEnded === 'function') {
      props.onAddEnded();
    }
  }, [cartCount]);

  return (
    <div className="bg-white border border-vfo-border rounded-sm p-6 group hover:shadow-md transition-shadow h-full grid" style={{ gridTemplateRows: 'auto auto 1fr auto' }}>
      <Link href={`/products/${props.id}`}>
          {/* Product's image */}
          <div className="relative w-full h-48 mb-4 rounded-sm overflow-hidden bg-vfo-sand">
            <Image
              src={props.image || '/flooring/placeholder.jpg'}
              alt={props.name}
              fill
              className={`${props.type === 'Accessory' ? 'object-contain p-2' : 'object-cover'} group-hover:scale-105 transition-transform duration-300`}
            />
          </div>

          {/* Name + Rating */}
          <div className="mb-4">
            <p className="font-heading text-base text-vfo-charcoal mb-2 line-clamp-2">{props.name}</p>
            {props.description && (
              <p className="text-sm font-light text-vfo-grey line-clamp-2 mb-2">{props.description}</p>
            )}
            <Rating rate={props?.rating?.rate} count={props?.rating?.count} />
          </div>
      </Link>

      {/* Spacer */}
      <div />

      {/* Price + CTA */}
      <div className="mt-4 pt-4 border-t border-vfo-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-vfo-lightgrey mb-1">Price</p>
            {props.priceOnRequest ? (
              <p className="text-lg font-medium text-vfo-charcoal">
                {props.priceNote || 'Call for price'}
              </p>
            ) : props.pricePerSqFt ? (
              <p className="text-lg font-medium text-vfo-charcoal">
                ${props.pricePerSqFt.toFixed(2)}/sq ft
              </p>
            ) : (
              <p className="text-lg font-medium text-vfo-charcoal">
                {formatCurrency(props.price, props.currency)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleOnAddToCart}
            disabled={adding || props.disabled}
            className="px-4 py-2 bg-vfo-charcoal hover:bg-vfo-slate text-white text-sm font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
