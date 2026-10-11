import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Sparkles, ArrowRight, Gift } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    setIsCheckoutOpen,
  } = useShop();

  const [hasGiftNote, setHasGiftNote] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 1999;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const freeShippingProgress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-[#24211E]/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col border-l border-[#EAE2D8]">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#EAE2D8] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#24211E]" />
              <h2 className="font-editorial text-xl font-medium text-[#24211E]">
                Your Shopping Bag
              </h2>
              <span className="text-xs font-mono text-[#8C827A] tabular-nums">
                ({cart.reduce((a, b) => a + b.quantity, 0)})
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#8C827A] hover:text-[#24211E] rounded-full hover:bg-[#F5EFEB] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3.5 bg-[#F5EFEB] border-b border-[#EAE2D8]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-light">
              {remainingForFreeShipping > 0 ? (
                <span className="text-[#574E45]">
                  Add <strong className="font-mono font-medium text-[#24211E]">₹{remainingForFreeShipping.toLocaleString('en-IN')}</strong> more for Free Shipping across India
                </span>
              ) : (
                <span className="text-[#7B8A78] font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C87D65]" />
                  Complimentary Express Shipping Unlocked!
                </span>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#EAE2D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#24211E] transition-all duration-300 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-[#EAE2D8]/80">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F5EFEB] flex items-center justify-center mb-4 text-[#8C827A]">
                  <ShoppingBag className="w-6 h-6 stroke-1" />
                </div>
                <h3 className="font-editorial text-2xl text-[#24211E] mb-2">
                  Your bag is empty
                </h3>
                <p className="text-xs text-[#8C827A] max-w-xs font-light mb-6">
                  Every Wolko piece is handmade in small batches. Explore our collection to discover heirloom wool favorites.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#24211E] text-white text-xs uppercase tracking-wider rounded-full hover:bg-[#3A3530] transition-colors"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={`${item.product.id}-${item.selectedColor}`} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F5EFEB] border border-[#EAE2D8] shrink-0">
                    <img
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-editorial text-base text-[#24211E] font-medium leading-tight">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                          className="text-[#A89E96] hover:text-[#C87D65] p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-[#8C827A] mt-0.5">
                        Color: {item.selectedColor}
                      </div>
                    </div>

                    {/* Quantity & Price Row */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#D9CFC4] rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedColor, -1)}
                          className="p-1 text-[#6B6158] hover:text-[#24211E]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs px-2.5 tabular-nums font-medium text-[#24211E]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.selectedColor, 1)}
                          className="p-1 text-[#6B6158] hover:text-[#24211E]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono text-xs font-semibold text-[#24211E] tabular-nums">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Complimentary Handwritten Gift Note Option */}
            {cart.length > 0 && (
              <div className="pt-4 pb-2">
                <button
                  onClick={() => setHasGiftNote(!hasGiftNote)}
                  className="flex items-center gap-2 text-xs text-[#574E45] hover:text-[#24211E] font-medium mb-2"
                >
                  <Gift className="w-3.5 h-3.5 text-[#C87D65]" />
                  <span>{hasGiftNote ? 'Remove gift note' : 'Add complimentary handwritten gift note'}</span>
                </button>

                {hasGiftNote && (
                  <div className="mt-2">
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Write your personal message here. We will scribe it with ink on seed paper..."
                      className="w-full text-xs p-3 rounded-lg border border-[#D9CFC4] bg-white text-[#24211E] focus:outline-none focus:border-[#24211E]"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with Subtotal & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[#EAE2D8] bg-white space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8C827A]">
                <span>Taxes & Artisan Packaging</span>
                <span className="text-[#7B8A78] font-medium">Included</span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-medium text-[#24211E]">Subtotal</span>
                <span className="font-mono text-xl font-semibold text-[#24211E] tabular-nums">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-6 bg-[#24211E] hover:bg-[#3A3530] text-[#FAF8F5] text-xs uppercase tracking-widest font-semibold rounded-full transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full text-center text-xs text-[#8C827A] hover:text-[#24211E] transition-colors pt-1"
              >
                Continue Exploring
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
