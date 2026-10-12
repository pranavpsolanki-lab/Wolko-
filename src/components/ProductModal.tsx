import React, { useState, useEffect } from 'react';
import { X, Heart, Plus, Minus, Check, ShieldCheck, Truck, Sparkles, ChevronDown, RotateCcw, Zap } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ProductColor } from '../data/products';
import { ProductCommentBox } from './ProductCommentBox';

export const ProductModal: React.FC = () => {
  const { selectedProduct, closeProductModal, addToCart, toggleWishlist, isInWishlist, setIsCartOpen, setIsCheckoutOpen } = useShop();

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeVariantImage, setActiveVariantImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<'details' | 'care' | 'story' | null>('details');

  // Reset or initialize when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      const initialColor = selectedProduct.colors[0];
      setSelectedColor(initialColor?.name || 'Standard');
      setActiveVariantImage(initialColor?.image || selectedProduct.primaryImage);
      setSelectedSize(selectedProduct.sizes?.[0] || '');
      setQuantity(1);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const currentColor = selectedColor || selectedProduct.colors[0]?.name || 'Standard';
  const currentSize = selectedSize || selectedProduct.sizes?.[0] || '';
  const selectedColorObj = selectedProduct.colors.find((c) => c.name === currentColor);
  const displayImage = activeVariantImage || selectedColorObj?.image || selectedProduct.primaryImage;
  const isFavorited = isInWishlist(selectedProduct.id);

  const handleColorChange = (color: ProductColor) => {
    setSelectedColor(color.name);
    if (color.image) {
      setActiveVariantImage(color.image);
    }
  };

  const handleAdd = () => {
    addToCart(selectedProduct, currentColor, quantity, currentSize, displayImage);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      closeProductModal();
    }, 850);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, currentColor, quantity, currentSize, displayImage);
    setIsCartOpen(false);
    closeProductModal();
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={closeProductModal}
        className="fixed inset-0 bg-[#24211E]/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-[#EAE2D8] overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Close button */}
          <button
            onClick={closeProductModal}
            className="absolute top-4 right-4 z-20 p-2 text-[#4A443E] hover:text-[#24211E] bg-white/90 backdrop-blur-xs rounded-full border border-[#EAE2D8] shadow-xs transition-all hover:scale-105"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Gallery Column (6 cols) */}
            <div className="md:col-span-6 bg-[#F5EFEB] p-5 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#EAE2D8]">
              {/* Active Image with Dynamic Color Swap */}
              <div>
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-[#EAE2D8] shadow-sm mb-4">
                  <img
                    key={displayImage}
                    src={displayImage}
                    alt={`${selectedProduct.name} in ${currentColor}`}
                    className="w-full h-full object-cover transition-opacity duration-300 animate-in fade-in"
                  />
                  {selectedProduct.badge && (
                    <div className="absolute top-3 left-3 bg-[#FAF8F5]/95 backdrop-blur-xs text-[#24211E] text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-full border border-[#EAE2D8] shadow-xs">
                      {selectedProduct.badge}
                    </div>
                  )}

                  {/* Flipkart/Amazon Style Active Variation Badge */}
                  <div className="absolute bottom-3 left-3 bg-[#24211E]/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <span
                      className="w-2 h-2 rounded-full border border-white/50 shrink-0"
                      style={{ backgroundColor: selectedColorObj?.hex || '#FFF' }}
                    />
                    <span>{currentColor}</span>
                  </div>
                </div>

                {/* Amazon / Flipkart Style Color Variations Photo Carousel / Thumbnails */}
                {selectedProduct.colors.length > 1 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#8C827A] font-semibold mb-2">
                      Available Colorways ({selectedProduct.colors.length})
                    </div>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {selectedProduct.colors.map((c) => {
                        const isSelected = currentColor === c.name;
                        return (
                          <button
                            key={c.name}
                            onClick={() => handleColorChange(c)}
                            className={`group relative rounded-xl overflow-hidden border-2 transition-all shrink-0 p-0.5 ${
                              isSelected
                                ? 'border-[#24211E] shadow-sm scale-102 ring-1 ring-[#24211E]'
                                : 'border-[#EAE2D8] bg-white opacity-70 hover:opacity-100 hover:border-[#8C827A]'
                            }`}
                            title={`Select ${c.name}`}
                          >
                            <div className="w-13 h-13 rounded-lg overflow-hidden bg-[#FAF8F5]">
                              {c.image ? (
                                <img
                                  src={c.image}
                                  alt={c.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ backgroundColor: c.hex }}
                                >
                                  <span className="text-[10px] font-bold text-white/90 drop-shadow-xs">
                                    {c.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#24211E] text-white flex items-center justify-center text-[7px] font-bold shadow-xs">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Artisan Note */}
              <div className="mt-5 pt-4 border-t border-[#EAE2D8]/80 text-xs text-[#6B6158] font-light flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C87D65] shrink-0" />
                <span>100% slow-crafted by women artisans in small limited batches.</span>
              </div>
            </div>

            {/* Purchase & Info Column (6 cols) */}
            <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between bg-white overflow-y-auto max-h-[85vh]">
              <div>
                {/* Category & Rating */}
                <div className="flex items-center justify-between text-xs text-[#8C827A] mb-1.5 font-medium">
                  <span className="uppercase tracking-widest">{selectedProduct.categoryLabel}</span>
                  <span className="text-[#7B8A78] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7B8A78]" />
                    Handcrafted Original
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#24211E] leading-snug mb-1">
                  {selectedProduct.name}
                </h2>

                {/* Tagline */}
                <p className="text-xs text-[#6B6158] font-light mb-3">
                  {selectedProduct.tagline}
                </p>

                {/* Price Section with Discount Badge */}
                <div className="flex items-baseline gap-3 pb-3 mb-4 border-b border-[#F0EBE4]">
                  <span className="font-mono text-2xl font-bold text-[#24211E] tabular-nums">
                    ₹{selectedProduct.price.toLocaleString('en-IN')}
                  </span>
                  {selectedProduct.compareAtPrice && (
                    <>
                      <span className="font-mono text-sm text-[#A89E96] line-through tabular-nums">
                        ₹{selectedProduct.compareAtPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-semibold text-[#C87D65] bg-[#F7EBE8] px-2 py-0.5 rounded-md">
                        {Math.round(((selectedProduct.compareAtPrice - selectedProduct.price) / selectedProduct.compareAtPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                  <span className="text-[11px] text-[#7B8A78] font-medium ml-auto">
                    Taxes included
                  </span>
                </div>

                {/* Amazon / Flipkart Style Color Variations */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-[#24211E]">
                      Select Color: <span className="font-bold text-[#24211E]">{currentColor}</span>
                    </span>
                    {selectedColorObj?.stockCount && (
                      <span className="text-[11px] font-medium text-[#C87D65] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C87D65] animate-pulse" />
                        Only {selectedColorObj.stockCount} left in this shade
                      </span>
                    )}
                  </div>

                  {/* Rich Swatch Cards (Amazon/Flipkart UI) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProduct.colors.map((c) => {
                      const isSelected = currentColor === c.name;
                      return (
                        <button
                          key={c.name}
                          onClick={() => handleColorChange(c)}
                          className={`relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[#24211E] bg-[#FAF8F5] shadow-xs ring-1.5 ring-[#24211E]'
                              : 'border-[#EAE2D8] bg-white hover:border-[#8C827A] hover:bg-[#FAF8F5]/50'
                          }`}
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-black/10 bg-[#F5EFEB]">
                            {c.image ? (
                              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full" style={{ backgroundColor: c.hex }} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-medium text-[#24211E] block truncate leading-tight">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-[#7B8A78] block font-light">
                              {c.inStock ? 'In Stock' : 'Made to Order'}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#24211E] text-white flex items-center justify-center text-[8px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size / Style Variations (Amazon/Flipkart UI) */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-[#24211E]">
                        Select Size / Style: <span className="font-bold text-[#24211E]">{currentSize}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizes.map((s) => {
                        const isSelected = currentSize === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`px-3.5 py-1.5 text-xs rounded-xl border transition-all ${
                              isSelected
                                ? 'border-[#24211E] bg-[#24211E] text-white font-medium shadow-xs'
                                : 'border-[#D9CFC4] bg-white text-[#4A443E] hover:border-[#24211E] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#4A443E] font-light leading-relaxed mb-4">
                  {selectedProduct.description}
                </p>

                {/* Shopping Perks Highlight Bar */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D8] mb-4 text-[11px] text-[#574E45]">
                  <div className="flex flex-col items-center text-center">
                    <Truck className="w-3.5 h-3.5 text-[#C87D65] mb-1" />
                    <span className="font-medium text-[#24211E]">Fast Dispatch</span>
                    <span className="text-[9px] text-[#8C827A]">24-48 Hours</span>
                  </div>
                  <div className="flex flex-col items-center text-center border-x border-[#EAE2D8]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7B8A78] mb-1" />
                    <span className="font-medium text-[#24211E]">Authentic Wool</span>
                    <span className="text-[9px] text-[#8C827A]">Hand-Knitted</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <RotateCcw className="w-3.5 h-3.5 text-[#24211E] mb-1" />
                    <span className="font-medium text-[#24211E]">7-Day Exchange</span>
                    <span className="text-[9px] text-[#8C827A]">Hassle Free</span>
                  </div>
                </div>

                {/* Accordion Specs */}
                <div className="border-t border-[#F0EBE4] divide-y divide-[#F0EBE4] mb-4 text-xs">
                  {/* Specifications */}
                  <div>
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === 'details' ? null : 'details')}
                      className="w-full py-2.5 flex items-center justify-between font-medium text-[#24211E]"
                    >
                      <span>Artisan Details & Materials</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          activeAccordion === 'details' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {activeAccordion === 'details' && (
                      <ul className="pb-3 space-y-1.5 text-[#574E45] font-light">
                        {selectedProduct.details.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#C87D65] mt-0.5">·</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Care Guide */}
                  <div>
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === 'care' ? null : 'care')}
                      className="w-full py-2.5 flex items-center justify-between font-medium text-[#24211E]"
                    >
                      <span>Care Instructions</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          activeAccordion === 'care' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {activeAccordion === 'care' && (
                      <p className="pb-3 text-[#574E45] font-light leading-relaxed">
                        {selectedProduct.careInstructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase Action Box (Amazon / Flipkart Style dual buttons) */}
              <div className="pt-3 border-t border-[#F0EBE4]">
                <div className="flex items-center gap-2.5 mb-2.5">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-[#D9CFC4] rounded-full bg-white px-2 py-1 shrink-0">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1 text-[#6B6158] hover:text-[#24211E]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs px-2.5 tabular-nums font-semibold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-1 text-[#6B6158] hover:text-[#24211E]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Add to Bag Button */}
                  <button
                    onClick={handleAdd}
                    className="flex-1 py-3 px-4 bg-[#24211E] hover:bg-[#3A3530] text-[#FAF8F5] text-xs uppercase tracking-wider font-semibold rounded-full transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4 text-[#E8B4B8]" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <span>Add to Cart · ₹{(selectedProduct.price * quantity).toLocaleString('en-IN')}</span>
                    )}
                  </button>

                  {/* Instant Buy Now Button (Amazon/Flipkart feature) */}
                  <button
                    onClick={handleBuyNow}
                    className="py-3 px-5 bg-[#C87D65] hover:bg-[#B36B54] text-white text-xs uppercase tracking-wider font-semibold rounded-full transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Buy Now</span>
                  </button>

                  {/* Wishlist toggle */}
                  <button
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className={`p-3 rounded-full border transition-all shrink-0 ${
                      isFavorited
                        ? 'bg-[#C87D65] text-white border-[#C87D65]'
                        : 'border-[#D9CFC4] text-[#4A443E] hover:text-[#24211E] hover:bg-[#FAF8F5]'
                    }`}
                    aria-label="Save piece"
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 text-[10px] text-[#8C827A]">
                  <span>🌿 Seeded plantable paper box included</span>
                  <span>·</span>
                  <span>🔒 Secure SSL Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real Public Customer Comments Section Below Product Details */}
          <ProductCommentBox product={selectedProduct} variant="modal" />
        </div>
      </div>
    </div>
  );
};
