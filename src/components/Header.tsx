import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  MessageCircle,
  Instagram,
  Flame,
  User,
  Package,
  MapPin,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { BRAND_ASSETS } from '../data/products';
import { UserAvatar } from './UserAvatar';

export const Header: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    wishlist,
    setIsWishlistOpen,
    setIsSearchOpen,
    googleUser,
    handleGoogleLogout,
    openCustomerDashboard,
    customerOrders,
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE2D8]/80 py-3 shadow-[0_2px_12px_rgba(36,33,30,0.03)]'
            : 'bg-[#FAF8F5]/80 backdrop-blur-sm border-b border-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Zone 1: Logo & Brand Lockup */}
            <div className="flex items-center gap-3">
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('hero');
                }}
                className="group flex items-center gap-2.5 focus:outline-none"
              >
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#EAE2D8] bg-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={BRAND_ASSETS.logo}
                    alt="Wolko Handmade Artisan Studio"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-editorial text-xl sm:text-2xl font-semibold tracking-wider text-[#24211E] uppercase leading-none">
                    Wolko
                  </span>
                  <span className="text-[9px] tracking-[0.2em] uppercase text-[#8C827A] font-light mt-0.5">
                    Slow Crafted
                  </span>
                </div>
              </a>
            </div>

            {/* Zone 2: Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-[13px] tracking-wide font-medium text-[#4A443E]">
              <button
                onClick={() => scrollToSection('diwali-sale')}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-rose-500/15 border border-amber-400/50 text-[#8B2E1E] hover:text-[#701E10] font-semibold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105"
              >
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Diwali Sale</span>
                <span className="text-[9px] bg-rose-600 text-white font-mono font-bold px-1.5 py-0.2 rounded-full uppercase">
                  Offers
                </span>
              </button>

              <button
                onClick={() => scrollToSection('hero-3d-experience')}
                className="hover:text-[#24211E] transition-colors relative py-1 hover:underline underline-offset-8 decoration-[#C87D65] flex items-center gap-1.5"
              >
                <span>3D Spatial</span>
              </button>
              <button
                onClick={() => scrollToSection('collection')}
                className="hover:text-[#24211E] transition-colors relative py-1 hover:underline underline-offset-8 decoration-[#8C827A]"
              >
                Collection
              </button>
              <button
                onClick={() => scrollToSection('craft-story')}
                className="hover:text-[#24211E] transition-colors relative py-1 hover:underline underline-offset-8 decoration-[#8C827A]"
              >
                The Craft
              </button>
              <button
                onClick={() => scrollToSection('process')}
                className="hover:text-[#24211E] transition-colors relative py-1 hover:underline underline-offset-8 decoration-[#8C827A]"
              >
                Process
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="hover:text-[#24211E] transition-colors relative py-1 hover:underline underline-offset-8 decoration-[#8C827A]"
              >
                About Wolko
              </button>
            </nav>

            {/* Zone 3: Actions (Search, Account Dropdown, Wishlist, Cart) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Instagram Direct Link */}
              <a
                href="https://www.instagram.com/shop_wolko?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-[#D9CFC4] text-[#E8B4B8] hover:text-white hover:bg-[#24211E] transition-colors"
                title="Follow Wolko on Instagram @shop_wolko"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-[#4A443E] hover:text-[#24211E] transition-colors rounded-full hover:bg-[#EAE2D8]/50"
                aria-label="Search collection (⌘K)"
                title="Search collection (⌘K)"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span className="hidden lg:inline text-[10px] font-mono text-[#8C827A] px-1.5 py-0.5 rounded bg-white/70 border border-[#D9CFC4]/70">
                  ⌘K
                </span>
              </button>

              {/* YOUR ACCOUNT DROPDOWN MENU (Minimal & Essential: My Profile, Orders, Saved Addresses, Wishlist, Logout) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border border-[#D9CFC4] bg-white hover:bg-[#F5EFEB] text-[#24211E] text-xs font-medium transition-colors cursor-pointer"
                  aria-label="Your Account"
                >
                  {googleUser ? (
                    <UserAvatar
                      photoURL={googleUser.photoURL}
                      email={googleUser.email}
                      name={googleUser.displayName}
                      sizeClass="w-6 h-6"
                      textClass="text-[11px]"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-[#F5EFEB] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#24211E]" />
                    </span>
                  )}
                  <span className="hidden sm:inline max-w-[90px] truncate">
                    {googleUser?.displayName?.split(' ')[0] || 'Account'}
                  </span>
                  {customerOrders.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#24211E] text-[#FAF8F5] font-mono text-[10px] tabular-nums">
                      {customerOrders.length}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-[#8C827A]" />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-[#EAE2D8] py-3 z-50">
                    <div className="px-4 pb-3 mb-1.5 border-b border-[#EAE2D8] flex items-center gap-3">
                      <UserAvatar
                        photoURL={googleUser?.photoURL}
                        email={googleUser?.email}
                        name={googleUser?.displayName}
                        sizeClass="w-10 h-10"
                        textClass="text-sm"
                        showGoogleBadge={Boolean(googleUser)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#24211E] truncate">
                          {googleUser?.displayName || 'Your Account'}
                        </div>
                        {googleUser?.email ? (
                          <div className="text-[11px] text-[#8C827A] truncate mt-0.5">
                            {googleUser.email}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#8C827A] mt-0.5">
                            Track orders & saved address
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          openCustomerDashboard('profile');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-[#24211E] hover:bg-[#FAF8F5] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#574E45]" />
                        <span>My Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          openCustomerDashboard('orders');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-[#24211E] hover:bg-[#FAF8F5] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-[#574E45]" />
                          <span>Orders</span>
                        </span>
                        {customerOrders.length > 0 && (
                          <span className="font-mono text-[11px] font-semibold text-[#C87D65] tabular-nums">
                            {customerOrders.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          openCustomerDashboard('addresses');
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-[#24211E] hover:bg-[#FAF8F5] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-[#574E45]" />
                        <span>Saved Addresses</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          setIsWishlistOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-[#24211E] hover:bg-[#FAF8F5] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-[#574E45]" />
                          <span>Wishlist</span>
                        </span>
                        {wishlist.length > 0 && (
                          <span className="font-mono text-[11px] text-[#8C827A] tabular-nums">
                            {wishlist.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {googleUser && (
                      <div className="pt-1.5 mt-1 border-t border-[#EAE2D8]">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            handleGoogleLogout();
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsWishlistOpen(true)}
                className="p-2 text-[#4A443E] hover:text-[#24211E] transition-colors rounded-full hover:bg-[#EAE2D8]/50 relative"
                aria-label="View saved pieces"
                title="Saved pieces"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C87D65] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D9CFC4] bg-white/70 hover:bg-white text-[#24211E] transition-all shadow-xs"
                aria-label="View cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#24211E]" />
                <span className="text-xs font-mono font-medium tabular-nums">
                  {cartCount}
                </span>
              </button>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-[#4A443E] hover:text-[#24211E]"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF8F5] p-6 animate-fade-in md:hidden">
          <div className="flex items-center justify-between pb-6 border-b border-[#EAE2D8]">
            <div className="flex items-center gap-2">
              <img
                src={BRAND_ASSETS.logo}
                alt="Wolko Logo"
                className="w-8 h-8 rounded-full border border-[#EAE2D8]"
              />
              <span className="font-editorial text-xl font-semibold tracking-wider text-[#24211E]">
                WOLKO
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-[#24211E] hover:bg-[#EAE2D8]/50 rounded-full"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-3.5 py-6 text-lg font-editorial text-[#24211E]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openCustomerDashboard('orders');
              }}
              className="text-left py-2.5 px-3.5 rounded-xl bg-white border border-[#EAE2D8] text-[#24211E] flex items-center justify-between font-medium"
            >
              <span className="flex items-center gap-2.5">
                {googleUser ? (
                  <UserAvatar
                    photoURL={googleUser.photoURL}
                    email={googleUser.email}
                    name={googleUser.displayName}
                    sizeClass="w-6 h-6"
                    textClass="text-xs"
                  />
                ) : (
                  <Package className="w-4 h-4 text-[#C87D65]" />
                )}
                <span>
                  {googleUser?.displayName
                    ? `${googleUser.displayName} · Orders`
                    : 'My Account & Live Orders'}
                </span>
              </span>
              {customerOrders.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#24211E] text-white tabular-nums">
                  {customerOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => scrollToSection('diwali-sale')}
              className="text-left py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-transparent border border-amber-400/40 text-[#8B2E1E] transition-colors flex items-center justify-between font-semibold"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Shubh Diwali Specials</span>
              </span>
              <span className="text-[10px] font-sans uppercase font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white">
                Offers Active
              </span>
            </button>
            <button
              onClick={() => scrollToSection('hero-3d-experience')}
              className="text-left py-2 hover:text-[#C87D65] transition-colors border-b border-[#EAE2D8]/40 flex items-center justify-between"
            >
              <span>01. 3D Spatial Experience</span>
              <span className="text-xs uppercase font-sans tracking-widest text-[#C87D65]">
                New
              </span>
            </button>
            <button
              onClick={() => scrollToSection('collection')}
              className="text-left py-2 hover:text-[#C87D65] transition-colors border-b border-[#EAE2D8]/40"
            >
              02. Shop Collection
            </button>
            <button
              onClick={() => scrollToSection('craft-story')}
              className="text-left py-2 hover:text-[#C87D65] transition-colors border-b border-[#EAE2D8]/40"
            >
              03. The Craft Story
            </button>
            <button
              onClick={() => scrollToSection('process')}
              className="text-left py-2 hover:text-[#C87D65] transition-colors border-b border-[#EAE2D8]/40"
            >
              04. Slow Process Timeline
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 hover:text-[#C87D65] transition-colors border-b border-[#EAE2D8]/40"
            >
              05. About Our Studio
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-[#EAE2D8] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/918591542015?text=Hi%20Wolko!%20I%20have%20an%20inquiry%20about%20your%20handcrafted%20crochet%20collection."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Customer Support</span>
              </a>
              <a
                href="https://www.instagram.com/shop_wolko?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-[#D9CFC4] text-[#E8B4B8] hover:bg-[#24211E] hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
