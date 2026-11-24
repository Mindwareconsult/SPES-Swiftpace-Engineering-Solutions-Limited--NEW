import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

const NAV_LINKS = [
  { label: 'Home', to: '/', end: true },
  { label: 'About Us', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Projects', to: '/portfolio' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', to: '/faq' }
];

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06142B]/92 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 sm:gap-4 xl:gap-6">
        {/* Zone 1: Brand Emblem & Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB] rounded-lg"
          onClick={() => setMobileOpen(false)}
        >
          <BrandLogo sizeClass="w-9 h-9 sm:w-10 sm:h-10" />
          <span className="text-xs sm:text-base font-bold tracking-[0.1em] sm:tracking-[0.12em] uppercase text-white group-hover:text-[#12BCEB] transition-colors whitespace-nowrap">
            SPES Swiftpace
          </span>
        </Link>

        {/* Zone 2: Primary Desktop Navigation Links */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-4 xl:gap-6"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative py-1 text-xs xl:text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB] rounded ${
                  isActive
                    ? 'text-[#12BCEB] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-[#12BCEB] after:rounded-full'
                    : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Contact Us CTA + Responsive Mobile Drawer Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `hidden lg:inline-flex items-center justify-center rounded-lg px-4 xl:px-5 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB] ${
                isActive
                  ? 'bg-white text-[#06142B]'
                  : 'bg-[#12BCEB] hover:bg-[#29caF7] text-[#06142B]'
              }`
            }
          >
            Contact Us
          </NavLink>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-white/15 text-slate-200 hover:text-white hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB]"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="lg:hidden border-t border-white/10 bg-[#081A36] px-4 py-4 space-y-1 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain shadow-2xl shadow-black/50"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-[#12BCEB]' : 'text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="pt-2 pb-1">
            <NavLink
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-center w-full min-h-[46px] rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-white text-[#06142B]'
                    : 'bg-[#12BCEB] hover:bg-[#29caF7] text-[#06142B]'
                }`
              }
            >
              Contact Us
            </NavLink>
          </div>
        </nav>
      )}
    </header>
  );
};
