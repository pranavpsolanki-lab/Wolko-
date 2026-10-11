import React, { useState } from 'react';
import { PRODUCTS, Product } from '../data/products';
import { ProductCard } from './ProductCard';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const FeaturedCollection: React.FC = () => {
  const { openProductModal, setIsSearchOpen, activeCategory, setActiveCategory } = useShop();
  const selectedFilter = activeCategory || 'all';

  const filteredProducts = selectedFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === selectedFilter);

  // Large spotlight piece
  const heroPiece = PRODUCTS[0]; // Chunky Cloud Tote

  const productNames = PRODUCTS.map((p) => p.name);

  return (
    <section id="collection" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-[#EAE2D8]">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#8C827A] font-medium mb-2">
              Curated Wool Objects
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-[#24211E] tracking-tight">
              Pieces Worth Keeping
            </h2>
          </div>

          {/* Interactive Filter Controls - Functional Segmented Controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Works' },
              { id: 'keychains', label: 'Charms & Keychains' },
              { id: 'accessories', label: 'Hair & Accessories' },
              { id: 'bags', label: 'Bags & Totes' },
              { id: 'pouches', label: 'Pouches' },
              { id: 'gifts', label: 'Gift Sets' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 ${
                  selectedFilter === tab.id
                    ? 'bg-[#24211E] text-white shadow-xs'
                    : 'text-[#6B6158] hover:text-[#24211E] hover:bg-[#EAE2D8]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Artisan Quick Search & Command Palette Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12 p-3 sm:px-5 sm:py-3 rounded-2xl bg-[#F5EFEB]/90 border border-[#EAE2D8]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs uppercase tracking-widest text-[#8C827A] font-medium hidden md:inline">
              Curated Studio Pieces
            </span>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 sm:flex-initial flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-[#D9CFC4] text-xs text-[#6B6158] hover:text-[#24211E] hover:border-[#24211E] transition-all shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-[#24211E]" />
              <span className="font-light">Search bags, charms, pouches...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#D9CFC4] text-[10px] font-mono font-semibold text-[#8C827A]">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#8C827A]">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#C87D65]" />
              <span className="font-medium text-[#24211E]">{filteredProducts.length} pieces</span> available
            </span>
            <span className="hidden sm:inline text-[#D9CFC4]">|</span>
            <span className="hidden sm:inline">100% Handcrafted</span>
          </div>
        </div>


        {/* Editorial Asymmetric Layout when 'all' is selected */}
        {selectedFilter === 'all' ? (
          <div className="space-y-12">
            {/* Top Row: 1 Dominant Feature Card (60%) + 1 Paired Product Card (40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Dominant Hero Feature Card (7 cols) */}
              <div
                onClick={() => openProductModal(heroPiece)}
                className="lg:col-span-7 group cursor-pointer relative bg-white rounded-2xl border border-[#EAE2D8] overflow-hidden flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(36,33,30,0.08)] transition-all duration-300"
              >
                <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden bg-[#F5EFEB]">
                  <img
                    src={heroPiece.primaryImage}
                    alt={heroPiece.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#FAF8F5]/95 text-[#24211E] text-[11px] font-medium tracking-wider uppercase px-3 py-1 rounded-sm border border-[#EAE2D8]">
                      Master Artisan Showcase
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wider text-[#8C827A] font-medium">
                        {heroPiece.categoryLabel}
                      </span>
                      <span className="font-mono text-base font-semibold text-[#24211E] tabular-nums">
                        ₹{heroPiece.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <h3 className="font-editorial text-2xl sm:text-3xl text-[#24211E] font-medium group-hover:text-[#C87D65] transition-colors mb-3">
                      {heroPiece.name}
                    </h3>
                    <p className="text-sm text-[#574E45] font-light leading-relaxed max-w-xl mb-6">
                      {heroPiece.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F0EBE4] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#8C827A]">
                      <span>6 Hours Hand Looming</span>
                      <span aria-hidden="true">·</span>
                      <span>320m Merino Wool</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#24211E] group-hover:translate-x-1 transition-transform">
                      <span>View Specifications</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Side Stack of 2 Complementary Products (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
                <ProductCard product={PRODUCTS[1]} featuredLayout={true} />
                <ProductCard product={PRODUCTS[2]} featuredLayout={true} />
              </div>
            </div>

            {/* Bottom Row: Remaining Products in Balanced 3-column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {PRODUCTS.slice(3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          /* Filtered Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
