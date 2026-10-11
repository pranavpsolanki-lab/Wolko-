import React from 'react';
import { BRAND_ASSETS } from '../data/products';
import { Mail, Phone, Instagram, Youtube, Pin as Pinterest, Facebook, Heart, MessageCircle, Lock } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Footer: React.FC = () => {
  const { setIsAdminOpen } = useShop();
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-[#1C1A18] text-[#FAF8F5] pt-16 sm:pt-20 pb-12 border-t border-[#2E2A27]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-[#2E2A27]">
          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#3E3834] bg-[#2E2A27]">
                <img
                  src={BRAND_ASSETS.logo}
                  alt="Wolko Handcrafted Studio"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-editorial text-2xl font-semibold tracking-wider text-white uppercase block leading-none">
                  Wolko
                </span>
                <span className="text-[10px] tracking-[0.25em] text-[#8C827A] uppercase font-light">
                  Handcrafted Lifestyle
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#A89E96] font-light leading-relaxed max-w-sm mb-6">
              Thoughtfully crafted wool pieces, cozy accessories, and slow-made botanical creations made with warmth, patience, and genuine care.
            </p>

            <div className="flex items-center gap-3">
              {/* Instagram direct connect */}
              <a
                href="https://www.instagram.com/shop_wolko?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-[#3A3530] bg-[#24211E] flex items-center justify-center text-[#E8B4B8] hover:text-white hover:border-[#E8B4B8] hover:bg-[#E8B4B8]/20 transition-all shadow-xs"
                title="Follow @shop_wolko on Instagram"
                aria-label="Instagram @shop_wolko"
              >
                <Instagram className="w-4 h-4" />
              </a>

              {/* WhatsApp direct chat */}
              <a
                href="https://wa.me/918237323043?text=Hi%20Wolko!%20I%20have%20an%20inquiry%20about%20your%20handcrafted%20crochet%20collection."
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-[#25D366]/40 bg-[#25D366]/15 flex items-center justify-center text-[#25D366] hover:text-white hover:bg-[#25D366] transition-all shadow-xs"
                title="Chat with Wolko on WhatsApp (+91 82373 23043)"
                aria-label="WhatsApp (+91 82373 23043)"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#3A3530] flex items-center justify-center text-[#A89E96] hover:text-white hover:border-[#E8B4B8] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#3A3530] flex items-center justify-center text-[#A89E96] hover:text-white hover:border-[#E8B4B8] transition-colors"
                aria-label="Pinterest"
              >
                <Pinterest className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#3A3530] flex items-center justify-center text-[#A89E96] hover:text-white hover:border-[#E8B4B8] transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Column (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs uppercase tracking-widest text-white font-medium mb-4">
              Catalog
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A89E96]">
              <li>
                <button
                  onClick={() => scrollTo('collection')}
                  className="hover:text-white transition-colors"
                >
                  All Wool Pieces
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection')}
                  className="hover:text-white transition-colors"
                >
                  Chunky Knit Totes
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection')}
                  className="hover:text-white transition-colors"
                >
                  Botanical Charms
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection')}
                  className="hover:text-white transition-colors"
                >
                  Embroidered Pouches
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('collection')}
                  className="hover:text-white transition-colors"
                >
                  Gift Sets & Trios
                </button>
              </li>
            </ul>
          </div>

          {/* About Column (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs uppercase tracking-widest text-white font-medium mb-4">
              Atelier
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A89E96]">
              <li>
                <button
                  onClick={() => scrollTo('about')}
                  className="hover:text-white transition-colors"
                >
                  Our Philosophy
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('process')}
                  className="hover:text-white transition-colors"
                >
                  The Craft Steps
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('about')}
                  className="hover:text-white transition-colors"
                >
                  Artisan Network
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('brand-statement')}
                  className="hover:text-white transition-colors"
                >
                  Slow Living
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('contact')}
                  className="hover:text-white transition-colors"
                >
                  Custom Compositions
                </button>
              </li>
            </ul>
          </div>

          {/* Help Column (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs uppercase tracking-widest text-white font-medium mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A89E96]">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Track Order
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Shipping Policy
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Wool Care Guide
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Returns & Exchanges
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Privacy & Terms
                </span>
              </li>
            </ul>
          </div>

          {/* Direct Studio Contact (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs uppercase tracking-widest text-white font-medium mb-4">
              Direct Inquiries
            </h4>
            <div className="space-y-3 text-xs text-[#A89E96]">
              <div>
                <span className="text-[10px] text-[#7B8A78] uppercase block">Email Us</span>
                <a
                  href="mailto:connectwithwolko@gmail.com"
                  className="hover:text-white transition-colors break-words font-light"
                >
                  connectwithwolko@gmail.com
                </a>
              </div>
              <div>
                <span className="text-[10px] text-[#7B8A78] uppercase block">WhatsApp Orders & Support</span>
                <div className="flex flex-col gap-1 mt-0.5">
                  <a
                    href="https://wa.me/918237323043?text=Hi%20Wolko!%20I%20have%20an%20inquiry%20about%20your%20handcrafted%20crochet%20collection."
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#25D366] transition-colors font-mono tabular-nums font-medium flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                    <span>+91 82373 23043</span>
                    <span className="text-[9px] text-[#A89E96] font-sans font-light">(Primary)</span>
                  </a>
                  <a
                    href="https://wa.me/918591542015?text=Hi%20Wolko!%20Connecting%20regarding%20orders%20and%20support."
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#25D366] transition-colors font-mono tabular-nums font-medium flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C827A]" />
                    <span>+91 8591542015</span>
                    <span className="text-[9px] text-[#A89E96] font-sans font-light">(Dispatch)</span>
                  </a>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-[#7B8A78] uppercase block">Hours</span>
                <span className="font-light">Mon – Sat, 10 AM – 7 PM IST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7B736B]">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} Wolko Studio. All rights reserved.</span>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] text-[#5C554E] hover:text-[#A89E96] transition-colors"
              title="Admin Backend & Google Sheets Console"
            >
              <Lock className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span>Crafted with patience & natural fibers in India</span>
            <Heart className="w-3 h-3 text-[#E8B4B8] fill-current inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};
