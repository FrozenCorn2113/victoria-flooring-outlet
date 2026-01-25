import { useState, useMemo } from 'react';
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

// Transition products
const TRANSITIONS = {
  tMoulding: getProduct('harbinger-t-moulding'),
  reducer: getProduct('harbinger-reducer'),
  flushNosing: getProduct('harbinger-flush-overlap-nosing'),
  sacNosing: getProduct('harbinger-sac-square-nosing'),
};

// Mini SVG diagrams for transitions
const TransitionDiagram = ({ type }) => {
  const diagrams = {
    tMoulding: (
      <svg viewBox="0 0 120 50" className="w-full h-12">
        <rect x="5" y="20" width="45" height="12" fill="#8B7355" />
        <rect x="70" y="20" width="45" height="12" fill="#8B7355" />
        <path d="M50 20 L50 32 L55 32 L55 26 L58 23 L62 23 L65 26 L65 32 L70 32 L70 20 L65 20 L65 17 L55 17 L55 20 L50 20" fill="#C4A77D" stroke="#8B7355" strokeWidth="0.5" />
        <text x="60" y="45" fontSize="6" fill="#666" textAnchor="middle">Doorway</text>
      </svg>
    ),
    reducer: (
      <svg viewBox="0 0 120 50" className="w-full h-12">
        <rect x="5" y="18" width="50" height="12" fill="#8B7355" />
        <rect x="70" y="24" width="45" height="8" fill="#A9A9A9" />
        <path d="M55 18 L55 30 L60 30 Q65 30 68 32 L70 32 L70 24 L68 24 Q65 24 62 22 L55 18" fill="#C4A77D" stroke="#8B7355" strokeWidth="0.5" />
        <text x="30" y="45" fontSize="6" fill="#666" textAnchor="middle">LVP</text>
        <text x="92" y="45" fontSize="6" fill="#666" textAnchor="middle">Carpet/Tile</text>
      </svg>
    ),
    nosing: (
      <svg viewBox="0 0 120 60" className="w-full h-14">
        <rect x="10" y="15" width="60" height="10" fill="#8B7355" />
        <rect x="70" y="25" width="8" height="25" fill="#DDD" />
        <rect x="78" y="40" width="35" height="10" fill="#8B7355" />
        <path d="M65 15 L70 15 L75 15 L75 25 L72 28 Q70 30 68 30 L65 30 Q62 30 62 27 L62 15 L65 15" fill="#C4A77D" stroke="#8B7355" strokeWidth="0.5" />
        <text x="40" y="55" fontSize="6" fill="#666" textAnchor="middle">Stair</text>
      </svg>
    ),
  };
  return diagrams[type] || null;
};

// Adhesive option card
const AdhesiveOption = ({ adhesive, isSelected, onSelect, sqFt }) => {
  const unitsNeeded = Math.ceil(sqFt / (adhesive?.coverage?.sqFtPerUnit || 150));
  const totalPrice = unitsNeeded * (adhesive?.price || 0);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-vfo-accent bg-teal-50'
          : 'border-vfo-muted/30 hover:border-vfo-muted/50 bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-vfo-slate text-sm">{adhesive?.name?.split(' - ')[0]}</h4>
        {isSelected && (
          <span className="text-xs bg-vfo-accent text-white px-2 py-0.5 rounded-full">Selected</span>
        )}
      </div>
      <p className="text-xs text-vfo-bluegrey mb-2">{adhesive?.chooseThisIf}</p>
      {sqFt > 0 && (
        <div className="pt-2 border-t border-vfo-muted/20">
          <div className="flex justify-between text-xs">
            <span className="text-vfo-muted">For {sqFt} sq ft:</span>
            <span className="font-medium text-vfo-slate">
              {unitsNeeded} {unitsNeeded === 1 ? 'unit' : 'units'} = {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>
      )}
    </button>
  );
};

// Transition input row
const TransitionInput = ({ label, description, diagram, value, onChange, pricePerUnit }) => {
  const total = value * pricePerUnit;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-lg border border-vfo-muted/20">
      <div className="flex-shrink-0 w-24">
        <TransitionDiagram type={diagram} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-vfo-slate text-sm">{label}</h4>
        <p className="text-xs text-vfo-bluegrey">{description}</p>
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

export default function ProjectAccessoriesCalculator({ sqFt = 0, flooringProduct }) {
  const { addItem } = useShoppingCart();
  const [activeTab, setActiveTab] = useState('adhesive');
  const [selectedAdhesive, setSelectedAdhesive] = useState('standard');
  const [addingItems, setAddingItems] = useState(false);
  
  // Transition quantities
  const [tMouldingQty, setTMouldingQty] = useState(0);
  const [reducerQty, setReducerQty] = useState(0);
  const [stairSteps, setStairSteps] = useState(0);

  // Calculate nosing pieces from stair steps (1 piece covers ~3 steps)
  const nosingPieces = Math.ceil(stairSteps / 3);

  // Get selected adhesive details
  const adhesive = ADHESIVES[selectedAdhesive];
  const adhesiveUnits = sqFt > 0 ? Math.ceil(sqFt / (adhesive?.coverage?.sqFtPerUnit || 150)) : 0;
  const adhesiveTotal = adhesiveUnits * (adhesive?.price || 0);

  // Calculate transitions total
  const transitionPrice = TRANSITIONS.tMoulding?.price || 5500;
  const tMouldingTotal = tMouldingQty * transitionPrice;
  const reducerTotal = reducerQty * transitionPrice;
  const nosingTotal = nosingPieces * transitionPrice;
  const transitionsTotal = tMouldingTotal + reducerTotal + nosingTotal;

  // Grand total
  const grandTotal = adhesiveTotal + transitionsTotal;

  // Items to add to cart
  const itemsToAdd = useMemo(() => {
    const items = [];
    
    if (adhesiveUnits > 0 && adhesive) {
      items.push({ product: adhesive, quantity: adhesiveUnits });
    }
    
    if (tMouldingQty > 0 && TRANSITIONS.tMoulding) {
      items.push({ product: TRANSITIONS.tMoulding, quantity: tMouldingQty });
    }
    
    if (reducerQty > 0 && TRANSITIONS.reducer) {
      items.push({ product: TRANSITIONS.reducer, quantity: reducerQty });
    }
    
    if (nosingPieces > 0 && TRANSITIONS.flushNosing) {
      items.push({ product: TRANSITIONS.flushNosing, quantity: nosingPieces });
    }
    
    return items;
  }, [adhesiveUnits, adhesive, tMouldingQty, reducerQty, nosingPieces]);

  const handleAddAllToCart = () => {
    if (itemsToAdd.length === 0) return;
    
    setAddingItems(true);
    itemsToAdd.forEach(({ product, quantity }) => {
      addItem(product, quantity);
    });
    
    setTimeout(() => setAddingItems(false), 1500);
  };

  const handleAddAdhesiveToCart = () => {
    if (adhesiveUnits > 0 && adhesive) {
      addItem(adhesive, adhesiveUnits);
    }
  };

  const handleAddTransitionsToCart = () => {
    if (tMouldingQty > 0 && TRANSITIONS.tMoulding) {
      addItem(TRANSITIONS.tMoulding, tMouldingQty);
    }
    if (reducerQty > 0 && TRANSITIONS.reducer) {
      addItem(TRANSITIONS.reducer, reducerQty);
    }
    if (nosingPieces > 0 && TRANSITIONS.flushNosing) {
      addItem(TRANSITIONS.flushNosing, nosingPieces);
    }
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
          {adhesiveTotal > 0 && (
            <span className="ml-2 text-xs bg-vfo-accent/10 text-vfo-accent px-2 py-0.5 rounded-full">
              {formatCurrency(adhesiveTotal)}
            </span>
          )}
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
              <AdhesiveOption
                adhesive={ADHESIVES.standard}
                isSelected={selectedAdhesive === 'standard'}
                onSelect={() => setSelectedAdhesive('standard')}
                sqFt={sqFt}
              />
              <AdhesiveOption
                adhesive={ADHESIVES.highTraffic}
                isSelected={selectedAdhesive === 'highTraffic'}
                onSelect={() => setSelectedAdhesive('highTraffic')}
                sqFt={sqFt}
              />
              <AdhesiveOption
                adhesive={ADHESIVES.commercial}
                isSelected={selectedAdhesive === 'commercial'}
                onSelect={() => setSelectedAdhesive('commercial')}
                sqFt={sqFt}
              />
            </div>

            {sqFt > 0 && adhesiveUnits > 0 && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-vfo-muted/20">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-medium text-vfo-slate">{adhesive?.name}</p>
                    <p className="text-sm text-vfo-bluegrey">
                      {adhesiveUnits} {adhesiveUnits === 1 ? 'unit' : 'units'} × {formatCurrency(adhesive?.price || 0)}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-vfo-slate">{formatCurrency(adhesiveTotal)}</p>
                </div>
                <button
                  onClick={handleAddAdhesiveToCart}
                  className="w-full py-2.5 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-lg transition-colors"
                >
                  Add Adhesive to Cart
                </button>
              </div>
            )}

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
                Enter the number of each transition type for your project. Each piece is 7ft long and costs $55.
              </p>
            </div>

            <div className="space-y-3">
              <TransitionInput
                label="T-Moulding"
                description="Doorways between rooms with same-height floors"
                diagram="tMoulding"
                value={tMouldingQty}
                onChange={setTMouldingQty}
                pricePerUnit={transitionPrice}
              />
              <TransitionInput
                label="Reducer"
                description="Transitions to carpet, tile, or lower surfaces"
                diagram="reducer"
                value={reducerQty}
                onChange={setReducerQty}
                pricePerUnit={transitionPrice}
              />
              <div className="p-4 bg-white rounded-lg border border-vfo-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-shrink-0 w-24">
                    <TransitionDiagram type="nosing" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-vfo-slate text-sm">Stair Nosing</h4>
                    <p className="text-xs text-vfo-bluegrey">For stairs and step-downs (1 piece covers ~3 steps)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStairSteps(Math.max(0, stairSteps - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <input
                        type="number"
                        min="0"
                        value={stairSteps}
                        onChange={(e) => setStairSteps(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 text-center py-1.5 border border-vfo-muted/30 rounded-lg text-vfo-slate font-medium focus:outline-none focus:ring-2 focus:ring-vfo-accent"
                      />
                      <p className="text-[10px] text-vfo-muted mt-0.5">steps</p>
                    </div>
                    <button
                      onClick={() => setStairSteps(stairSteps + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-vfo-muted/30 hover:border-vfo-accent hover:bg-vfo-accent/5 text-vfo-slate font-medium"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    {nosingPieces > 0 ? (
                      <div>
                        <span className="font-medium text-vfo-slate">{formatCurrency(nosingTotal)}</span>
                        <p className="text-[10px] text-vfo-muted">{nosingPieces} {nosingPieces === 1 ? 'piece' : 'pieces'}</p>
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
                  {nosingPieces > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-vfo-bluegrey">{nosingPieces}× Stair Nosing ({stairSteps} steps)</span>
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
                  className="w-full py-2.5 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-lg transition-colors"
                >
                  Add Transitions to Cart
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

      {/* Grand Total Footer */}
      {grandTotal > 0 && (
        <div className="bg-vfo-slate px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm">Total Accessories</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(grandTotal)}</p>
            </div>
            <button
              onClick={handleAddAllToCart}
              disabled={addingItems || itemsToAdd.length === 0}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                addingItems
                  ? 'bg-green-500 text-white'
                  : 'bg-vfo-accent hover:bg-teal-600 text-white'
              }`}
            >
              {addingItems ? 'Added!' : `Add All ${itemsToAdd.length} Items to Cart`}
            </button>
          </div>
        </div>
      )}

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
