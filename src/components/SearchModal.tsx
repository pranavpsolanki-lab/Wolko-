import React, { useMemo } from 'react';
import { SearchModal as VengeanceSearchModal, SearchResult, SearchTag, QuickAction, SearchFile } from './ui/search-modal';
import { useShop } from '../context/ShopContext';
import { PRODUCTS, Product } from '../data/products';
import { Sparkle, ShoppingBag, Eye, Heart } from 'lucide-react';
import { RadioButton, Users, Buildings } from '@phosphor-icons/react';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, openProductModal, addToCart } = useShop();

  const tags: SearchTag[] = useMemo(
    () => [
      { label: "Handmade Bags", icon: <RadioButton className="h-4 w-4" /> },
      { label: "Keychains & Charms", icon: <RadioButton className="h-4 w-4" /> },
      { label: "Embroidered Pouches", icon: <RadioButton className="h-4 w-4" /> },
      { label: "Gift Sets", icon: <RadioButton className="h-4 w-4" /> },
    ],
    []
  );

  const results: SearchResult[] = useMemo(
    () =>
      PRODUCTS.map((p) => ({
        name: p.name,
        meta: `${p.categoryLabel} · ₹${p.price.toLocaleString('en-IN')}`,
        avatar: p.primaryImage,
        actions: [
          {
            icon: <ShoppingBag className="h-3.5 w-3.5" />,
            label: "Add to Bag",
            onClick: () => {
              addToCart(p);
            },
          },
          {
            icon: <Eye className="h-3.5 w-3.5" />,
            label: "Explore",
            onClick: () => {
              setIsSearchOpen(false);
              openProductModal(p);
            },
          },
        ],
      })),
    [addToCart, openProductModal, setIsSearchOpen]
  );

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        label: "View Chunky Cloud Tote",
        shortcut: "T",
        onClick: () => {
          setIsSearchOpen(false);
          openProductModal(PRODUCTS[0]);
        },
      },
      {
        label: "View Botanical Daisy Charm",
        shortcut: "D",
        onClick: () => {
          setIsSearchOpen(false);
          openProductModal(PRODUCTS[1]);
        },
      },
      {
        label: "Scroll Tactile Archive",
        shortcut: "S",
        onClick: () => {
          setIsSearchOpen(false);
          document.getElementById("product-scroll")?.scrollIntoView({ behavior: "smooth" });
        },
      },
      {
        label: "WhatsApp Studio Artisan (+91 8237323043)",
        shortcut: "W",
        onClick: () => {
          window.open("https://wa.me/918237323043", "_blank");
        },
      },
    ],
    [openProductModal, setIsSearchOpen]
  );

  const files: SearchFile[] = useMemo(
    () => [
      {
        name: "Wolko-Artisan-Wool-Care-Guide",
        ext: ".pdf",
        verified: true,
      },
      {
        name: "Seeded-Plantable-Packaging-Instructions",
        ext: ".pdf",
        verified: true,
      },
      {
        name: "Indian-Women-Artisan-Fair-Wage-Pledge",
        ext: ".pdf",
        verified: true,
      },
    ],
    []
  );

  const handleSelectResult = (result: SearchResult) => {
    const product = PRODUCTS.find((p) => p.name === result.name);
    if (product) {
      setIsSearchOpen(false);
      openProductModal(product);
    }
  };

  return (
    <VengeanceSearchModal
      modal={true}
      open={isSearchOpen}
      onOpenChange={setIsSearchOpen}
      placeholder="Search Wolko handcrafted wool bags, charms, pouches, gifts..."
      tags={tags}
      results={results}
      quickActions={quickActions}
      files={files}
      onSelectResult={handleSelectResult}
      hotkey="k"
      closeOnEscape={true}
    />
  );
};
