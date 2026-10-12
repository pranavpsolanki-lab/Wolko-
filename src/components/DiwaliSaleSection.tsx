import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Eye, Heart, MessageCircle, Flame, Tag, Check, ArrowRight } from 'lucide-react';
import { PRODUCTS, Product } from '../data/products';
import { useShop } from '../context/ShopContext';
import { ProductCommentBox } from './ProductCommentBox';

export const DiwaliSaleSection: React.FC = () => {
  const { openProductModal, addToCart, toggleWishlist, wishlist, setIsCartOpen, setIsCheckoutOpen } = useShop();
  const [activeTab, setActiveTab] = useState<'all' | 'toys' | 'adornments' | 'decor'>('all');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  // Filter only the 10 Diwali Special items
  const diwaliProducts = PRODUCTS.filter((p) => p.isDiwaliSpecial);

  const filteredProducts = diwaliProducts.filter((product) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'toys') return product.category === 'keychains' && (product.id.includes('bunny') || product.id.includes('calf') || product.id.includes('piglet') || product.id.includes('owl') || product.id.includes('turtle'));
    if (activeTab === 'adornments') return product.category === 'accessories' || product.id.includes('bow') || product.id.includes('tiara') || product.id.includes('butterfly');
    if (activeTab === 'decor') return product.id.includes('flower-pots') || product.category === 'gifts';
    return true;
  });

  const handleSelectColor = (productId: string, colorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVariants((prev) => ({ ...prev, [productId]: colorName }));
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const chosenColor = selectedVariants[product.id] || (product.colors?.[0]?.name ?? 'Standard');
    addToCart(product, chosenColor);
    setAddedItemNotice(product.id);
    setTimeout(() => {
      setAddedItemNotice(null);
    }, 2200);
  };

  return (
    <section id="diwali-sale" className="relative py-16 sm:py-24 bg-[#FAF5EE] border-b border-[#EAE2D8] overflow-hidden">
      {/* Decorative festive golden glow accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Festive Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border border-amber-400/40 text-[#8B2E1E] text-xs font-semibold uppercase tracking-widest mb-4 shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
            <span>Shubh Diwali Limited Atelier Sale · शुभ दीपावली</span>
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
          </div>

          <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#24211E] font-medium tracking-tight mb-4 leading-tight">
            Handcrafted Festival of Lights Editions
          </h2>

          <p className="text-xs sm:text-base text-[#6B6158] font-light leading-relaxed max-w-2xl mx-auto">
            Slowly crocheted with natural cotton-merino wool, pure joy, and festive blessings. Special Diwali gift sets, playful amigurumis, and royal floral adornments packaged in plastic-free seeded boxes with brass diyas.
          </p>

          {/* Festive Promo Highlights */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[#574E45]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-[#EAE2D8]">
              <Tag className="w-3.5 h-3.5 text-[#C87D65]" />
              <span>Use Code <strong className="font-mono text-[#24211E]">DIWALISPARKLE</strong> for Free Gift Box</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-[#EAE2D8]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Flat 15%–25% Festive Discount Applied</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-[#EAE2D8]">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Instant WhatsApp Confirmation</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-8 sm:mb-12 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-[#24211E] text-white shadow-sm'
                : 'bg-white/80 text-[#6B6158] border border-[#EAE2D8] hover:border-[#24211E]'
            }`}
          >
            All Festive Specials ({diwaliProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('toys')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'toys'
                ? 'bg-[#24211E] text-white shadow-sm'
                : 'bg-white/80 text-[#6B6158] border border-[#EAE2D8] hover:border-[#24211E]'
            }`}
          >
            Amigurumi Plush & Charms
          </button>
          <button
            onClick={() => setActiveTab('adornments')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'adornments'
                ? 'bg-[#24211E] text-white shadow-sm'
                : 'bg-white/80 text-[#6B6158] border border-[#EAE2D8] hover:border-[#24211E]'
            }`}
          >
            Festive Bows & Hair Garland
          </button>
          <button
            onClick={() => setActiveTab('decor')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-medium transition-all ${
              activeTab === 'decor'
                ? 'bg-[#24211E] text-white shadow-sm'
                : 'bg-white/80 text-[#6B6158] border border-[#EAE2D8] hover:border-[#24211E]'
            }`}
          >
            Prosperity Potted Garden
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
          {filteredProducts.map((product) => {
            const currentSelectedColorName = selectedVariants[product.id] || product.colors?.[0]?.name;
            const currentVariantObj = product.colors?.find((c) => c.name === currentSelectedColorName) || product.colors?.[0];
            const displayImage = currentVariantObj?.image || product.primaryImage;
            const isWishlisted = wishlist.includes(product.id);
            const isJustAdded = addedItemNotice === product.id;

            return (
              <div
                key={product.id}
                onClick={() => openProductModal(product, currentSelectedColorName)}
                className="group relative bg-white rounded-2xl border border-[#EAE2D8] overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Image Container with Badges */}
                <div className="relative aspect-square w-full overflow-hidden bg-[#F5EFEB]">
                  <img
                    src={displayImage}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    {product.diwaliOfferBadge ? (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md">
                        <Flame className="w-3 h-3 fill-white" />
                        {product.diwaliOfferBadge}
                      </span>
                    ) : (
                      <span className="bg-[#24211E]/90 text-white text-[10px] font-medium tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                        Diwali Special
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#24211E] hover:text-[#C87D65] hover:bg-white shadow-xs transition-transform active:scale-90"
                      aria-label="Wishlist"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#C87D65] text-[#C87D65]' : ''}`} />
                    </button>
                  </div>

                  {/* Stock count / Batch tag */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-mono font-medium text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                      {product.categoryLabel}
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Variations Selector: Amazon & Flipkart Swatch Style */}
                    {product.colors && product.colors.length > 1 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] text-[#6B6158] mb-1.5">
                          <span>Variant:</span>
                          <span className="font-medium text-[#24211E]">{currentSelectedColorName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {product.colors.map((color) => {
                            const isSelected = color.name === currentSelectedColorName;
                            return (
                              <button
                                key={color.name}
                                type="button"
                                title={color.name}
                                onClick={(e) => handleSelectColor(product.id, color.name, e)}
                                className={`group/swatch relative p-0.5 rounded-full transition-transform ${
                                  isSelected
                                    ? 'ring-2 ring-[#24211E] ring-offset-1 scale-105'
                                    : 'ring-1 ring-[#D9CFC4] hover:scale-105'
                                }`}
                              >
                                <span
                                  className="w-4 h-4 rounded-full block border border-white/60 shadow-2xs"
                                  style={{ backgroundColor: color.hex }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <h3 className="font-editorial text-lg sm:text-xl font-medium text-[#24211E] line-clamp-1 group-hover:text-[#8B2E1E] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#6B6158] font-light line-clamp-2 mt-1 mb-3">
                      {product.tagline}
                    </p>
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="pt-3 border-t border-[#F0EBE4] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-lg font-bold text-[#24211E]">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.compareAtPrice && (
                          <span className="font-mono text-xs text-[#8C827A] line-through">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        In Stock
                      </span>
                    </div>

                    {/* Dual Action: Buy Now (Google Sign-Up & AI Call) & Add to Cart */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const chosenColor = selectedVariants[product.id] || (product.colors?.[0]?.name ?? 'Standard');
                          addToCart(product, chosenColor);
                          setIsCartOpen(false);
                          setIsCheckoutOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl text-xs font-semibold bg-[#24211E] hover:bg-[#3E3834] text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                        <span>Buy Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-[#FAF8F5] hover:bg-[#F5EFEB] text-[#24211E] border-[#D9CFC4]'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Real Customer Comment Box Below Every Product */}
                  <ProductCommentBox product={product} variant="card" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner with WhatsApp Assistance */}
        <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#24211E] via-[#332B25] to-[#24211E] text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-amber-500/30 shadow-xl">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase tracking-widest text-amber-300 font-medium">
                Custom Diwali Bulk & Return Gifting
              </span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-normal">
              Need personalized gift hampers or custom color themes?
            </h3>
            <p className="text-xs sm:text-sm text-[#D9CFC4] font-light mt-1 max-w-xl">
              Connect directly with our master artisan on WhatsApp (+91 85915 42015). We craft personalized letterpress gift notes and bulk wedding/Diwali favor sets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/918591542015?text=Hi%20Wolko!%20I%20am%20interested%20in%20Diwali%20custom%20gift%20hampers%20and%20bulk%20orders."
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-6 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chat on WhatsApp (85915 42015)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
