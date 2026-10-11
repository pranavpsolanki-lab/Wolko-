import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BRAND_ASSETS } from '../data/products';

export const FinalCta: React.FC = () => {
  const scrollToCollection = () => {
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-28 sm:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#24211E] text-[#FAF8F5]">
      {/* Background with warm moody lighting */}
      <div className="absolute inset-0 z-0 opacity-25">
        <img
          src={BRAND_ASSETS.hero}
          alt="Wolko Handcrafted Woolen Lifestyle Background"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-[#24211E]/80 mix-blend-multiply" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 mb-6 bg-white/10 backdrop-blur-xs p-1">
          <img
            src={BRAND_ASSETS.logo}
            alt="Wolko Logo Emblem"
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        <div className="text-xs uppercase tracking-[0.3em] text-[#E8B4B8] font-medium mb-4">
          Heirloom Wool Objects
        </div>

        <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white mb-6 text-balance">
          Find something made for you.
        </h2>

        <p className="text-base sm:text-lg text-[#FAF8F5]/80 max-w-xl mx-auto font-light leading-relaxed mb-10 text-balance">
          Custom color combinations, bridal gifting boxes, or an everyday companion piece for your favorite coat. We hand-weave each piece upon order.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={scrollToCollection}
            className="w-full sm:w-auto px-9 py-4 bg-[#FAF8F5] hover:bg-white text-[#24211E] text-xs uppercase tracking-widest font-semibold rounded-full transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group"
          >
            <span>Shop Wolko</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <a
            href="mailto:connectwithwolko@gmail.com"
            className="w-full sm:w-auto px-8 py-4 border border-white/30 hover:border-white text-white text-xs uppercase tracking-widest font-medium rounded-full transition-all text-center"
          >
            Custom Inquiries
          </a>
        </div>
      </div>
    </section>
  );
};
