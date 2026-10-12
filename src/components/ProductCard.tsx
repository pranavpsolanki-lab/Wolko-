import React, { useState } from 'react';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '../data/products';
import { useShop } from '../context/ShopContext';
import { ProductCommentBox } from './ProductCommentBox';

interface ProductCardProps {
  product: Product;
  featuredLayout?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, featuredLayout = false }) => {
  const { addToCart, toggleWishlist, isInWishlist, openProductModal } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isFavorited = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, selectedColor, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      onClick={() => openProductModal(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group cursor-pointer flex flex-col bg-white rounded-xl border border-[#EAE2D8]/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(36,33,30,0.06)] hover:-translate-y-1 ${
        featuredLayout ? 'h-full' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFEB]">
        <img
          src={product.primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge - Single subtle text tag */}
        {product.badge && (
          <div className="absolute top-3 left-3">
            <span className="inline-block bg-[#FAF8F5]/90 backdrop-blur-xs text-[#24211E] text-[10px] tracking-wider uppercase font-medium px-2.5 py-1 rounded-sm border border-[#EAE2D8]">
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isFavorited
              ? 'bg-[#C87D65] text-white shadow-sm'
              : 'bg-white/80 backdrop-blur-xs text-[#4A443E] hover:text-[#24211E] hover:bg-white shadow-xs'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Bar on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleQuickAdd}
            className="w-full py-2.5 px-3 bg-[#24211E]/95 hover:bg-[#24211E] text-white text-xs font-medium tracking-wide rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#E8B4B8]" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Add · ₹{product.price.toLocaleString('en-IN')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Material Line */}
          <div className="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium mb-1">
            {product.categoryLabel}
          </div>

          {/* Title */}
          <h3 className="font-editorial text-lg sm:text-xl text-[#24211E] font-medium leading-snug group-hover:text-[#C87D65] transition-colors mb-1.5">
            {product.name}
          </h3>

          {/* Tagline / Subtitle */}
          <p className="text-xs text-[#6B6158] font-light line-clamp-2 leading-relaxed mb-3">
            {product.tagline}
          </p>
        </div>

        {/* Bottom row: Swatches & Price */}
        <div className="pt-3 border-t border-[#F0EBE4] flex items-center justify-between">
          {/* Color Dots */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {product.colors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.name)}
                title={color.name}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  selectedColor === color.name
                    ? 'ring-1 ring-[#24211E] ring-offset-1 border-[#24211E]'
                    : 'border-black/20 hover:scale-110'
                }`}
                style={{ backgroundColor: color.hex }}
                aria-label={`Select color ${color.name}`}
              />
            ))}
          </div>

          {/* Price display with Tabular numerals */}
          <div className="flex items-baseline gap-2 font-mono text-sm tabular-nums">
            <span className="font-semibold text-[#24211E]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-[#A89E96] line-through">
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Real Customer Comment Box Below Every Product */}
        <ProductCommentBox product={product} variant="card" />
      </div>
    </article>
  );
};
