import React from 'react';
import { BRAND_ASSETS } from '../data/products';
import { ArrowUpRight } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Editorial Photographic Composition (6 cols) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#EAE2D8] bg-[#F5EFEB] shadow-sm">
              <img
                src={BRAND_ASSETS.hero}
                alt="Wolko Artisan Studio Workbench"
                className="w-full aspect-[4/5] object-cover"
              />
            </div>

            {/* Overlapping small accent card */}
            <div className="absolute -bottom-6 -right-4 sm:-right-6 max-w-xs bg-white p-5 rounded-xl border border-[#EAE2D8] shadow-md hidden sm:block">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={BRAND_ASSETS.logo}
                  alt="Wolko Brandmark"
                  className="w-9 h-9 rounded-full border border-[#EAE2D8]"
                />
                <div>
                  <h4 className="font-editorial text-sm font-semibold text-[#24211E]">
                    The Wolko Atelier
                  </h4>
                  <p className="text-[10px] text-[#8C827A] uppercase tracking-wider">
                    Handmade in India
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#574E45] font-light leading-relaxed">
                “Every skein of wool has a voice. We just give it time to speak.”
              </p>
            </div>
          </div>

          {/* Narrative Column (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-[0.25em] text-[#8C827A] font-medium mb-3">
              The Origin Story
            </div>

            <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#24211E] font-normal tracking-tight leading-[1.12] mb-6">
              More than handmade. <br />
              <span className="italic text-[#7B8A78]">A slower way of living.</span>
            </h2>

            <div className="space-y-4 text-base text-[#574E45] font-light leading-relaxed mb-8">
              <p>
                Wolko was founded with an honest devotion to tactile, cozy objects. In a marketplace dominated by synthetics and rushed manufacturing, we set out to build an atelier where hours are spent shaping a single handle or perfecting the petal contour of a wool charm.
              </p>
              <p>
                We collaborate with passionate women artisans across India, providing dignified living wages and the creative freedom to practice generational textile skills. When you carry a Wolko bag or touch one of our botanical keychains, you are holding days of focused, patient human care.
              </p>
            </div>

            {/* Key Atelier Values */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#EAE2D8] mb-8">
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-semibold text-[#24211E]">
                  100%
                </span>
                <span className="text-xs text-[#8C827A] font-light">
                  Direct artisan compensation
                </span>
              </div>
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-semibold text-[#24211E]">
                  0%
                </span>
                <span className="text-xs text-[#8C827A] font-light">
                  Plastic waste in packaging
                </span>
              </div>
            </div>

            <div>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[#24211E] hover:text-[#C87D65] transition-colors border-b border-[#24211E] pb-1 hover:border-[#C87D65]"
              >
                <span>Read our artisan pledge</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
