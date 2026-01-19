import { useState } from 'react';
import Image from 'next/image';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function AccessoryRecommendationCard({ accessory, flooringSqFt }) {
  const [quantity, setQuantity] = useState(accessory.recommendedQuantity || 1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useShoppingCart();

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(accessory, quantity);

    // Show brief feedback
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const hasCoverage = Boolean(accessory.coverage?.sqFtPerUnit);
  const totalPrice = (accessory.price * quantity / 100).toFixed(2);
  const unitPrice = (accessory.price / 100).toFixed(2);
  const totalCoverage = hasCoverage ? quantity * accessory.coverage.sqFtPerUnit : 0;

  return (
    <div className="bg-white border border-vfo-muted/20 rounded-xl p-6 hover:shadow-md transition-shadow">
      {/* Product Image & Name */}
      <div className="flex gap-4 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0 bg-vfo-bg rounded-lg overflow-hidden">
          <Image
            src={accessory.image}
            alt={accessory.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-vfo-slate text-base mb-1 leading-tight">
            {accessory.name}
          </h3>
          <p className="text-xs text-vfo-bluegrey">
            {accessory.priceOnRequest
              ? (accessory.priceNote || 'Call for price')
              : `$${unitPrice} per ${accessory.subType?.toLowerCase() || 'unit'}`
            }
          </p>
          {accessory.appearanceNote && (
            <p className="text-xs text-vfo-muted mt-1">
              {accessory.appearanceNote}
            </p>
          )}
        </div>
      </div>

      {/* Why Recommended */}
      <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-100">
        <p className="text-xs font-medium text-teal-900 mb-1">
          Recommended for Your Project
        </p>
        <p className="text-xs text-teal-700">
          Based on {flooringSqFt} sq ft flooring
        </p>
        {accessory.coverageDescription && (
          <p className="text-xs text-teal-600 mt-1">
            {accessory.coverageDescription}
          </p>
        )}
        {!hasCoverage && (
          <p className="text-xs text-teal-600 mt-1">
            Match trim to your flooring color for a finished edge.
          </p>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-vfo-muted mb-2 uppercase tracking-wide">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 disabled:opacity-40 disabled:hover:border-vfo-muted/30 disabled:hover:bg-transparent transition-colors"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="w-4 h-4 text-vfo-slate" />
          </button>

          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-vfo-slate">
              {quantity}
            </div>
          {hasCoverage && (
            <div className="text-xs text-vfo-bluegrey">
              {totalCoverage} sq ft total
            </div>
          )}
          </div>

          <button
            onClick={incrementQuantity}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 transition-colors"
            aria-label="Increase quantity"
          >
            <PlusIcon className="w-4 h-4 text-vfo-slate" />
          </button>
        </div>
      </div>

      {/* Total Price */}
      <div className="mb-4 py-3 border-t border-vfo-muted/20">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-vfo-muted">Total:</span>
          <span className="text-2xl font-bold text-vfo-slate">
            {accessory.priceOnRequest ? (accessory.priceNote || 'Call for price') : `$${totalPrice}`}
          </span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all ${
          isAdding
            ? 'bg-green-500 text-white'
            : 'bg-vfo-accent hover:bg-teal-600 text-white'
        }`}
      >
        {isAdding ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Added!
          </span>
        ) : (
          `Add ${quantity} to Cart`
        )}
      </button>
    </div>
  );
}
