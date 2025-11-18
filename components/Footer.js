import Link from 'next/link';
import { Logo } from '@/components/index';
import { MapPinIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Footer = () => (
  <footer className="bg-vfo-charcoal text-white mt-auto">
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-20">

      {/* Top section: Logo + Trust messaging */}
      <div className="pb-12 mb-12 border-b border-white/10">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Logo />
            <p className="mt-6 text-base font-light text-white/80 leading-relaxed max-w-md">
              Premium flooring at warehouse prices. Every week, we source one exceptional deal from Harbinger Floors and pass the savings directly to you.
            </p>
          </div>
          <div className="flex flex-col md:items-end">
            <div className="space-y-3 text-sm font-light text-white/70">
              <p className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                <span>Serving Victoria, BC and Vancouver Island</span>
              </p>
              <p className="flex items-center gap-2">
                <TruckIcon className="w-4 h-4 flex-shrink-0" />
                <span>Free shipping on orders over 500 sq ft</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
                <span>Lifetime residential warranty included</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Navigation grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">

        {/* Quick Links */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-white/50 mb-4">
            Shop
          </h3>
          <ul className="space-y-3">
            <li>
              <Link href="/" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                This Week's Deal
              </Link>
            </li>
            <li>
              <Link href="/accessories" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                Accessories
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-white/50 mb-4">
            Support
          </h3>
          <ul className="space-y-3">
            <li>
              <Link href="/flooring-deals-victoria-bc" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/installing-lvp-in-victoria" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                Installation Guide
              </Link>
            </li>
            <li>
              <Link href="/harbinger-luxury-vinyl-flooring" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                About Harbinger
              </Link>
            </li>
          </ul>
        </div>

        {/* For Pros */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-white/50 mb-4">
            For Pros
          </h3>
          <ul className="space-y-3">
            <li>
              <Link href="/trusted-installers" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                Installer Network
              </Link>
            </li>
            <li>
              <a href="mailto:contractors@victoriaflooringoutlet.ca" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                Contractor Pricing
              </a>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-widest text-white/50 mb-4">
            Company
          </h3>
          <ul className="space-y-3">
            <li>
              <a href="mailto:hello@victoriaflooringoutlet.ca" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                Contact
              </a>
            </li>
            <li>
              <Link href="/privacy" className="text-sm font-light text-white/80 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Legal bar */}
      <div className="pt-8 border-t border-white/10 text-center">
        <p className="text-xs font-light text-white/50">
          &copy; {new Date().getFullYear()} Victoria Flooring Outlet. All rights reserved. · Authorized Harbinger dealer.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
