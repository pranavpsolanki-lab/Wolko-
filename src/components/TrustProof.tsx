import React from 'react';
import { BRAND_VALUES } from '../data/products';
import { PackageCheck, Feather, Sparkle, RefreshCw, ShieldCheck } from 'lucide-react';

export const TrustProof: React.FC = () => {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F5EFEB] border-t border-[#EAE2D8]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-[#8C827A] font-medium mb-2">
            Pledge & Transparency
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-[#24211E] tracking-tight mb-4">
            Made with Care. Chosen with Intention.
          </h2>
          <p className="text-sm sm:text-base text-[#6B6158] font-light">
            Every order is treated like a personal gift from our studio to your doorstep.
          </p>
        </div>

        {/* 4 Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {BRAND_VALUES.map((val) => (
            <div
              key={val.title}
              className="bg-white p-6 sm:p-7 rounded-xl border border-[#EAE2D8] flex flex-col justify-between shadow-xs hover:border-[#D9CFC4] transition-all"
            >
              <div>
                <span className="font-mono text-sm font-semibold text-[#C87D65] block mb-2">
                  {val.stat}
                </span>
                <h3 className="font-editorial text-xl text-[#24211E] font-medium mb-2">
                  {val.title}
                </h3>
                <p className="text-xs text-[#574E45] font-light leading-relaxed">
                  {val.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[#F0EBE4] text-[11px] text-[#8C827A]">
                {val.statLabel}
              </div>
            </div>
          ))}
        </div>

        {/* Studio Transparency Banner */}
        <div className="bg-white rounded-2xl border border-[#EAE2D8] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EAE2D8] flex items-center justify-center shrink-0 text-[#24211E]">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-editorial text-lg text-[#24211E] font-semibold">
                Plastic-Free Seeded Packaging
              </h4>
              <p className="text-xs text-[#6B6158] font-light">
                Our plantable seed paper tags grow into marigolds or herbs when placed in wet soil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#4A443E] font-medium shrink-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#7B8A78]" />
              <span>Safe UPI / Card Checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#7B8A78]" />
              <span>7-Day Return Window</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
