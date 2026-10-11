import React from 'react';
import { Sparkle } from 'lucide-react';
import { FlipText } from './ui/flip-text';

export const BrandStatement: React.FC = () => {
  return (
    <section id="brand-statement" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] border-y border-[#EAE2D8]/80">
      <div className="max-w-4xl mx-auto text-center">
        {/* Subtle decorative motif */}
        <div className="inline-flex items-center justify-center p-2 mb-8 text-[#C87D65]">
          <Sparkle className="w-5 h-5 opacity-80" />
        </div>

        {/* Big Editorial Quote */}
        <blockquote className="font-editorial text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#24211E] font-normal leading-tight tracking-tight text-balance mb-8">
          “<FlipText duration={3.5} delay={0.4} loop={true}>Small details. Slow hands.</FlipText> <br className="hidden sm:inline" />
          <span className="italic text-[#7B8A78]">Something made just for you.”</span>
        </blockquote>


        {/* Narrative */}
        <p className="text-base sm:text-lg text-[#574E45] max-w-2xl mx-auto font-light leading-relaxed">
          In an era of mass-produced plastic objects, Wolko honors the quiet luxury of natural fibers, manual stitch-work, and personal intention. Every piece carries the warmth of the hands that held it first.
        </p>

        {/* Three quiet brand tenets */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-[#EAE2D8]">
          <div className="text-center">
            <span className="block font-editorial text-2xl text-[#24211E] mb-1">Pure Wool</span>
            <span className="text-xs text-[#8C827A] tracking-wider uppercase">Natural, Unbleached Fibers</span>
          </div>
          <div className="text-center">
            <span className="block font-editorial text-2xl text-[#24211E] mb-1">Zero Machine Speed</span>
            <span className="text-xs text-[#8C827A] tracking-wider uppercase">Finger-Knitted & Embroidered</span>
          </div>
          <div className="text-center">
            <span className="block font-editorial text-2xl text-[#24211E] mb-1">Seeded Paper</span>
            <span className="text-xs text-[#8C827A] tracking-wider uppercase">Plantable Packaging</span>
          </div>
        </div>
      </div>
    </section>
  );
};
