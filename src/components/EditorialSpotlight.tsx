import React from 'react';
import { PRODUCTS, BRAND_ASSETS } from '../data/products';
import { useShop } from '../context/ShopContext';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export const EditorialSpotlight: React.FC = () => {
  const { openProductModal, addToCart } = useShop();
  const spotlightItem = PRODUCTS[0]; // Chunky Cloud Tote

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5EFEB] border-t border-[#EAE2D8]">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-white border border-[#EAE2D8] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* Visual Campaign Half (7 cols) */}
            <div className="lg:col-span-7 relative overflow-hidden bg-[#FAF8F5]">
              <img
                src={BRAND_ASSETS.chunkyTote}
                alt="Wolko Chunky Cloud Tote Editorial Campaign"
                className="w-full h-full object-cover object-center min-h-[380px] lg:min-h-full hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center gap-1.5 bg-[#24211E]/85 backdrop-blur-xs text-[#FAF8F5] text-[11px] tracking-widest uppercase font-medium px-3.5 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-[#E8B4B8]" />
                  Campaign Edition 2026
                </span>
              </div>
            </div>

            {/* Editorial Floating Narrative (5 cols) */}
            <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-white">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-[#8C827A] font-medium mb-3">
                  Heirloom Silhouette
                </div>

                <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-[#24211E] tracking-tight leading-[1.15] mb-6">
                  Soft enough for everyday. <br />
                  <span className="italic text-[#C87D65]">Special enough to keep.</span>
                </h2>

                <p className="text-sm sm:text-base text-[#574E45] font-light leading-relaxed mb-6">
                  Woven from a continuous spool of virgin Australian merino wool blend. The Cloud Tote molds effortlessly to your side, offering a pillowy weight that turns the simplest morning walk or cafe visit into a tactile luxury.
                </p>

                <div className="space-y-2 mb-8 text-xs text-[#6B6158]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7B8A78]" />
                    <span>Single-piece seamless construction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7B8A78]" />
                    <span>Braided handles with ergonomic tension balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7B8A78]" />
                    <span>Hand-stamped brass authentication tag</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#F0EBE4]">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider text-[#8C827A]">Price</span>
                  <span className="font-mono text-xl font-semibold text-[#24211E] tabular-nums">
                    ₹{spotlightItem.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => addToCart(spotlightItem)}
                    className="flex-1 py-3 px-6 bg-[#24211E] hover:bg-[#3A3530] text-[#FAF8F5] text-xs uppercase tracking-widest font-medium rounded-full transition-all duration-200 text-center shadow-xs"
                  >
                    Add to Bag
                  </button>
                  <button
                    onClick={() => openProductModal(spotlightItem)}
                    className="py-3 px-5 border border-[#D9CFC4] hover:bg-[#FAF8F5] text-[#24211E] text-xs uppercase tracking-widest font-medium rounded-full transition-all flex items-center justify-center gap-1"
                  >
                    <span>View Piece</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
