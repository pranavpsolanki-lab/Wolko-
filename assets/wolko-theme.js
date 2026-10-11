/**
 * Wolko Artisan Studio — Shopify Online Store 2.0 Storefront Engine
 * Handles native Shopify AJAX Cart (/cart.js, /cart/add.js, /cart/change.js),
 * Asymmetric Featured Collection, Shubh Diwali Sale, 5-Stage Craft Stepper,
 * Quick View Product Modal, ⌘K Search Command Palette, and Wishlist Drawer.
 */
(function () {
  'use strict';

  var catalog = (window.WolkoCatalogData && window.WolkoCatalogData.PRODUCTS) || [];
  var craftSteps = (window.WolkoCatalogData && window.WolkoCatalogData.CRAFT_STEPS) || [];
  var brandAssets = (window.WolkoCatalogData && window.WolkoCatalogData.BRAND_ASSETS) || {};
  var shopifyMap = window.WolkoShopifyProductsMap || {};
  var config = window.WolkoShopify || {};

  var state = {
    diwaliTab: 'all',
    collectionTab: 'all',
    selectedColors: {},
    craftStepIndex: 0,
    cartItems: [],
    wishlist: [],
    giftNoteOpen: false,
    giftNoteText: ''
  };

  // Load persisted wishlist & local cart items
  try {
    var savedWish = localStorage.getItem('wolko_shopify_wishlist');
    if (savedWish) state.wishlist = JSON.parse(savedWish);
    var savedCart = localStorage.getItem('wolko_shopify_cart');
    if (savedCart) state.cartItems = JSON.parse(savedCart);
    var savedNote = localStorage.getItem('wolko_shopify_gift_note');
    if (savedNote) state.giftNoteText = savedNote;
  } catch (e) {}

  function saveState() {
    try {
      localStorage.setItem('wolko_shopify_wishlist', JSON.stringify(state.wishlist));
      localStorage.setItem('wolko_shopify_cart', JSON.stringify(state.cartItems));
      localStorage.setItem('wolko_shopify_gift_note', state.giftNoteText || '');
    } catch (e) {}
  }

  function formatINR(amount) {
    var num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getProductById(id) {
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].id === id) return catalog[i];
    }
    return null;
  }

  // =========================================================================
  // 1. CART ENGINE (Shopify AJAX Cart API + Instant Catalog Fallback)
  // =========================================================================
  function syncShopifyCart() {
    if (!window.fetch) {
      renderCartUI();
      return;
    }
    fetch((config.routes && config.routes.root_url ? config.routes.root_url : '/') + 'cart.js', {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (shopifyCart) {
        if (shopifyCart && Array.isArray(shopifyCart.items) && shopifyCart.items.length > 0) {
          state.shopifyNativeCart = shopifyCart;
        }
        renderCartUI();
      })
      .catch(function () {
        renderCartUI();
      });
  }

  function addToBag(productId, colorName, qty, openDrawer) {
    var product = getProductById(productId);
    var quantity = qty || 1;
    var chosenColor = colorName || (product && product.colors && product.colors[0] ? product.colors[0].name : 'Standard');

    // Check if this product exists in native Shopify catalog
    var nativeMatch = shopifyMap[productId];
    if (nativeMatch && nativeMatch.firstVariantId) {
      fetch((config.routes && config.routes.cart_add_url) || '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          items: [{ id: nativeMatch.firstVariantId, quantity: quantity, properties: { Variant: chosenColor } }]
        })
      })
        .then(function () { syncShopifyCart(); })
        .catch(function () {});
    }

    if (product) {
      var colorObj = (product.colors || []).find(function (c) { return c.name === chosenColor; });
      var image = (colorObj && colorObj.image) || product.primaryImage;
      var existingIndex = -1;
      for (var i = 0; i < state.cartItems.length; i++) {
        if (state.cartItems[i].id === product.id && state.cartItems[i].color === chosenColor) {
          existingIndex = i;
          break;
        }
      }
      if (existingIndex > -1) {
        state.cartItems[existingIndex].quantity += quantity;
      } else {
        state.cartItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          color: chosenColor,
          image: image,
          quantity: quantity
        });
      }
      saveState();
      renderCartUI();
    }

    if (openDrawer !== false) {
      openCartDrawer();
    }
  }

  function addNativeShopifyVariant(variantId, btnEl) {
    if (!variantId) return;
    var originalText = btnEl ? btnEl.innerHTML : '';
    if (btnEl) btnEl.innerHTML = '<span>✓ Added to Bag</span>';
    fetch((config.routes && config.routes.cart_add_url) || '/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] })
    })
      .then(function (r) { return r.json(); })
      .then(function () {
        syncShopifyCart();
        openCartDrawer();
        if (btnEl) {
          setTimeout(function () { btnEl.innerHTML = originalText; }, 1400);
        }
      })
      .catch(function () {
        if (btnEl) btnEl.innerHTML = originalText;
      });
  }

  function updateCartQty(id, color, delta) {
    for (var i = 0; i < state.cartItems.length; i++) {
      if (state.cartItems[i].id === id && state.cartItems[i].color === color) {
        state.cartItems[i].quantity += delta;
        if (state.cartItems[i].quantity <= 0) {
          state.cartItems.splice(i, 1);
        }
        break;
      }
    }
    saveState();
    renderCartUI();
  }

  function removeCartItem(id, color) {
    state.cartItems = state.cartItems.filter(function (item) {
      return !(item.id === id && item.color === color);
    });
    saveState();
    renderCartUI();
  }

  function renderCartUI() {
    var totalCount = 0;
    var subtotal = 0;
    state.cartItems.forEach(function (item) {
      totalCount += item.quantity;
      subtotal += item.price * item.quantity;
    });

    var headerCountEl = document.getElementById('wolko-header-cart-count');
    var drawerCountEl = document.getElementById('wolko-cart-drawer-count');
    if (headerCountEl) headerCountEl.textContent = String(totalCount);
    if (drawerCountEl) drawerCountEl.textContent = '(' + totalCount + ')';

    // Free shipping progress bar (₹1,999 threshold)
    var threshold = 1999;
    var remaining = Math.max(0, threshold - subtotal);
    var progress = Math.min(100, (subtotal / threshold) * 100);
    var shippingTextEl = document.getElementById('wolko-shipping-text');
    var shippingBarEl = document.getElementById('wolko-shipping-bar');
    if (shippingTextEl) {
      if (remaining > 0) {
        shippingTextEl.innerHTML = '<span>Add <strong class="font-mono font-medium text-[#24211E]">' + formatINR(remaining) + '</strong> more for Free Shipping across India</span>';
      } else {
        shippingTextEl.innerHTML = '<span class="text-[#7B8A78] font-medium flex items-center gap-1"><span class="text-[#C87D65]">✦</span> Complimentary Express Shipping Unlocked!</span>';
      }
    }
    if (shippingBarEl) {
      shippingBarEl.style.width = progress + '%';
    }

    var itemsContainer = document.getElementById('wolko-cart-items');
    var footerEl = document.getElementById('wolko-cart-footer');
    var giftWrapEl = document.getElementById('wolko-gift-note-wrap');
    var subtotalEl = document.getElementById('wolko-cart-subtotal');

    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);

    if (!itemsContainer) return;

    if (state.cartItems.length === 0) {
      if (footerEl) footerEl.classList.add('hidden');
      if (giftWrapEl) giftWrapEl.classList.add('hidden');
      itemsContainer.innerHTML =
        '<div class="h-full flex flex-col items-center justify-center text-center py-12">' +
          '<div class="w-16 h-16 rounded-full bg-[#F5EFEB] flex items-center justify-center mb-4 text-[#8C827A] text-xl">🛍️</div>' +
          '<h3 class="font-editorial text-2xl text-[#24211E] mb-2">Your bag is empty</h3>' +
          '<p class="text-xs text-[#8C827A] max-w-xs font-light mb-6">Every Wolko piece is handmade in small batches. Explore our collection to discover heirloom wool favorites.</p>' +
          '<button type="button" data-close-cart class="px-6 py-2.5 bg-[#24211E] text-white text-xs uppercase tracking-wider rounded-full hover:bg-[#3A3530] transition-colors">Explore Collection</button>' +
        '</div>';
      return;
    }

    if (footerEl) footerEl.classList.remove('hidden');
    if (giftWrapEl) giftWrapEl.classList.remove('hidden');

    var html = '';
    state.cartItems.forEach(function (item) {
      html +=
        '<div class="py-4 flex gap-4">' +
          '<div class="w-20 h-20 rounded-lg overflow-hidden bg-[#F5EFEB] border border-[#EAE2D8] shrink-0">' +
            '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '" class="w-full h-full object-cover">' +
          '</div>' +
          '<div class="flex-1 flex flex-col justify-between">' +
            '<div>' +
              '<div class="flex items-start justify-between gap-2">' +
                '<h4 class="font-editorial text-base text-[#24211E] font-medium leading-tight">' + escapeHtml(item.name) + '</h4>' +
                '<button type="button" data-remove-cart-id="' + escapeHtml(item.id) + '" data-remove-cart-color="' + escapeHtml(item.color) + '" class="text-[#A89E96] hover:text-[#C87D65] p-1 text-xs" aria-label="Remove item">&#10005;</button>' +
              '</div>' +
              '<div class="text-[11px] text-[#8C827A] mt-0.5">Color: ' + escapeHtml(item.color) + '</div>' +
            '</div>' +
            '<div class="flex items-center justify-between mt-3">' +
              '<div class="flex items-center border border-[#D9CFC4] rounded-md bg-white">' +
                '<button type="button" data-qty-id="' + escapeHtml(item.id) + '" data-qty-color="' + escapeHtml(item.color) + '" data-qty-delta="-1" class="px-2 py-0.5 text-xs text-[#6B6158] hover:text-[#24211E]">&minus;</button>' +
                '<span class="font-mono text-xs px-2.5 tabular-nums font-medium text-[#24211E]">' + item.quantity + '</span>' +
                '<button type="button" data-qty-id="' + escapeHtml(item.id) + '" data-qty-color="' + escapeHtml(item.color) + '" data-qty-delta="1" class="px-2 py-0.5 text-xs text-[#6B6158] hover:text-[#24211E]">+</button>' +
              '</div>' +
              '<span class="font-mono text-xs font-semibold text-[#24211E] tabular-nums">' + formatINR(item.price * item.quantity) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    itemsContainer.innerHTML = html;
  }

  function openCartDrawer() {
    var drawer = document.getElementById('wolko-cart-drawer');
    if (drawer) {
      drawer.classList.remove('hidden');
      drawer.setAttribute('aria-hidden', 'false');
    }
  }

  function closeCartDrawer() {
    var drawer = document.getElementById('wolko-cart-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
      drawer.setAttribute('aria-hidden', 'true');
    }
  }

  // =========================================================================
  // 2. SHUBH DIWALI SALE SECTION RENDERER
  // =========================================================================
  function renderDiwaliGrid() {
    var grid = document.getElementById('wolko-diwali-grid');
    if (!grid) return;

    var diwaliProducts = catalog.filter(function (p) { return p.isDiwaliSpecial; });
    var filtered = diwaliProducts.filter(function (product) {
      if (state.diwaliTab === 'all') return true;
      if (state.diwaliTab === 'toys') {
        return product.category === 'keychains' && (
          product.id.indexOf('bunny') > -1 ||
          product.id.indexOf('calf') > -1 ||
          product.id.indexOf('piglet') > -1 ||
          product.id.indexOf('owl') > -1 ||
          product.id.indexOf('turtle') > -1
        );
      }
      if (state.diwaliTab === 'adornments') {
        return product.category === 'accessories' ||
          product.id.indexOf('bow') > -1 ||
          product.id.indexOf('tiara') > -1 ||
          product.id.indexOf('butterfly') > -1;
      }
      if (state.diwaliTab === 'decor') {
        return product.id.indexOf('flower-pots') > -1 || product.category === 'gifts';
      }
      return true;
    });

    var html = '';
    filtered.forEach(function (product) {
      var selectedColorName = state.selectedColors[product.id] || (product.colors && product.colors[0] ? product.colors[0].name : 'Standard');
      var variantObj = (product.colors || []).find(function (c) { return c.name === selectedColorName; }) || (product.colors && product.colors[0]);
      var displayImg = (variantObj && variantObj.image) || product.primaryImage;
      var isWish = state.wishlist.indexOf(product.id) > -1;

      var swatchesHtml = '';
      if (product.colors && product.colors.length > 1) {
        swatchesHtml += '<div class="mb-3"><div class="flex items-center justify-between text-[11px] text-[#6B6158] mb-1.5"><span>Variant:</span><span class="font-medium text-[#24211E]">' + escapeHtml(selectedColorName) + '</span></div><div class="flex items-center gap-1.5 flex-wrap">';
        product.colors.forEach(function (c) {
          var activeRing = c.name === selectedColorName ? 'ring-2 ring-[#24211E] ring-offset-1 scale-105' : 'ring-1 ring-[#D9CFC4] hover:scale-105';
          swatchesHtml +=
            '<button type="button" title="' + escapeHtml(c.name) + '" data-swatch-product="' + escapeHtml(product.id) + '" data-swatch-color="' + escapeHtml(c.name) + '" class="p-0.5 rounded-full transition-transform ' + activeRing + '">' +
              '<span class="w-4 h-4 rounded-full block border border-white/60" style="background-color:' + escapeHtml(c.hex) + '"></span>' +
            '</button>';
        });
        swatchesHtml += '</div></div>';
      }

      html +=
        '<div data-open-product-id="' + escapeHtml(product.id) + '" class="group relative bg-white rounded-2xl border border-[#EAE2D8] overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col cursor-pointer">' +
          '<div class="relative aspect-square w-full overflow-hidden bg-[#F5EFEB]">' +
            '<img src="' + escapeHtml(displayImg) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105">' +
            '<div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity"></div>' +
            '<div class="absolute top-3 left-3 right-3 flex items-center justify-between">' +
              '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md">🪔 ' + escapeHtml(product.diwaliOfferBadge || 'Diwali Special') + '</span>' +
              '<button type="button" data-wishlist-toggle="' + escapeHtml(product.id) + '" class="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#24211E] hover:text-[#C87D65] shadow-xs">' +
                '<span class="text-sm ' + (isWish ? 'text-[#C87D65]' : '') + '">' + (isWish ? '♥' : '♡') + '</span>' +
              '</button>' +
            '</div>' +
            '<div class="absolute bottom-3 left-3">' +
              '<span class="text-[10px] font-mono font-medium text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">' + escapeHtml(product.categoryLabel) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">' +
            '<div>' +
              swatchesHtml +
              '<h3 class="font-editorial text-lg sm:text-xl font-medium text-[#24211E] line-clamp-1 group-hover:text-[#8B2E1E] transition-colors">' + escapeHtml(product.name) + '</h3>' +
              '<p class="text-xs text-[#6B6158] font-light line-clamp-2 mt-1 mb-3">' + escapeHtml(product.tagline) + '</p>' +
            '</div>' +
            '<div class="pt-3 border-t border-[#F0EBE4] space-y-3">' +
              '<div class="flex items-baseline justify-between">' +
                '<div class="flex items-baseline gap-2">' +
                  '<span class="font-mono text-lg font-bold text-[#24211E]">' + formatINR(product.price) + '</span>' +
                  (product.compareAtPrice ? '<span class="font-mono text-xs text-[#8C827A] line-through">' + formatINR(product.compareAtPrice) + '</span>' : '') +
                '</div>' +
                '<span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">In Stock</span>' +
              '</div>' +
              '<div class="grid grid-cols-2 gap-2">' +
                '<button type="button" data-buy-now-id="' + escapeHtml(product.id) + '" class="py-2 px-3 rounded-xl text-xs font-semibold bg-[#24211E] hover:bg-[#3E3834] text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs">' +
                  '<span>Buy Now</span>' +
                '</button>' +
                '<button type="button" data-add-catalog-id="' + escapeHtml(product.id) + '" class="py-2 px-3 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-[#F5EFEB] text-[#24211E] border border-[#D9CFC4] flex items-center justify-center gap-1.5 transition-all active:scale-95">' +
                  '<span>Add to Bag</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    grid.innerHTML = html;
  }

  // =========================================================================
  // 3. FEATURED COLLECTION ASYMMETRIC & FILTERED GRID RENDERER
  // =========================================================================
  function renderCatalogCard(product, featuredLayout) {
    if (!product) return '';
    var selectedColorName = state.selectedColors[product.id] || (product.colors && product.colors[0] ? product.colors[0].name : 'Standard');
    var variantObj = (product.colors || []).find(function (c) { return c.name === selectedColorName; }) || (product.colors && product.colors[0]);
    var displayImg = (variantObj && variantObj.image) || product.primaryImage;
    var isWish = state.wishlist.indexOf(product.id) > -1;

    var dotsHtml = '';
    (product.colors || []).forEach(function (c) {
      var activeCls = c.name === selectedColorName
        ? 'ring-1 ring-[#24211E] ring-offset-1 border-[#24211E]'
        : 'border-black/20 hover:scale-110';
      dotsHtml +=
        '<button type="button" title="' + escapeHtml(c.name) + '" data-swatch-product="' + escapeHtml(product.id) + '" data-swatch-color="' + escapeHtml(c.name) + '" class="w-3.5 h-3.5 rounded-full border transition-all ' + activeCls + '" style="background-color:' + escapeHtml(c.hex) + '"></button>';
    });

    return (
      '<article data-open-product-id="' + escapeHtml(product.id) + '" class="group cursor-pointer flex flex-col bg-white rounded-xl border border-[#EAE2D8]/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(36,33,30,0.06)] hover:-translate-y-1 ' + (featuredLayout ? 'h-full' : '') + '">' +
        '<div class="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFEB]">' +
          '<img src="' + escapeHtml(displayImg) + '" alt="' + escapeHtml(product.name) + '" class="w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105" loading="lazy">' +
          (product.badge ? '<div class="absolute top-3 left-3"><span class="inline-block bg-[#FAF8F5]/90 backdrop-blur-xs text-[#24211E] text-[10px] tracking-wider uppercase font-medium px-2.5 py-1 rounded-sm border border-[#EAE2D8]">' + escapeHtml(product.badge) + '</span></div>' : '') +
          '<button type="button" data-wishlist-toggle="' + escapeHtml(product.id) + '" class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ' + (isWish ? 'bg-[#C87D65] text-white shadow-sm' : 'bg-white/80 backdrop-blur-xs text-[#4A443E] hover:text-[#24211E] hover:bg-white shadow-xs') + '" aria-label="Save to wishlist">' +
            '<span class="text-xs">' + (isWish ? '♥' : '♡') + '</span>' +
          '</button>' +
          '<div class="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">' +
            '<button type="button" data-add-catalog-id="' + escapeHtml(product.id) + '" class="w-full py-2.5 px-3 bg-[#24211E]/95 hover:bg-[#24211E] text-white text-xs font-medium tracking-wide rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95">' +
              '<span>+ Quick Add &middot; ' + formatINR(product.price) + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">' +
          '<div>' +
            '<div class="text-[11px] uppercase tracking-wider text-[#8C827A] font-medium mb-1">' + escapeHtml(product.categoryLabel) + '</div>' +
            '<h3 class="font-editorial text-lg sm:text-xl text-[#24211E] font-medium leading-snug group-hover:text-[#C87D65] transition-colors mb-1.5">' + escapeHtml(product.name) + '</h3>' +
            '<p class="text-xs text-[#6B6158] font-light line-clamp-2 leading-relaxed mb-3">' + escapeHtml(product.tagline) + '</p>' +
          '</div>' +
          '<div class="pt-3 border-t border-[#F0EBE4] flex items-center justify-between">' +
            '<div class="flex items-center gap-1.5">' + dotsHtml + '</div>' +
            '<div class="flex items-baseline gap-2 font-mono text-sm tabular-nums">' +
              '<span class="font-semibold text-[#24211E]">' + formatINR(product.price) + '</span>' +
              (product.compareAtPrice ? '<span class="text-xs text-[#A89E96] line-through">' + formatINR(product.compareAtPrice) + '</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderFeaturedCollection() {
    var root = document.getElementById('wolko-featured-collection-root');
    if (!root) return;

    var filtered = state.collectionTab === 'all'
      ? catalog
      : catalog.filter(function (p) { return p.category === state.collectionTab; });

    var countEl = document.getElementById('wolko-collection-count');
    if (countEl) countEl.textContent = filtered.length + ' pieces';

    if (state.collectionTab === 'all' && catalog.length >= 3) {
      var heroPiece = catalog[0];
      var restCards = '';
      for (var i = 3; i < catalog.length; i++) {
        restCards += renderCatalogCard(catalog[i], false);
      }

      root.innerHTML =
        '<div class="space-y-12">' +
          '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">' +
            '<div data-open-product-id="' + escapeHtml(heroPiece.id) + '" class="lg:col-span-7 group cursor-pointer relative bg-white rounded-2xl border border-[#EAE2D8] overflow-hidden flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(36,33,30,0.08)] transition-all duration-300">' +
              '<div class="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden bg-[#F5EFEB]">' +
                '<img src="' + escapeHtml(heroPiece.primaryImage) + '" alt="' + escapeHtml(heroPiece.name) + '" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out">' +
                '<div class="absolute top-4 left-4">' +
                  '<span class="bg-[#FAF8F5]/95 text-[#24211E] text-[11px] font-medium tracking-wider uppercase px-3 py-1 rounded-sm border border-[#EAE2D8]">Master Artisan Showcase</span>' +
                '</div>' +
              '</div>' +
              '<div class="p-6 sm:p-8 flex flex-col justify-between flex-1">' +
                '<div>' +
                  '<div class="flex items-center justify-between mb-2">' +
                    '<span class="text-xs uppercase tracking-wider text-[#8C827A] font-medium">' + escapeHtml(heroPiece.categoryLabel) + '</span>' +
                    '<span class="font-mono text-base font-semibold text-[#24211E] tabular-nums">' + formatINR(heroPiece.price) + '</span>' +
                  '</div>' +
                  '<h3 class="font-editorial text-2xl sm:text-3xl text-[#24211E] font-medium group-hover:text-[#C87D65] transition-colors mb-3">' + escapeHtml(heroPiece.name) + '</h3>' +
                  '<p class="text-sm text-[#574E45] font-light leading-relaxed max-w-xl mb-6">' + escapeHtml(heroPiece.description) + '</p>' +
                '</div>' +
                '<div class="pt-4 border-t border-[#F0EBE4] flex items-center justify-between">' +
                  '<div class="flex items-center gap-2 text-xs text-[#8C827A]">' +
                    '<span>6 Hours Hand Looming</span><span>&middot;</span><span>320m Merino Wool</span>' +
                  '</div>' +
                  '<span class="inline-flex items-center gap-1 text-xs font-medium text-[#24211E] group-hover:translate-x-1 transition-transform">' +
                    '<span>View Specifications</span><span>&#8599;</span>' +
                  '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="lg:col-span-5 flex flex-col gap-6 justify-between">' +
              renderCatalogCard(catalog[1], true) +
              renderCatalogCard(catalog[2], true) +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">' +
            restCards +
          '</div>' +
        '</div>';
    } else {
      var gridHtml = '';
      filtered.forEach(function (p) {
        gridHtml += renderCatalogCard(p, false);
      });
      root.innerHTML = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">' + gridHtml + '</div>';
    }
  }

  // =========================================================================
  // 4. 5-STAGE CRAFT JOURNEY INTERACTIVE STEPPER
  // =========================================================================
  var stageMeta = [
    {
      duration: '45 mins sorting',
      artisanRole: 'Master Fiber Grader',
      image: brandAssets.hero || '',
      specs: ['Hypoallergenic long-staple fleece', 'Zero chemical bleach or solvents', 'Naturally retains moisture-wicking lanolin']
    },
    {
      duration: '4.5 hours continuous looping',
      artisanRole: 'Master Finger-Looper',
      image: brandAssets.craftHands || '',
      specs: ['Continuous yarn thread (zero splices)', 'Calibrated human finger tension', '3D volumetric cloud cushioning']
    },
    {
      duration: '2.5 hours needlework',
      artisanRole: 'Botanical Embroiderer',
      image: brandAssets.cozyPouch || '',
      specs: ['Over 140 hand-stitched French knots', 'Tinted with vegetable-derived dyes', 'Freshwater mother-of-pearl accents']
    },
    {
      duration: '12 hours drying & rest',
      artisanRole: 'Steam Artisan',
      image: brandAssets.knitLaptopSleeve || '',
      specs: ['Cured on natural cedar wooden blocks', 'Gentle steam locks stitch elasticity', 'Zero chemical setting glues or binders']
    },
    {
      duration: 'Individual inspection',
      artisanRole: 'Studio Curator',
      image: brandAssets.giftBoxTrio || '',
      specs: ['Hand-numbered batch certificate', 'Seed paper box that sprouts herbs', 'Packed in reusable organic cotton pouch']
    }
  ];

  function renderCraftStep() {
    var card = document.getElementById('wolko-craft-card');
    if (!card || craftSteps.length === 0) return;

    var idx = state.craftStepIndex;
    var step = craftSteps[idx] || craftSteps[0];
    var meta = stageMeta[idx] || stageMeta[0];

    var labelEl = document.getElementById('wolko-craft-stage-label');
    if (labelEl) labelEl.textContent = 'Stage 0' + (idx + 1);

    var barEl = document.getElementById('wolko-craft-progress-bar');
    if (barEl) barEl.style.width = ((idx / (craftSteps.length - 1)) * 100) + '%';

    var stepBtns = document.querySelectorAll('.wolko-craft-step-btn');
    stepBtns.forEach(function (btn, bIdx) {
      if (bIdx === idx) {
        btn.className = 'wolko-craft-step-btn shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full border transition-all duration-300 bg-[#24211E] text-white border-[#24211E] shadow-sm';
      } else {
        btn.className = 'wolko-craft-step-btn shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full border transition-all duration-300 bg-white/80 text-[#6B6158] border-[#EAE2D8] hover:bg-white hover:text-[#24211E]';
      }
    });

    var specsHtml = '';
    meta.specs.forEach(function (s) {
      specsHtml +=
        '<div class="flex items-start gap-2.5 text-xs text-[#574E45]">' +
          '<span class="text-[#7B8A78] font-bold">✓</span>' +
          '<span class="font-light leading-tight">' + escapeHtml(s) + '</span>' +
        '</div>';
    });

    card.innerHTML =
      '<div class="grid grid-cols-1 lg:grid-cols-12 items-stretch">' +
        '<div class="lg:col-span-7 relative min-h-[320px] sm:min-h-[420px] lg:min-h-[480px] bg-[#F5EFEB] overflow-hidden">' +
          '<img src="' + escapeHtml(meta.image) + '" alt="' + escapeHtml(step.title) + '" class="w-full h-full object-cover object-center">' +
          '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>' +
          '<div class="absolute top-4 left-4 right-4 flex items-center justify-between z-10">' +
            '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#24211E] text-xs font-medium tracking-wider uppercase shadow-xs">✦ ' + escapeHtml(meta.artisanRole) + '</span>' +
            '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono">⏱ ' + escapeHtml(meta.duration) + '</span>' +
          '</div>' +
          '<div class="absolute bottom-4 left-4 right-4 z-10 text-white">' +
            '<div class="text-[10px] uppercase tracking-widest text-[#FAF8F5]/80 font-mono mb-1">Authentic Atelier Craft Documentation</div>' +
            '<p class="font-editorial text-lg sm:text-xl text-white font-medium">&ldquo;' + escapeHtml(step.subtitle) + '&rdquo;</p>' +
          '</div>' +
        '</div>' +
        '<div class="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-white">' +
          '<div>' +
            '<div class="flex items-center justify-between pb-4 mb-6 border-b border-[#F0EBE4]">' +
              '<span class="text-[11px] font-mono uppercase tracking-widest text-[#C87D65] font-semibold">Phase 0' + (idx + 1) + ' of 05</span>' +
              '<span class="text-xs text-[#8C827A] font-light">100% Handcrafted</span>' +
            '</div>' +
            '<h3 class="font-editorial text-2xl sm:text-4xl text-[#24211E] font-medium tracking-tight mb-4 leading-snug">' + escapeHtml(step.title) + '</h3>' +
            '<p class="text-sm sm:text-base text-[#4A443E] font-light leading-relaxed mb-6">' + escapeHtml(step.description) + '</p>' +
            '<div class="space-y-2.5 mb-8">' +
              '<span class="text-[10px] uppercase tracking-[0.2em] text-[#8C827A] font-medium block">Artisan Quality Standards</span>' +
              specsHtml +
            '</div>' +
          '</div>' +
          '<div class="pt-6 border-t border-[#F0EBE4] flex items-center justify-between gap-4">' +
            '<button type="button" data-craft-nav="-1" ' + (idx === 0 ? 'disabled' : '') + ' class="px-4 py-2.5 rounded-full border border-[#D9CFC4] text-xs font-medium text-[#4A443E] hover:text-[#24211E] disabled:opacity-30">&larr; Previous</button>' +
            '<button type="button" data-craft-nav="1" ' + (idx === craftSteps.length - 1 ? 'disabled' : '') + ' class="px-4 py-2.5 rounded-full bg-[#24211E] text-white text-xs font-medium disabled:opacity-30">Next Stage &rarr;</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // =========================================================================
  // 5. QUICK VIEW PRODUCT MODAL
  // =========================================================================
  function openProductModal(productId, initialColor) {
    var product = getProductById(productId);
    if (!product) return;

    var modal = document.getElementById('wolko-product-modal');
    var body = document.getElementById('wolko-product-modal-body');
    if (!modal || !body) return;

    var chosenColor = initialColor || state.selectedColors[product.id] || (product.colors && product.colors[0] ? product.colors[0].name : 'Standard');
    var colorObj = (product.colors || []).find(function (c) { return c.name === chosenColor; }) || (product.colors && product.colors[0]);
    var displayImg = (colorObj && colorObj.image) || product.primaryImage;

    var swatchesHtml = '';
    if (product.colors && product.colors.length > 0) {
      swatchesHtml += '<div class="mb-5"><span class="block text-[11px] uppercase tracking-wider text-[#8C827A] mb-2">Color Variant: <strong class="text-[#24211E]">' + escapeHtml(chosenColor) + '</strong></span><div class="flex items-center gap-2 flex-wrap">';
      product.colors.forEach(function (c) {
        var activeCls = c.name === chosenColor ? 'ring-2 ring-[#24211E] ring-offset-2' : 'ring-1 ring-[#D9CFC4]';
        swatchesHtml +=
          '<button type="button" data-modal-color-product="' + escapeHtml(product.id) + '" data-modal-color-name="' + escapeHtml(c.name) + '" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#EAE2D8] text-xs ' + activeCls + '">' +
            '<span class="w-3.5 h-3.5 rounded-full border border-black/15" style="background-color:' + escapeHtml(c.hex) + '"></span>' +
            '<span>' + escapeHtml(c.name) + '</span>' +
          '</button>';
      });
      swatchesHtml += '</div></div>';
    }

    var detailsHtml = '';
    (product.details || []).forEach(function (d) {
      detailsHtml += '<li class="flex items-start gap-2 text-xs text-[#574E45]"><span class="text-[#7B8A78]">•</span><span>' + escapeHtml(d) + '</span></li>';
    });

    var waNumber = config.whatsappPrimary || '918237323043';
    var waMsg = encodeURIComponent('Hi Wolko! I want to order *' + product.name + '* (Variant: ' + chosenColor + ') priced at ' + formatINR(product.price) + '.');

    body.innerHTML =
      '<div class="md:col-span-6 bg-[#F5EFEB] relative min-h-[340px] sm:min-h-[480px]">' +
        '<img src="' + escapeHtml(displayImg) + '" alt="' + escapeHtml(product.name) + '" class="w-full h-full object-cover">' +
        (product.badge ? '<span class="absolute top-4 left-4 bg-[#FAF8F5]/95 text-[#24211E] text-[10px] uppercase tracking-wider font-medium px-3 py-1 rounded-full border border-[#EAE2D8]">' + escapeHtml(product.badge) + '</span>' : '') +
      '</div>' +
      '<div class="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto bg-[#FAF8F5]">' +
        '<div>' +
          '<div class="text-[11px] uppercase tracking-widest text-[#8C827A] font-medium mb-1">' + escapeHtml(product.categoryLabel) + '</div>' +
          '<h2 class="font-editorial text-2xl sm:text-3xl text-[#24211E] font-medium mb-2">' + escapeHtml(product.name) + '</h2>' +
          '<div class="flex items-baseline gap-2.5 pb-4 mb-4 border-b border-[#EAE2D8]">' +
            '<span class="font-mono text-2xl font-bold text-[#24211E]">' + formatINR(product.price) + '</span>' +
            (product.compareAtPrice ? '<span class="font-mono text-sm text-[#8C827A] line-through">' + formatINR(product.compareAtPrice) + '</span>' : '') +
            '<span class="ml-auto text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">In Stock</span>' +
          '</div>' +
          '<p class="text-xs sm:text-sm text-[#4A443E] font-light leading-relaxed mb-4">' + escapeHtml(product.description) + '</p>' +
          swatchesHtml +
          '<div class="p-3.5 rounded-xl bg-[#F5EFEB] border border-[#EAE2D8] mb-4">' +
            '<span class="block text-[10px] uppercase tracking-widest text-[#C87D65] font-semibold mb-1">The Artisan Story</span>' +
            '<p class="text-xs text-[#574E45] font-light leading-relaxed">' + escapeHtml(product.story) + '</p>' +
          '</div>' +
          '<ul class="space-y-1.5 mb-6">' + detailsHtml + '</ul>' +
        '</div>' +
        '<div class="pt-4 border-t border-[#EAE2D8] space-y-2.5">' +
          '<div class="grid grid-cols-2 gap-2.5">' +
            '<button type="button" data-add-catalog-id="' + escapeHtml(product.id) + '" data-add-catalog-color="' + escapeHtml(chosenColor) + '" class="py-3 px-4 rounded-full bg-[#24211E] hover:bg-[#3A3530] text-white text-xs uppercase tracking-wider font-semibold transition-all">Add to Bag</button>' +
            '<button type="button" data-buy-now-id="' + escapeHtml(product.id) + '" data-buy-now-color="' + escapeHtml(chosenColor) + '" class="py-3 px-4 rounded-full bg-[#C87D65] hover:bg-[#b56c54] text-white text-xs uppercase tracking-wider font-semibold transition-all">Buy Now</button>' +
          '</div>' +
          '<a href="https://wa.me/' + waNumber + '?text=' + waMsg + '" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 px-4 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all">' +
            '<span>Order on WhatsApp (+' + waNumber + ')</span>' +
          '</a>' +
        '</div>' +
      '</div>';

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeProductModal() {
    var modal = document.getElementById('wolko-product-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // =========================================================================
  // 6. WISHLIST & SEARCH MODAL
  // =========================================================================
  function toggleWishlist(productId) {
    var idx = state.wishlist.indexOf(productId);
    if (idx > -1) {
      state.wishlist.splice(idx, 1);
    } else {
      state.wishlist.push(productId);
    }
    saveState();
    renderWishlistUI();
    renderDiwaliGrid();
    renderFeaturedCollection();
  }

  function renderWishlistUI() {
    var dot = document.getElementById('wolko-wishlist-dot');
    var countEl = document.getElementById('wolko-wishlist-drawer-count');
    var container = document.getElementById('wolko-wishlist-items');

    if (dot) {
      if (state.wishlist.length > 0) dot.classList.remove('hidden');
      else dot.classList.add('hidden');
    }
    if (countEl) countEl.textContent = '(' + state.wishlist.length + ')';
    if (!container) return;

    if (state.wishlist.length === 0) {
      container.innerHTML =
        '<div class="py-16 text-center">' +
          '<p class="font-editorial text-2xl text-[#24211E] mb-2">No saved pieces yet</p>' +
          '<p class="text-xs text-[#8C827A] font-light">Tap the heart icon on any handcrafted piece to save it for later.</p>' +
        '</div>';
      return;
    }

    var html = '';
    state.wishlist.forEach(function (id) {
      var p = getProductById(id);
      if (!p) return;
      html +=
        '<div class="py-4 flex items-center gap-4">' +
          '<img src="' + escapeHtml(p.primaryImage) + '" alt="' + escapeHtml(p.name) + '" class="w-16 h-16 rounded-lg object-cover border border-[#EAE2D8]">' +
          '<div class="flex-1">' +
            '<h4 class="font-editorial text-base text-[#24211E] font-medium">' + escapeHtml(p.name) + '</h4>' +
            '<span class="font-mono text-xs text-[#6B6158]">' + formatINR(p.price) + '</span>' +
          '</div>' +
          '<button type="button" data-add-catalog-id="' + escapeHtml(p.id) + '" class="px-3 py-1.5 rounded-full bg-[#24211E] text-white text-[11px] font-medium">Add to Bag</button>' +
          '<button type="button" data-wishlist-toggle="' + escapeHtml(p.id) + '" class="text-xs text-[#8C827A] hover:text-[#24211E] p-1">&#10005;</button>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function renderSearchResults(query) {
    var container = document.getElementById('wolko-search-results');
    if (!container) return;

    var q = String(query || '').trim().toLowerCase();
    var matches = catalog.filter(function (p) {
      if (!q) return true;
      return (
        (p.name && p.name.toLowerCase().indexOf(q) > -1) ||
        (p.tagline && p.tagline.toLowerCase().indexOf(q) > -1) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().indexOf(q) > -1) ||
        (q === 'diwali' && p.isDiwaliSpecial)
      );
    });

    if (matches.length === 0) {
      container.innerHTML = '<div class="py-8 text-center text-xs text-[#8C827A]">No matching handcrafted pieces found.</div>';
      return;
    }

    var html = '';
    matches.slice(0, 12).forEach(function (p) {
      html +=
        '<div data-open-product-id="' + escapeHtml(p.id) + '" class="py-3 px-2 flex items-center gap-4 hover:bg-white rounded-xl cursor-pointer transition-colors">' +
          '<img src="' + escapeHtml(p.primaryImage) + '" alt="' + escapeHtml(p.name) + '" class="w-14 h-14 rounded-lg object-cover border border-[#EAE2D8] shrink-0">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="text-[10px] uppercase tracking-wider text-[#8C827A]">' + escapeHtml(p.categoryLabel) + '</div>' +
            '<h4 class="font-editorial text-base text-[#24211E] font-medium truncate">' + escapeHtml(p.name) + '</h4>' +
            '<p class="text-xs text-[#6B6158] truncate font-light">' + escapeHtml(p.tagline) + '</p>' +
          '</div>' +
          '<span class="font-mono text-xs font-semibold text-[#24211E] shrink-0">' + formatINR(p.price) + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  // =========================================================================
  // 7. EVENT DELEGATION & INITIALIZATION
  // =========================================================================
  function initEvents() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!target || !target.closest) return;

      // Color Swatch on Card
      var swatchBtn = target.closest('[data-swatch-product]');
      if (swatchBtn) {
        e.stopPropagation();
        var pid = swatchBtn.getAttribute('data-swatch-product');
        var cname = swatchBtn.getAttribute('data-swatch-color');
        state.selectedColors[pid] = cname;
        renderDiwaliGrid();
        renderFeaturedCollection();
        return;
      }

      // Color Swatch inside Quick View Modal
      var modalColorBtn = target.closest('[data-modal-color-product]');
      if (modalColorBtn) {
        e.stopPropagation();
        var mPid = modalColorBtn.getAttribute('data-modal-color-product');
        var mColor = modalColorBtn.getAttribute('data-modal-color-name');
        state.selectedColors[mPid] = mColor;
        openProductModal(mPid, mColor);
        return;
      }

      // Wishlist Toggle
      var wishBtn = target.closest('[data-wishlist-toggle]');
      if (wishBtn) {
        e.stopPropagation();
        toggleWishlist(wishBtn.getAttribute('data-wishlist-toggle'));
        return;
      }

      // Native Shopify Variant Quick Add
      var nativeAddBtn = target.closest('[data-quick-add-variant]');
      if (nativeAddBtn) {
        e.stopPropagation();
        addNativeShopifyVariant(nativeAddBtn.getAttribute('data-quick-add-variant'), nativeAddBtn);
        return;
      }

      // Catalog Add to Bag
      var addCatBtn = target.closest('[data-add-catalog-id]');
      if (addCatBtn) {
        e.stopPropagation();
        var addId = addCatBtn.getAttribute('data-add-catalog-id');
        var addColor = addCatBtn.getAttribute('data-add-catalog-color') || state.selectedColors[addId];
        closeProductModal();
        addToBag(addId, addColor, 1, true);
        return;
      }

      // Buy Now
      var buyNowBtn = target.closest('[data-buy-now-id]');
      if (buyNowBtn) {
        e.stopPropagation();
        var buyId = buyNowBtn.getAttribute('data-buy-now-id');
        var buyColor = buyNowBtn.getAttribute('data-buy-now-color') || state.selectedColors[buyId];
        closeProductModal();
        addToBag(buyId, buyColor, 1, true);
        return;
      }

      // Open Product Quick View Modal
      var openProdEl = target.closest('[data-open-product-id]');
      if (openProdEl) {
        var prodId = openProdEl.getAttribute('data-open-product-id');
        var searchModal = document.getElementById('wolko-search-modal');
        if (searchModal) searchModal.classList.add('hidden');
        openProductModal(prodId);
        return;
      }

      // Close Product Modal
      if (target.closest('[data-close-product-modal]')) {
        closeProductModal();
        return;
      }

      // Cart Drawer Open / Close
      if (target.closest('[data-open-cart]')) {
        openCartDrawer();
        return;
      }
      if (target.closest('[data-close-cart]')) {
        closeCartDrawer();
        return;
      }

      // Cart Quantity +/-
      var qtyBtn = target.closest('[data-qty-id]');
      if (qtyBtn) {
        updateCartQty(
          qtyBtn.getAttribute('data-qty-id'),
          qtyBtn.getAttribute('data-qty-color'),
           parseInt(qtyBtn.getAttribute('data-qty-delta'), 10)
        );
        return;
      }

      // Remove Cart Item
      var rmBtn = target.closest('[data-remove-cart-id]');
      if (rmBtn) {
        removeCartItem(rmBtn.getAttribute('data-remove-cart-id'), rmBtn.getAttribute('data-remove-cart-color'));
        return;
      }

      // Gift Note Toggle
      if (target.closest('#wolko-gift-note-toggle')) {
        var box = document.getElementById('wolko-gift-note-box');
        if (box) box.classList.toggle('hidden');
        return;
      }

      // WhatsApp Checkout from Cart Drawer
      if (target.closest('#wolko-whatsapp-checkout-btn')) {
        var lines = state.cartItems.map(function (item) {
          return '• ' + item.name + ' (' + item.color + ') × ' + item.quantity + ' = ' + formatINR(item.price * item.quantity);
        });
        var total = state.cartItems.reduce(function (acc, item) { return acc + item.price * item.quantity; }, 0);
        var noteInput = document.getElementById('wolko-cart-note-input');
        var noteVal = noteInput ? noteInput.value.trim() : '';
        var msg = 'Hi Wolko! 🛍️ I would like to place an order:\n\n' + lines.join('\n') + '\n\n*Total: ' + formatINR(total) + '*' + (noteVal ? '\nGift Note: ' + noteVal : '');
        var waUrl = 'https://wa.me/' + (config.whatsappPrimary || '918237323043') + '?text=' + encodeURIComponent(msg);
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      // Wishlist Drawer Open / Close
      if (target.closest('[data-open-wishlist]')) {
        var wDrawer = document.getElementById('wolko-wishlist-drawer');
        if (wDrawer) wDrawer.classList.remove('hidden');
        return;
      }
      if (target.closest('[data-close-wishlist]')) {
        var wDrawerClose = document.getElementById('wolko-wishlist-drawer');
        if (wDrawerClose) wDrawerClose.classList.add('hidden');
        return;
      }

      // Search Modal Open / Close
      if (target.closest('[data-open-search]')) {
        var sModal = document.getElementById('wolko-search-modal');
        if (sModal) {
          sModal.classList.remove('hidden');
          renderSearchResults('');
          var sInput = document.getElementById('wolko-search-input');
          if (sInput) setTimeout(function () { sInput.focus(); }, 50);
        }
        return;
      }
      if (target.closest('[data-close-search]')) {
        var sModalClose = document.getElementById('wolko-search-modal');
        if (sModalClose) sModalClose.classList.add('hidden');
        return;
      }

      // Search Pill
      var sPill = target.closest('[data-search-pill]');
      if (sPill) {
        var pillVal = sPill.getAttribute('data-search-pill');
        var inp = document.getElementById('wolko-search-input');
        if (inp) inp.value = pillVal;
        renderSearchResults(pillVal);
        return;
      }

      // Mobile Menu Open / Close
      if (target.closest('[data-open-mobile-menu]')) {
        var mMenu = document.getElementById('wolko-mobile-menu');
        if (mMenu) {
          mMenu.classList.remove('hidden');
          mMenu.classList.add('flex');
        }
        return;
      }
      if (target.closest('[data-close-mobile-menu]')) {
        var mMenuClose = document.getElementById('wolko-mobile-menu');
        if (mMenuClose) {
          mMenuClose.classList.add('hidden');
          mMenuClose.classList.remove('flex');
        }
        return;
      }

      // Diwali Tab Switching
      var dTab = target.closest('[data-diwali-tab]');
      if (dTab) {
        state.diwaliTab = dTab.getAttribute('data-diwali-tab');
        document.querySelectorAll('.wolko-diwali-tab').forEach(function (btn) {
          if (btn.getAttribute('data-diwali-tab') === state.diwaliTab) {
            btn.className = 'wolko-diwali-tab px-4 sm:px-5 py-2 rounded-full text-xs font-medium transition-all bg-[#24211E] text-white shadow-sm';
          } else {
            btn.className = 'wolko-diwali-tab px-4 sm:px-5 py-2 rounded-full text-xs font-medium transition-all bg-white/80 text-[#6B6158] border border-[#EAE2D8] hover:border-[#24211E]';
          }
        });
        renderDiwaliGrid();
        return;
      }

      // Featured Collection Tab Switching
      var cTab = target.closest('[data-collection-tab]');
      if (cTab) {
        state.collectionTab = cTab.getAttribute('data-collection-tab');
        document.querySelectorAll('.wolko-collection-tab').forEach(function (btn) {
          if (btn.getAttribute('data-collection-tab') === state.collectionTab) {
            btn.className = 'wolko-collection-tab px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 bg-[#24211E] text-white shadow-xs';
          } else {
            btn.className = 'wolko-collection-tab px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 text-[#6B6158] hover:text-[#24211E] hover:bg-[#EAE2D8]/50';
          }
        });
        renderFeaturedCollection();
        return;
      }

      // Category Discovery Jump
      var catJump = target.closest('[data-category-jump]');
      if (catJump) {
        var targetCat = catJump.getAttribute('data-category-jump');
        state.collectionTab = targetCat;
        document.querySelectorAll('.wolko-collection-tab').forEach(function (btn) {
          if (btn.getAttribute('data-collection-tab') === state.collectionTab) {
            btn.className = 'wolko-collection-tab px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 bg-[#24211E] text-white shadow-xs';
          } else {
            btn.className = 'wolko-collection-tab px-3.5 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 text-[#6B6158] hover:text-[#24211E] hover:bg-[#EAE2D8]/50';
          }
        });
        renderFeaturedCollection();
        var colSec = document.getElementById('collection');
        if (colSec) colSec.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Craft Story Step Button
      var craftBtn = target.closest('[data-craft-step]');
      if (craftBtn) {
        state.craftStepIndex = parseInt(craftBtn.getAttribute('data-craft-step'), 10) || 0;
        renderCraftStep();
        return;
      }

      // Craft Story Prev / Next
      var craftNav = target.closest('[data-craft-nav]');
      if (craftNav) {
        var delta = parseInt(craftNav.getAttribute('data-craft-nav'), 10) || 0;
        state.craftStepIndex = Math.max(0, Math.min(craftSteps.length - 1, state.craftStepIndex + delta));
        renderCraftStep();
        return;
      }
    });

    // Search Input Listener
    var searchInp = document.getElementById('wolko-search-input');
    if (searchInp) {
      searchInp.addEventListener('input', function (e) {
        renderSearchResults(e.target.value);
      });
    }

    // Keyboard Shortcuts (⌘K / Ctrl+K & Escape)
    document.addEventListener('keydown', function (e) {
      if (e.key && e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        var sModal = document.getElementById('wolko-search-modal');
        if (sModal) {
          sModal.classList.toggle('hidden');
          renderSearchResults('');
          var sInput = document.getElementById('wolko-search-input');
          if (sInput && !sModal.classList.contains('hidden')) sInput.focus();
        }
      } else if (e.key === 'Escape') {
        closeProductModal();
        closeCartDrawer();
        var sModalEsc = document.getElementById('wolko-search-modal');
        if (sModalEsc) sModalEsc.classList.add('hidden');
        var wDrawerEsc = document.getElementById('wolko-wishlist-drawer');
        if (wDrawerEsc) wDrawerEsc.classList.add('hidden');
      }
    });

    // Support Shopify Theme Editor section reloads
    document.addEventListener('shopify:section:load', function () {
      renderDiwaliGrid();
      renderFeaturedCollection();
      renderCraftStep();
      renderWishlistUI();
      renderCartUI();
    });
  }

  function init() {
    renderDiwaliGrid();
    renderFeaturedCollection();
    renderCraftStep();
    renderWishlistUI();
    syncShopifyCart();
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
