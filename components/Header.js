import Link from 'next/link';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import { formatCurrency } from '@/lib/utils';
import { Logo } from '@/components/index';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { totalPrice, cartCount } = useShoppingCart();

  return (
    <header className="sticky top-0 bg-white z-50 border-b border-vfo-border/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Top trust bar - Desktop only */}
        <div className="hidden md:flex items-center justify-between py-2.5 text-xs tracking-wide border-b border-vfo-border/20">
          <div className="flex items-center gap-6 text-vfo-grey">
            <span className="flex items-center gap-2">
              <TruckIcon className="w-3.5 h-3.5" />
              <span className="font-light">Free Shipping over 500 sq ft</span>
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span className="font-light">Lifetime Warranty</span>
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L8 7h3v5h2V7h3l-4-5zM7 13v8h10v-8h-2v6H9v-6H7z"/>
              </svg>
              <span className="font-light">Proudly Canadian</span>
            </span>
          </div>
          <div className="text-vfo-grey font-light">
            Victoria, BC
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between h-20 md:h-24 lg:h-28 xl:h-32">
          {/* Logo - Left aligned */}
          <div className="flex items-center flex-1">
            <Logo />
          </div>

          {/* Navigation - Center (Desktop only) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-light tracking-wide flex-1 justify-center">
            <Link href="/" className="text-vfo-charcoal hover:text-vfo-accent transition-colors">
              Weekly Deal
            </Link>
            <Link href="/accessories" className="text-vfo-grey hover:text-vfo-charcoal transition-colors">
              Accessories
            </Link>
            <Link href="/trusted-installers" className="text-vfo-grey hover:text-vfo-charcoal transition-colors">
              Installers
            </Link>
          </nav>

          {/* Cart - Right aligned */}
          <div className="flex items-center justify-end gap-4 flex-1">
            <Link
              href="/cart"
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
      </div>
    </header>
  );
};

export default Header;
