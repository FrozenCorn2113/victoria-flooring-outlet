import React from 'react';
import { formatCurrency } from '../lib/utils';

export default function SquareFootageCalculator({
  coverageSqFtPerBox,
  pricePerSqFt,
  compareAtPricePerSqFt,
  sqFt,
  onSqFtChange,
  currency = 'CAD'
}) {
  // Calculate boxes needed (always round up, no partial boxes)
  // Add safety check for coverageSqFtPerBox to prevent division by zero
  const boxesNeeded = sqFt && sqFt > 0 && coverageSqFtPerBox && coverageSqFtPerBox > 0 
    ? Math.ceil(sqFt / coverageSqFtPerBox) 
    : 0;
  const totalCoverage = boxesNeeded * (coverageSqFtPerBox || 0);
  const totalPrice = pricePerSqFt * sqFt;
  const pricePerBox = pricePerSqFt * (coverageSqFtPerBox || 0);

  // Calculate savings if compare price exists
  const hasSavings = compareAtPricePerSqFt && compareAtPricePerSqFt > pricePerSqFt;
  const savings = hasSavings ? (compareAtPricePerSqFt - pricePerSqFt) * sqFt : 0;

  return (
    <div className="bg-white border border-vfo-border rounded-lg p-6 space-y-4">
      {/* Square Footage Input */}
      <div>
        <label htmlFor="sqft-input" className="block text-sm font-medium text-vfo-charcoal mb-2">
          How much do you need?
        </label>
        <div className="flex items-center space-x-2">
          <input
            id="sqft-input"
            type="number"
            min="0"
            step="1"
            value={sqFt || ''}
            onChange={(e) => onSqFtChange(e.target.value)}
            placeholder="eg. 1500"
            className="w-full max-w-[12rem] px-4 py-2 border border-vfo-border rounded-md text-2xl font-medium text-vfo-charcoal placeholder:text-sm placeholder:font-light focus:outline-none focus:ring-2 focus:ring-vfo-charcoal focus:border-transparent"
          />
          <span className="text-lg font-light text-vfo-grey">sq. ft.</span>
        </div>
      </div>

      {/* Box Coverage Information */}
      {sqFt > 0 && coverageSqFtPerBox && coverageSqFtPerBox > 0 && (
        <div className="bg-gray-50 rounded-md p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-vfo-grey">Box Coverage</span>
            <span className="font-light text-vfo-charcoal">
              {coverageSqFtPerBox} sq. ft. / box
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-vfo-grey">Total Required</span>
              <span className="text-base font-medium text-vfo-charcoal">
                {boxesNeeded} {boxesNeeded === 1 ? 'box' : 'boxes'} covers {totalCoverage} sq. ft.
              </span>
            </div>
            {totalCoverage > sqFt && (
              <p className="text-xs font-light text-vfo-grey mt-1 text-right">
                (includes {totalCoverage - sqFt} sq. ft. overage)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      {sqFt > 0 && (
        <div className="border-t border-vfo-border pt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-light text-vfo-grey">
              Product Price
            </span>
            <span className="text-sm font-light text-vfo-charcoal">
              {formatCurrency(pricePerSqFt * 100, currency)} / sq. ft.
            </span>
          </div>
          {coverageSqFtPerBox && coverageSqFtPerBox > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-light text-vfo-grey">
                Price per Box
              </span>
              <span className="text-sm font-light text-vfo-charcoal">
                {formatCurrency(pricePerBox * 100, currency)} / box ({coverageSqFtPerBox} sq. ft.)
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-base font-medium text-vfo-charcoal">
              Total Price
            </span>
            <span className="text-xl font-medium text-vfo-charcoal">
              {formatCurrency(totalPrice * 100, currency)}
            </span>
          </div>
          {hasSavings && (
            <div className="text-right">
              <span className="text-sm font-medium text-green-600">
                Save {formatCurrency(savings * 100, currency)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      {!sqFt || sqFt === 0 ? (
        <p className="text-sm font-light text-vfo-grey text-center py-2">
          Enter square footage to calculate boxes needed
        </p>
      ) : null}
    </div>
  );
}
