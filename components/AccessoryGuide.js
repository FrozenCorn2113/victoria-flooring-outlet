import Link from 'next/link';
import { useState } from 'react';

// SVG diagrams for transitions
const TransitionDiagram = ({ type }) => {
  const diagrams = {
    reducer: (
      <svg viewBox="0 0 200 80" className="w-full h-20">
        {/* Floor surface - higher side */}
        <rect x="0" y="30" width="80" height="20" fill="#8B7355" />
        {/* Floor surface - lower side (carpet/tile) */}
        <rect x="120" y="40" width="80" height="15" fill="#A9A9A9" />
        {/* Reducer profile */}
        <path d="M80 30 L80 50 L90 50 Q100 50 110 55 L120 55 L120 40 L110 40 Q100 40 90 35 L80 30" fill="#C4A77D" stroke="#8B7355" strokeWidth="1" />
        {/* Labels */}
        <text x="40" y="65" fontSize="8" fill="#666" textAnchor="middle">LVP Flooring</text>
        <text x="160" y="65" fontSize="8" fill="#666" textAnchor="middle">Lower Surface</text>
        <text x="100" y="20" fontSize="9" fill="#1E1A15" textAnchor="middle" fontWeight="500">Reducer</text>
      </svg>
    ),
    tmoulding: (
      <svg viewBox="0 0 200 80" className="w-full h-20">
        {/* Floor surface - left side */}
        <rect x="0" y="35" width="85" height="20" fill="#8B7355" />
        {/* Floor surface - right side */}
        <rect x="115" y="35" width="85" height="20" fill="#8B7355" />
        {/* T-Moulding profile */}
        <path d="M85 35 L85 55 L90 55 L90 45 L95 40 L105 40 L110 45 L110 55 L115 55 L115 35 L110 35 L110 30 L90 30 L90 35 L85 35" fill="#C4A77D" stroke="#8B7355" strokeWidth="1" />
        {/* Gap indication */}
        <line x1="85" y1="60" x2="115" y2="60" stroke="#999" strokeWidth="0.5" strokeDasharray="2,2" />
        {/* Labels */}
        <text x="42" y="70" fontSize="8" fill="#666" textAnchor="middle">Room 1</text>
        <text x="158" y="70" fontSize="8" fill="#666" textAnchor="middle">Room 2</text>
        <text x="100" y="20" fontSize="9" fill="#1E1A15" textAnchor="middle" fontWeight="500">T-Moulding</text>
      </svg>
    ),
    nosing: (
      <svg viewBox="0 0 200 100" className="w-full h-24">
        {/* Stair tread */}
        <rect x="20" y="30" width="120" height="15" fill="#8B7355" />
        {/* Stair riser */}
        <rect x="140" y="45" width="10" height="40" fill="#DDD" />
        {/* Lower step */}
        <rect x="150" y="70" width="50" height="15" fill="#8B7355" />
        {/* Nosing profile */}
        <path d="M135 30 L140 30 L145 30 L145 45 L140 50 Q138 52 135 52 L130 52 Q125 52 125 47 L125 30 L135 30" fill="#C4A77D" stroke="#8B7355" strokeWidth="1" />
        {/* Labels */}
        <text x="70" y="55" fontSize="8" fill="#666" textAnchor="middle">Stair Tread</text>
        <text x="135" y="20" fontSize="9" fill="#1E1A15" textAnchor="middle" fontWeight="500">Stair Nosing</text>
      </svg>
    ),
    sacnosing: (
      <svg viewBox="0 0 200 100" className="w-full h-24">
        {/* Thicker stair tread (acoustic click) */}
        <rect x="20" y="25" width="115" height="25" fill="#8B7355" />
        {/* Stair riser */}
        <rect x="135" y="50" width="15" height="40" fill="#DDD" />
        {/* Lower step */}
        <rect x="150" y="70" width="50" height="20" fill="#8B7355" />
        {/* SAC Nosing profile - square edge */}
        <path d="M125 25 L135 25 L150 25 L150 50 L140 50 L140 55 L125 55 L125 25" fill="#C4A77D" stroke="#8B7355" strokeWidth="1" />
        {/* Thickness indicator */}
        <line x1="15" y1="25" x2="15" y2="50" stroke="#999" strokeWidth="0.5" />
        <text x="12" y="40" fontSize="6" fill="#999" textAnchor="end">5mm+</text>
        {/* Labels */}
        <text x="70" y="60" fontSize="8" fill="#666" textAnchor="middle">Acoustic Click</text>
        <text x="137" y="15" fontSize="9" fill="#1E1A15" textAnchor="middle" fontWeight="500">SAC Square Nosing</text>
      </svg>
    ),
  };

  return diagrams[type] || null;
};

// Transition guide cards
const TransitionCard = ({ product }) => {
  const diagramMap = {
    'harbinger-reducer': 'reducer',
    'harbinger-t-moulding': 'tmoulding',
    'harbinger-flush-overlap-nosing': 'nosing',
    'harbinger-sac-square-nosing': 'sacnosing',
  };

  return (
    <div className="bg-white border border-vfo-muted/20 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="mb-4 bg-vfo-bg/50 rounded-lg p-3">
        <TransitionDiagram type={diagramMap[product.id]} />
      </div>
      <h3 className="font-semibold text-vfo-slate text-lg mb-2">{product.name.replace('Harbinger ', '')}</h3>
      {product.useWhen && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs font-medium text-amber-900 mb-1">Use this when:</p>
          <p className="text-sm text-amber-800">{product.useWhen}</p>
        </div>
      )}
      <p className="text-sm text-vfo-bluegrey mb-3">{product.description}</p>
      <div className="text-xs text-vfo-muted">
        Size: {product.specifications?.length} x {product.specifications?.width}
      </div>
      <Link
        href={`/products/${product.id}`}
        className="mt-4 inline-block text-sm font-medium text-vfo-accent hover:text-teal-600 transition-colors"
      >
        View Details →
      </Link>
    </div>
  );
};

// Adhesive comparison card
const AdhesiveCard = ({ product, isRecommended }) => {
  return (
    <div className={`bg-white border rounded-xl p-5 hover:shadow-md transition-shadow ${isRecommended ? 'border-vfo-accent border-2' : 'border-vfo-muted/20'}`}>
      {isRecommended && (
        <div className="mb-3 -mt-2">
          <span className="inline-block px-2 py-1 text-xs font-semibold bg-vfo-accent text-white rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="font-semibold text-vfo-slate text-lg mb-1">{product.name.split(' - ')[0]}</h3>
      <p className="text-sm text-vfo-bluegrey mb-3">{product.shortTagline}</p>
      
      {product.chooseThisIf && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-100 rounded-lg">
          <p className="text-xs font-medium text-teal-900 mb-1">Choose this if:</p>
          <p className="text-sm text-teal-800">{product.chooseThisIf}</p>
        </div>
      )}

      {product.bestFor && (
        <div className="mb-4">
          <p className="text-xs font-medium text-vfo-muted uppercase tracking-wide mb-2">Best for:</p>
          <ul className="space-y-1">
            {product.bestFor.map((item, idx) => (
              <li key={idx} className="text-sm text-vfo-bluegrey flex items-start gap-2">
                <span className="text-vfo-accent mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-3 border-t border-vfo-muted/20 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-vfo-muted">Coverage:</span>
          <span className="font-medium text-vfo-slate">{product.coverage?.sqFtPerUnit || '~150'} sq ft</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-vfo-muted">Price:</span>
          <span className="font-medium text-vfo-slate">${(product.price / 100).toFixed(2)}</span>
        </div>
      </div>

      <Link
        href={`/products/${product.id}`}
        className="mt-4 block w-full text-center py-2 px-4 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium text-sm rounded-lg transition-colors"
      >
        View Details
      </Link>
    </div>
  );
};

// Main AccessoryGuide component
export default function AccessoryGuide({ products }) {
  const [activeTab, setActiveTab] = useState('transitions');

  // Filter products by type
  const transitions = products.filter(p => p.type === 'Accessory' && p.subType === 'Trim');
  const adhesives = products.filter(p => p.type === 'Accessory' && p.subType === 'Adhesive');

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-vfo-muted/20">
        <button
          onClick={() => setActiveTab('transitions')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'transitions'
              ? 'border-vfo-accent text-vfo-accent'
              : 'border-transparent text-vfo-bluegrey hover:text-vfo-slate'
          }`}
        >
          Transitions & Nosings
        </button>
        <button
          onClick={() => setActiveTab('adhesives')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'adhesives'
              ? 'border-vfo-accent text-vfo-accent'
              : 'border-transparent text-vfo-bluegrey hover:text-vfo-slate'
          }`}
        >
          Adhesives
        </button>
      </div>

      {/* Transitions Tab */}
      {activeTab === 'transitions' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-vfo-slate mb-2">Transitions & Nosings Guide</h2>
            <p className="text-vfo-bluegrey">
              Transitions give your flooring a clean, professional finish where it meets other surfaces. 
              Choose based on where you need them in your space.
            </p>
          </div>

          {/* Quick Reference */}
          <div className="mb-8 p-4 bg-vfo-bg rounded-xl">
            <h3 className="font-semibold text-vfo-slate mb-3">Quick Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-medium text-vfo-charcoal min-w-[100px]">Reducer:</span>
                <span className="text-vfo-bluegrey">Flooring → lower surface (carpet, tile, door)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-vfo-charcoal min-w-[100px]">T-Moulding:</span>
                <span className="text-vfo-bluegrey">Same-height floors in doorways</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-vfo-charcoal min-w-[100px]">Flush Nosing:</span>
                <span className="text-vfo-bluegrey">Stairs and exposed edges</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-vfo-charcoal min-w-[100px]">SAC Nosing:</span>
                <span className="text-vfo-bluegrey">Stairs with thicker click flooring</span>
              </div>
            </div>
          </div>

          {/* Transition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {transitions.map(product => (
              <TransitionCard key={product.id} product={product} />
            ))}
          </div>

          {/* Note about tracks */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <h4 className="font-medium text-blue-900 mb-2">About Tracks</h4>
            <p className="text-sm text-blue-800">
              T-Mouldings and Reducers come with either a <strong>shallow track</strong> (for glue-down flooring) 
              or <strong>deep track</strong> (for click flooring). The correct track is automatically matched 
              to your flooring thickness when you order.
            </p>
          </div>
        </div>
      )}

      {/* Adhesives Tab */}
      {activeTab === 'adhesives' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-vfo-slate mb-2">Adhesive Selection Guide</h2>
            <p className="text-vfo-bluegrey">
              The right adhesive depends on your space, subfloor type, and how the floor will be used. 
              Here's how to choose.
            </p>
          </div>

          {/* Decision Helper */}
          <div className="mb-8 p-5 bg-vfo-bg rounded-xl">
            <h3 className="font-semibold text-vfo-slate mb-4">Which adhesive do I need?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-lg">🏠</span>
                <div>
                  <p className="font-medium text-vfo-charcoal">Standard home install (bedrooms, living rooms, basements)?</p>
                  <p className="text-vfo-bluegrey">→ <strong>KE 2000 S</strong> – Easy to use, quick drying, works on most substrates</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-lg">🪑</span>
                <div>
                  <p className="font-medium text-vfo-charcoal">High-traffic area with rolling chairs or heavy furniture?</p>
                  <p className="text-vfo-bluegrey">→ <strong>KE 66</strong> – Fiber-reinforced for extra hold, resists indentations</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-lg">🏭</span>
                <div>
                  <p className="font-medium text-vfo-charcoal">Commercial kitchen, warehouse, or extreme conditions?</p>
                  <p className="text-vfo-bluegrey">→ <strong>KR 430</strong> – Maximum strength, handles rolling loads and temperature extremes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Adhesive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adhesives.map(product => (
              <AdhesiveCard
                key={product.id}
                product={product}
                isRecommended={product.id === 'uzin_ke_2000_s'}
              />
            ))}
          </div>

          {/* Coverage Calculator Note */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <h4 className="font-medium text-amber-900 mb-2">How much do I need?</h4>
            <p className="text-sm text-amber-800">
              Coverage varies by trowel size and substrate. As a general guide, plan for <strong>1 gallon per 100-150 sq ft</strong>. 
              When in doubt, it's better to have a little extra than to run short mid-install.
            </p>
          </div>
        </div>
      )}

      {/* Need Help CTA */}
      <div className="mt-8 p-6 bg-vfo-slate rounded-xl text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Still not sure what you need?</h3>
        <p className="text-white/80 mb-4">
          Text or call Ty – he's happy to help you figure out the right accessories for your project.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="sms:7788717681"
            className="inline-flex items-center justify-center px-6 py-3 bg-vfo-accent hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
          >
            Text Ty
          </a>
          <a
            href="tel:7788717681"
            className="inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          >
            Call (778) 871-7681
          </a>
        </div>
      </div>
    </div>
  );
}

// Export individual components for use elsewhere
export { TransitionCard, AdhesiveCard, TransitionDiagram };
