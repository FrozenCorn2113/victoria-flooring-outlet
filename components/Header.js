import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import { formatCurrency } from '@/lib/utils';
import { Logo } from '@/components/index';
import { ShoppingCartIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { MobileMenu } from './MobileMenu';

const Header = () => {
  const { totalPrice, cartDetails } = useShoppingCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Calculate actual item count (boxes for flooring, units for accessories)
  const cartCount = useMemo(() => {
    return Object.values(cartDetails || {}).reduce((count, item) => {
      if (item.pricePerSqFt && item.coverageSqFtPerBox) {
        // Flooring: count boxes
        return count + Math.ceil(item.quantity / item.coverageSqFtPerBox);
      }
      // Accessories: count units
      return count + item.quantity;
    }, 0);
  }, [cartDetails]);

  return (
    <header className="sticky top-0 bg-white z-50 border-b border-vfo-border/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Top trust bar - Desktop only */}
        <div className="hidden md:flex items-center justify-center py-2.5 text-xs tracking-wide border-b border-vfo-border/20">
          <div className="flex items-center gap-6 text-vfo-grey">
            <span className="flex items-center gap-2">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span className="font-light">Lifetime Warranty</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">🇨🇦</span>
              <span className="font-light">Proudly Canadian</span>
            </span>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between h-20 md:h-24 lg:h-28 xl:h-32">
          {/* Logo - Left aligned */}
          <div className="flex items-center flex-1">
            <Logo />
          </div>

          {/* Cart and Navigation - Right aligned */}
          <div className="flex items-center justify-end gap-4 sm:gap-6 flex-1">
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6 text-sm font-light tracking-wide">
              <Link href="/accessories" className="text-vfo-grey hover:text-vfo-charcoal transition-colors">
                Accessories
              </Link>
              <Link href="/trusted-installers" className="text-vfo-grey hover:text-vfo-charcoal transition-colors">
                Installers
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 rounded-md hover:bg-vfo-sand/50 transition-colors text-vfo-charcoal"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <Link
              href="/cart"
              aria-label={cartCount > 0 ? `View cart: ${cartCount} ${cartCount === 1 ? 'item' : 'items'}, ${formatCurrency(totalPrice)}` : 'View cart'}
              className="flex items-center gap-3 text-vfo-charcoal hover:text-vfo-accent transition-colors group"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              {cartCount > 0 && (
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium">{formatCurrency(totalPrice)}</span>
                  <span className="text-xs text-vfo-lightgrey">({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                </div>
              )}
              {cartCount > 0 && (
                <span className="sm:hidden inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-vfo-accent rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </div>
    </header>
  );
};

export default Header;
