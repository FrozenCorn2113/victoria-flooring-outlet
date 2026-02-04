import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import { formatCurrency } from '@/lib/utils';
import { Rating } from '@/components/index';

const ProductCard = memo(function ProductCard(props) {
  const { addItem } = useShoppingCart();
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(props.initialQuantity ?? 1);
  const showQuantitySelector = Boolean(props.showQuantitySelector);

  const handleQuantityChange = (value) => {
    const parsed = Number.parseInt(value, 10);
    setQuantity(Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
  };

  const handleOnAddToCart = event => {
    event.preventDefault();

    if (typeof props.onClickAdd === 'function') {
      props.onClickAdd();
    }

    const quantityToAdd = showQuantitySelector ? quantity : 1;
    addItem(props, quantityToAdd);
    setAdding(true);

    setTimeout(() => {
      setAdding(false);
      if (typeof props.onAddEnded === 'function') {
        props.onAddEnded();
      }
    }, 2000);
  };

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex items-center gap-3">
            {showQuantitySelector && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-sm border border-vfo-border text-vfo-charcoal hover:border-vfo-accent hover:bg-vfo-accent/5 disabled:opacity-40 disabled:hover:border-vfo-border disabled:hover:bg-transparent"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantity}
                  onChange={(event) => handleQuantityChange(event.target.value)}
                  className="w-12 text-center px-0 py-1.5 border border-vfo-border rounded-sm text-sm text-vfo-charcoal focus:outline-none focus:ring-2 focus:ring-vfo-accent"
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-sm border border-vfo-border text-vfo-charcoal hover:border-vfo-accent hover:bg-vfo-accent/5"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleOnAddToCart}
              disabled={adding || props.disabled}
              className={`px-4 py-2 text-white text-sm font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                adding
                  ? 'bg-teal-600'
                  : 'bg-vfo-accent hover:bg-teal-600'
              }`}
            >
              {adding ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Added
                </span>
              ) : showQuantitySelector ? `Add ${quantity}` : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
