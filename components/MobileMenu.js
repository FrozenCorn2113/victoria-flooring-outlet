import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { XMarkIcon, HomeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import FocusTrap from 'focus-trap-react';

export function MobileMenu({ isOpen, onClose }) {
  const router = useRouter();
  const closeButtonRef = useRef(null);

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => onClose();
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus close button when menu opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/accessories', label: 'Accessories', icon: null },
    { href: '/trusted-installers', label: 'Installers', icon: null },
    { href: '/cart', label: 'Cart', icon: ShoppingCartIcon },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <FocusTrap active={isOpen}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-white shadow-2xl z-50 lg:hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-vfo-border/30">
            <h2
              id="mobile-menu-title"
              className="text-sm font-medium text-vfo-charcoal tracking-wide uppercase"
            >
              Menu
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 rounded-md hover:bg-vfo-sand/50 transition-colors focus:outline-none focus:ring-2 focus:ring-vfo-accent"
            >
              <XMarkIcon className="w-6 h-6 text-vfo-charcoal" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-6 py-4 text-base font-light transition-colors ${
                        isActive
                          ? 'bg-vfo-sand text-vfo-charcoal font-normal'
                          : 'text-vfo-grey hover:bg-vfo-sand/30 hover:text-vfo-charcoal'
                      }`}
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-vfo-border/30 bg-vfo-sand/20">
            <p className="text-xs text-vfo-grey text-center">
              Victoria Flooring Outlet
            </p>
            <p className="text-xs text-vfo-lightgrey text-center mt-1">
              Weekly deals on premium flooring
            </p>
          </div>
        </div>
      </FocusTrap>
    </>
  );
}
