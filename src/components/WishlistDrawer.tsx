import React from 'react';
import { X, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';

export const WishlistDrawer: React.FC = () => {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, toggleWishlist, addToCart } = useShop();

  if (!isWishlistOpen) return null;

  const savedProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-[#24211E]/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#EAE2D8]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#EAE2D8] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#C87D65] fill-current" />
              <h2 className="font-editorial text-xl font-medium text-[#24211E]">
                Saved Keepsakes
              </h2>
              <span className="text-xs font-mono text-[#8C827A] tabular-nums">
                ({savedProducts.length})
              </span>
            </div>
            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-1.5 text-[#8C827A] hover:text-[#24211E] rounded-full hover:bg-[#F5EFEB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-[#EAE2D8]/80">
            {savedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F5EFEB] flex items-center justify-center mb-4 text-[#8C827A]">
                  <Heart className="w-6 h-6 stroke-1" />
                </div>
                <h3 className="font-editorial text-2xl text-[#24211E] mb-2">
                  No saved pieces yet
                </h3>
                <p className="text-xs text-[#8C827A] max-w-xs font-light mb-6">
                  Click the heart icon on any handcrafted piece to save it for later consideration.
                </p>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="px-6 py-2.5 bg-[#24211E] text-white text-xs uppercase tracking-wider rounded-full hover:bg-[#3A3530]"
                >
                  Discover Pieces
                </button>
              </div>
            ) : (
              savedProducts.map((product) => (
                <div key={product.id} className="py-4 flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F5EFEB] border border-[#EAE2D8] shrink-0">
                    <img
                      src={product.primaryImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="font-editorial text-base text-[#24211E] font-medium leading-tight">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="text-[#A89E96] hover:text-[#C87D65] p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="font-mono text-xs font-semibold text-[#24211E] mt-1 tabular-nums">
                        ₹{product.price.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => {
                          addToCart(product);
                          toggleWishlist(product.id);
                        }}
                        className="w-full py-1.5 px-3 bg-white hover:bg-[#24211E] hover:text-white border border-[#24211E] text-[#24211E] text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {savedProducts.length > 0 && (
            <div className="p-6 border-t border-[#EAE2D8] bg-white">
              <button
                onClick={() => {
                  savedProducts.forEach((p) => addToCart(p));
                  setIsWishlistOpen(false);
                }}
                className="w-full py-3.5 px-6 bg-[#24211E] hover:bg-[#3A3530] text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold rounded-full transition-all flex items-center justify-center gap-2"
              >
                <span>Move All to Bag</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
