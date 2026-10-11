import React from 'react';
import { FlipText } from './ui/flip-text';

export const Marquee: React.FC = () => {
  const items = [
    'HANDMADE IN SMALL BATCHES',
    '100% PURE MERINO WOOL',
    'ETHICAL ARTISAN COMMERCE',
    'PLASTIC-FREE SEEDED PACKAGING',
    'SLOW-MADE TO STAY',
    'WOLKO STUDIO INDIA',
    'WOVEN BY HAND WITH CARE',
    'HEIRLOOM CRAFTSMANSHIP',
  ];

  return (
    <div className="py-6 bg-[#24211E] text-[#FAF8F5] overflow-hidden border-y border-[#3A3530] select-none">
      <div className="animate-marquee flex items-center gap-10">
        {/* Render twice for continuous mathematical infinite loop */}
        {[...items, ...items].map((text, idx) => (
          <div key={idx} className="flex items-center gap-10 shrink-0">
            <span className="font-editorial text-sm sm:text-base tracking-[0.22em] uppercase font-light text-[#EAE2D8]">
              <FlipText duration={3} delay={(idx % items.length) * 0.35} loop={true}>
                {text}
              </FlipText>
            </span>
            <span className="text-[#C87D65] text-xs font-serif" aria-hidden="true">
              ✦
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

