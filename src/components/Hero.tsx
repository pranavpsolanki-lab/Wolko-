import React from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { BRAND_ASSETS } from '../data/products';
import { SharedTooltipAvatars, AvatarItem } from './ui/shared-tooltip-avatars';

const TRUST_AVATARS: AvatarItem[] = [
  {
    id: '1',
    name: 'Priya M. (Mumbai) — "Cloud Tote is so soft & sturdy! ★★★★★"',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80',
  },
  {
    id: '2',
    name: 'Aarav K. (Bengaluru) — "Fast delivery & seed paper packaging ★★★★★"',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=140&q=80',
  },
  {
    id: '3',
    name: 'Devanshi R. (Delhi) — "Daisy charm gets compliments everywhere ★★★★★"',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=140&q=80',
  },
  {
    id: '4',
    name: 'Kabir N. (Pune) — "Botanical Gift Box was breathtaking ★★★★★"',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=140&q=80',
  },
  {
    id: '5',
    name: 'Sanjana V. (Jaipur) — "Real slow-crafted wool warmth ★★★★★"',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=140&q=80',
  },
];

export const Hero: React.FC = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#FAF8F5]">
      {/* Background Lifestyle Image with warm tactile gradient overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={BRAND_ASSETS.hero}
          alt="Wolko Artisan Workshop Studio Table with Handcrafted Wool Products"
          className="w-full h-full object-cover object-center brightness-[0.92] contrast-[1.03] scale-100 sm:scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Editorial gradient scrim: warm ivory top and base fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/60 to-[#FAF8F5]/80" />
        <div className="absolute inset-0 bg-[#24211E]/10 mix-blend-multiply" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        {/* Quiet Brand Kicker - Unboxed clean metadata */}
        <div className="flex items-center gap-3 text-xs sm:text-sm tracking-[0.25em] uppercase text-[#6B6158] font-medium mb-6">
          <span>Artisan Studio</span>
          <span aria-hidden="true">·</span>
          <span>Small Batch Wool</span>
          <span aria-hidden="true">·</span>
          <span>Est. India</span>
        </div>

        {/* Primary Editorial Headline */}
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#24211E] tracking-tight leading-[1.08] max-w-4xl mb-6 text-balance">
          Woven by hand. <br />
          <span className="italic font-light text-[#574E45]">Made to stay.</span>
        </h1>

        {/* Supporting Narrative */}
        <p className="text-base sm:text-lg md:text-xl text-[#4A443E] max-w-2xl font-light leading-relaxed mb-10 text-balance">
          Thoughtfully crafted wool pieces, everyday carry bags, and delicate botanical charms — created slowly with warmth, patience, and a human touch.
        </p>

        {/* Primary & Secondary Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => scrollTo('collection')}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#24211E] hover:bg-[#3A3530] text-[#FAF8F5] text-sm tracking-wide font-medium rounded-full transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group"
          >
            <span>Explore Collection</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={() => scrollTo('hero-3d-experience')}
            className="w-full sm:w-auto px-8 py-3.5 bg-white/80 hover:bg-white text-[#24211E] text-sm tracking-wide font-medium rounded-full border border-[#D9CFC4] transition-all duration-200 shadow-xs flex items-center justify-center gap-2"
          >
            <span>3D Spatial Experience</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C87D65] animate-pulse" />
          </button>
        </div>

        {/* Social Proof Trust Layer with SharedTooltipAvatars */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-[#EAE2D8] shadow-xs">
          <div className="flex items-center">
            <SharedTooltipAvatars items={TRUST_AVATARS} className="py-1" />
          </div>
          <div className="text-center sm:text-left sm:border-l sm:border-[#EAE2D8] sm:pl-4">
            <div className="flex items-center justify-center sm:justify-start gap-1 text-[#C87D65] text-xs">
              <span>★★★★★</span>
              <span className="font-mono text-xs font-semibold text-[#24211E] ml-1">4.9/5</span>
            </div>
            <p className="text-[11px] text-[#6B6158] font-light">
              Trusted by <strong>1,280+ patrons</strong> across India · 100% Handcrafted
            </p>
          </div>
        </div>

        {/* Subtle Scroll Cue */}
        <button
          onClick={() => scrollTo('hero-3d-experience')}
          className="mt-12 flex flex-col items-center gap-2 text-xs text-[#8C827A] hover:text-[#24211E] transition-colors focus:outline-none"
          aria-label="Scroll to discover 3D experience"
        >
          <span className="tracking-widest uppercase text-[10px]">Discover 3D Craft</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
};

