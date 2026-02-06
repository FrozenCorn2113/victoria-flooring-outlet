import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import { formatCurrency } from '@/lib/utils';
import products from '../products';

// Get products by ID
const getProduct = (id) => products.find(p => p.id === id);

// Adhesive products
const ADHESIVES = {
  standard: getProduct('uzin_ke_2000_s'),
  highTraffic: getProduct('uzin_ke_66'),
  commercial: getProduct('uzin_kr_430'),
};

const ADHESIVE_IMAGES = {
  standard: '/images/uzin-ke-2000-s.png',
  highTraffic: '/images/uzin-ke-66.png',
  commercial: '/images/uzin-kr-430.png',
};

const ADHESIVE_LABELS = {
  standard: 'Standard residential',
  highTraffic: 'High-traffic residential',
  commercial: 'Commercial / heavy-duty',
};

// Transition products
const TRANSITIONS = {
  tMoulding: getProduct('harbinger-t-moulding'),
  reducer: getProduct('harbinger-reducer'),
  flushNosing: getProduct('harbinger-flush-overlap-nosing'),
  overlapNosing: getProduct('harbinger-sac-square-nosing'),
};

const TransitionImage = ({ src, alt }) => {
  if (!src) {
    return (
      <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-vfo-muted/20 bg-vfo-bg text-[10px] text-vfo-muted">
        Image coming soon
      </div>
    );
  }

  return (
    <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-vfo-muted/20 bg-white sm:h-24 sm:w-36">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 128px, 144px"
        className="object-contain p-2"
      />
    </div>
  );
};

const getGallonLabel = (count) => (count === 1 ? 'gallon' : 'gallons');

// Adhesive selection card - expands when selected to show quantity controls
const AdhesiveSelectionCard = ({
  adhesive,
  imageSrc,
  label,
  isSelected,
  onSelect,
  sqFt,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAdding,
}) => {
  const bestFor = adhesive?.bestFor?.length ? adhesive.bestFor.join(', ') : null;
  const coverageText =
    adhesive?.specifications?.coverage ||
    (adhesive?.coverage?.sqFtPerUnit ? `~${adhesive.coverage.sqFtPerUnit} sq ft per gallon` : null);
  const dataSheetUrl = adhesive?.datasheetUrl || adhesive?.dataSheetUrl;
  const recommendedUnits = Math.ceil(sqFt / (adhesive?.coverage?.sqFtPerUnit || 150));
  const totalPrice = quantity * (adhesive?.price || 0);

  return (
    <div
      onClick={() => !isSelected && onSelect()}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-vfo-accent bg-teal-50'
          : 'border-vfo-muted/30 bg-white hover:border-vfo-muted/50 hover:bg-gray-50 cursor-pointer'
      }`}
    >
      <div className="flex gap-4 items-start">
        <div className="relative h-16 w-16 flex-shrink-0 rounded-lg border border-vfo-muted/20 bg-white">
          {imageSrc && (
            <Image
              src={imageSrc}
              alt={adhesive?.name || 'UZIN adhesive'}
              fill
              sizes="64px"
              className="object-contain p-2"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-vfo-muted">{label}</p>
              <h4 className="font-semibold text-vfo-slate text-base">{adhesive?.name?.split(' - ')[0]}</h4>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              isSelected ? 'border-vfo-accent bg-vfo-accent' : 'border-vfo-muted/40'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-sm text-vfo-bluegrey mt-1">{adhesive?.chooseThisIf}</p>
          <div className="mt-2 space-y-0.5">
            {bestFor && (
              <p className="text-xs text-vfo-muted">Best for: {bestFor}</p>
            )}
            {coverageText && (
              <p className="text-xs text-vfo-muted">Coverage: {coverageText}</p>
            )}
            {dataSheetUrl && (
              <a
                href={dataSheetUrl}
                className="inline-flex text-xs text-vfo-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                View data sheet (PDF)
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expanded quantity controls when selected */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-teal-200">
          {sqFt > 0 && (
            <p className="text-sm text-teal-700 mb-3">
              <span className="font-medium">Recommended:</span> {recommendedUnits} {getGallonLabel(recommendedUnits)} for {sqFt} sq ft
            </p>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onQuantityChange(Math.max(1, quantity - 1)); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-vfo-muted/30 bg-white hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium text-lg"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={quantity}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 text-center py-2 border border-vfo-muted/30 rounded-lg text-vfo-slate font-medium bg-white focus:outline-none focus:ring-2 focus:ring-vfo-accent"
              />
              <button
                onClick={(e) => { e.stopPropagation(); onQuantityChange(quantity + 1); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-vfo-muted/30 bg-white hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium text-lg"
              >
                +
              </button>
              <span className="text-sm text-vfo-muted">{getGallonLabel(quantity)}</span>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-vfo-slate">{formatCurrency(totalPrice)}</p>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(adhesive, quantity); }}
            disabled={isAdding}
            className={`w-full mt-3 py-2.5 font-semibold rounded-lg transition-colors ${
              isAdding
                ? 'bg-teal-600 text-white'
                : 'bg-vfo-accent hover:bg-teal-600 text-white'
            }`}
          >
            {isAdding ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added to Cart!
              </span>
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Transition input row
const TransitionInput = ({
  label,
  description,
  detail,
  imageSrc,
  imageAlt,
  value,
  onChange,
  pricePerUnit,
}) => {
  const total = value * pricePerUnit;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-lg border border-vfo-muted/20">
      <TransitionImage src={imageSrc} alt={imageAlt} />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-vfo-slate text-sm">{label}</h4>
        <p className="text-xs text-vfo-bluegrey">{description}</p>
        {detail && (
          <p className="mt-1 text-[11px] text-vfo-muted">
            {detail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-14 text-center py-1.5 border border-vfo-muted/30 rounded-lg text-vfo-slate font-medium focus:outline-none focus:ring-2 focus:ring-vfo-accent"
        />
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium"
        >
          +
        </button>
      </div>
      <div className="text-right min-w-[80px]">
        {value > 0 ? (
          <span className="font-medium text-vfo-slate">{formatCurrency(total)}</span>
        ) : (
          <span className="text-vfo-muted text-sm">$0</span>
        )}
      </div>
    </div>
  );
};

export default function ProjectAccessoriesCalculator({ sqFt = 0 }) {
  const { addItem } = useShoppingCart();
  const [activeTab, setActiveTab] = useState('adhesive');
  const [selectedNosing, setSelectedNosing] = useState('flush');

  // Adhesive selection state - null means no selection yet
  const [selectedAdhesiveKey, setSelectedAdhesiveKey] = useState(null);
  const [adhesiveQuantity, setAdhesiveQuantity] = useState(1);
  const [isAddingAdhesive, setIsAddingAdhesive] = useState(false);

  // When adhesive is selected, pre-fill recommended quantity based on sqFt
  const handleAdhesiveSelect = (key) => {
    setSelectedAdhesiveKey(key);
    const adhesive = ADHESIVES[key];
    const recommended = sqFt > 0
      ? Math.ceil(sqFt / (adhesive?.coverage?.sqFtPerUnit || 150))
      : 1;
    setAdhesiveQuantity(recommended);
    setIsAddingAdhesive(false);
  };

  const handleAddAdhesiveToCart = (adhesive, units) => {
    if (units > 0 && adhesive) {
      addItem(adhesive, units);
      setIsAddingAdhesive(true);
      // Show feedback, keep selection open
      setTimeout(() => {
        setIsAddingAdhesive(false);
      }, 2000);
    }
  };

  // Transition quantities
  const [tMouldingQty, setTMouldingQty] = useState(0);
  const [reducerQty, setReducerQty] = useState(0);
  const [nosingQty, setNosingQty] = useState(0);

  // Calculate transitions total
  const transitionPrice = TRANSITIONS.tMoulding?.price || 5500;
  const tMouldingTotal = tMouldingQty * transitionPrice;
  const reducerTotal = reducerQty * transitionPrice;
  const nosingProduct = selectedNosing === 'overlap' ? TRANSITIONS.overlapNosing : TRANSITIONS.flushNosing;
  const nosingPrice = nosingProduct?.price || transitionPrice;
  const nosingTotal = nosingQty * nosingPrice;
  const transitionsTotal = tMouldingTotal + reducerTotal + nosingTotal;

  const [isAddingTransitions, setIsAddingTransitions] = useState(false);

  const handleAddTransitionsToCart = () => {
    if (tMouldingQty > 0 && TRANSITIONS.tMoulding) {
      addItem(TRANSITIONS.tMoulding, tMouldingQty);
    }
    if (reducerQty > 0 && TRANSITIONS.reducer) {
      addItem(TRANSITIONS.reducer, reducerQty);
    }
    if (nosingQty > 0 && nosingProduct) {
      addItem(nosingProduct, nosingQty);
    }
    setIsAddingTransitions(true);
    setTimeout(() => {
      setIsAddingTransitions(false);
    }, 2000);
  };

  return (
    <div className="bg-vfo-bg rounded-xl border border-vfo-muted/20 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-vfo-muted/20">
        <h2 className="text-xl font-bold text-vfo-slate">Complete Your Project</h2>
        <p className="text-sm text-vfo-bluegrey mt-1">
          {sqFt > 0 
            ? `Based on your ${sqFt} sq ft project, here's what you'll need.`
            : 'Enter your square footage above to see personalized recommendations.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-vfo-muted/20 bg-white">
        <button
          onClick={() => setActiveTab('adhesive')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'adhesive'
              ? 'text-vfo-accent border-b-2 border-vfo-accent'
              : 'text-vfo-bluegrey hover:text-vfo-slate'
          }`}
        >
          Adhesive
        </button>
        <button
          onClick={() => setActiveTab('transitions')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'transitions'
              ? 'text-vfo-accent border-b-2 border-vfo-accent'
              : 'text-vfo-bluegrey hover:text-vfo-slate'
          }`}
        >
          Transitions & Nosings
          {transitionsTotal > 0 && (
            <span className="ml-2 text-xs bg-vfo-accent/10 text-vfo-accent px-2 py-0.5 rounded-full">
              {formatCurrency(transitionsTotal)}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Adhesive Tab */}
        {activeTab === 'adhesive' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="font-semibold text-vfo-slate mb-1">Which adhesive do I need?</h3>
              <p className="text-sm text-vfo-bluegrey">Select the option that best describes your space.</p>
            </div>

            <div className="space-y-3">
              {Object.entries(ADHESIVES).map(([key, adhesive]) => (
                <AdhesiveSelectionCard
                  key={key}
                  adhesive={adhesive}
                  imageSrc={ADHESIVE_IMAGES[key]}
                  label={ADHESIVE_LABELS[key]}
                  isSelected={selectedAdhesiveKey === key}
                  onSelect={() => handleAdhesiveSelect(key)}
                  sqFt={sqFt}
                  quantity={selectedAdhesiveKey === key ? adhesiveQuantity : 1}
                  onQuantityChange={setAdhesiveQuantity}
                  onAddToCart={handleAddAdhesiveToCart}
                  isAdding={selectedAdhesiveKey === key && isAddingAdhesive}
                />
              ))}
            </div>

            {sqFt === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-sm text-amber-800">
                  Enter your square footage in the calculator above to see how much adhesive you need.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transitions Tab */}
        {activeTab === 'transitions' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="font-semibold text-vfo-slate mb-1">What transitions do you need?</h3>
              <p className="text-sm text-vfo-bluegrey">
                Enter the number of each transition type for your project. Each piece is a 7 ft board and costs $55.
              </p>
              <p className="text-xs text-vfo-muted mt-2">
                T-mouldings and reducers include a matching track that fastens to the subfloor, and the transition snaps on top.
              </p>
            </div>

            <div className="space-y-3">
              <TransitionInput
                label="T-Moulding"
                description="Use in doorways or openings between two floors of the same height."
                detail="Full-length 7 ft board with matching track included."
                imageSrc={TRANSITIONS.tMoulding?.image}
                imageAlt="T-moulding transition profile with matching track"
                value={tMouldingQty}
                onChange={setTMouldingQty}
                pricePerUnit={transitionPrice}
              />
              <TransitionInput
                label="Reducer"
                description="Use where LVP meets a lower surface like carpet, tile, or a lower slab."
                detail="Full-length 7 ft board with matching track included."
                imageSrc={TRANSITIONS.reducer?.image}
                imageAlt="Reducer transition profile with matching track"
                value={reducerQty}
                onChange={setReducerQty}
                pricePerUnit={transitionPrice}
              />
              <div className="p-4 bg-white rounded-lg border border-vfo-muted/20">
                <div className="mb-4">
                  <h4 className="font-medium text-vfo-slate text-sm">Stair Nosing</h4>
                  <p className="text-xs text-vfo-bluegrey">
                    Two profiles are available. Choose flush or overlap for your stair edge.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <button
                    onClick={() => setSelectedNosing('flush')}
                    className={`flex gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedNosing === 'flush'
                        ? 'border-vfo-accent bg-teal-50'
                        : 'border-vfo-muted/20 hover:border-vfo-muted/40'
                    }`}
                  >
                    <TransitionImage
                      src={TRANSITIONS.flushNosing?.image}
                      alt={TRANSITIONS.flushNosing?.name || 'Flush/overlap stair nosing profile'}
                    />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-vfo-muted">Flush Nosing</p>
                      <p className="text-sm font-medium text-vfo-slate">{TRANSITIONS.flushNosing?.name}</p>
                      <p className="text-[11px] text-vfo-muted mt-1">
                        {TRANSITIONS.flushNosing?.useWhen || 'Standard stair/edge lip for glue-down flooring.'}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedNosing('overlap')}
                    className={`flex gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedNosing === 'overlap'
                        ? 'border-vfo-accent bg-teal-50'
                        : 'border-vfo-muted/20 hover:border-vfo-muted/40'
                    }`}
                  >
                    <TransitionImage
                      src={TRANSITIONS.overlapNosing?.image}
                      alt={TRANSITIONS.overlapNosing?.name || 'Overlap stair nosing profile'}
                    />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-vfo-muted">Overlap Nosing</p>
                      <p className="text-sm font-medium text-vfo-slate">{TRANSITIONS.overlapNosing?.name}</p>
                      <p className="text-[11px] text-vfo-muted mt-1">
                        {TRANSITIONS.overlapNosing?.useWhen || 'Overlap profile for stair edges and step-downs.'}
                      </p>
                    </div>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-vfo-bluegrey">
                      Use on stair edges and step-downs for a finished lip.
                    </p>
                    <p className="mt-1 text-[11px] text-vfo-muted">
                      Full-length 7 ft board cut to fit each stair.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNosingQty(Math.max(0, nosingQty - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <input
                        type="number"
                        min="0"
                        value={nosingQty}
                        onChange={(e) => setNosingQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 text-center py-1.5 border border-vfo-muted/30 rounded-lg text-vfo-slate font-medium focus:outline-none focus:ring-2 focus:ring-vfo-accent"
                      />
                      <p className="text-[10px] text-vfo-muted mt-0.5">pieces</p>
                    </div>
                    <button
                      onClick={() => setNosingQty(nosingQty + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    {nosingQty > 0 ? (
                      <div>
                        <span className="font-medium text-vfo-slate">{formatCurrency(nosingTotal)}</span>
                        <p className="text-[10px] text-vfo-muted">
                          {nosingQty} {nosingQty === 1 ? 'piece' : 'pieces'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-vfo-muted text-sm">$0</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {transitionsTotal > 0 && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-vfo-muted/20">
                <div className="space-y-2 mb-3">
                  {tMouldingQty > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-vfo-bluegrey">{tMouldingQty}× T-Moulding</span>
                      <span className="text-vfo-slate">{formatCurrency(tMouldingTotal)}</span>
                    </div>
                  )}
                  {reducerQty > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-vfo-bluegrey">{reducerQty}× Reducer</span>
                      <span className="text-vfo-slate">{formatCurrency(reducerTotal)}</span>
                    </div>
                  )}
                  {nosingQty > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-vfo-bluegrey">
                        {nosingQty}× {nosingProduct?.name || 'Stair Nosing'}
                      </span>
                      <span className="text-vfo-slate">{formatCurrency(nosingTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-vfo-muted/20">
                    <span className="font-medium text-vfo-slate">Total</span>
                    <span className="text-xl font-bold text-vfo-slate">{formatCurrency(transitionsTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={handleAddTransitionsToCart}
                  disabled={isAddingTransitions}
                  className={`w-full py-2.5 font-medium rounded-lg transition-colors ${
                    isAddingTransitions
                      ? 'bg-teal-600 text-white'
                      : 'bg-vfo-accent hover:bg-teal-600 text-white'
                  }`}
                >
                  {isAddingTransitions ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Cart!
                    </span>
                  ) : (
                    'Add Transitions to Cart'
                  )}
                </button>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> All transitions are colour-matched to your Harbinger flooring order.
              </p>
            </div>
          </div>
        )}
      </div>


      {/* Help Link */}
      <div className="bg-white px-6 py-3 border-t border-vfo-muted/20 text-center">
        <p className="text-xs text-vfo-bluegrey">
          Not sure what you need?{' '}
          <Link href="/accessories" className="text-vfo-accent hover:underline">
            View our full selection guide
          </Link>{' '}
          or{' '}
          <a href="sms:7788717681" className="text-vfo-accent hover:underline">
            text Ty
          </a>
        </p>
      </div>
    </div>
  );
}
