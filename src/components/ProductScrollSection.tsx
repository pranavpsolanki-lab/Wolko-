import React from 'react';
import { Skiper16, SkiperProject } from './ui/skiper-ui/skiper16';
import { PRODUCTS } from '../data/products';
import { useShop } from '../context/ShopContext';

export const ProductScrollSection: React.FC = () => {
  const { openProductModal } = useShop();

  // Distinct selection with ZERO repetition from the Hero 3D section
  const targetIds = [
    'chunky-cloud-tote',
    'daisy-botanical-keychain',
    'heritage-embroidered-pouch',
    'slouchy-sage-knit-hobo',
    'woolen-twist-mug-cozy',
  ];

  const items: SkiperProject[] = targetIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({
      id: p!.id,
      title: p!.name,
      subtitle: p!.tagline,
      category: p!.categoryLabel,
      price: p!.price,
      badge: p!.badge || 'Studio Exclusive',
      src: p!.primaryImage,
    }));

  const handleSelect = (proj: SkiperProject) => {
    const matched = PRODUCTS.find((p) => p.id === proj.id || p.name === proj.title);
    if (matched) {
      openProductModal(matched);
    }
  };

  return (
    <section id="product-scroll" className="relative bg-[#F5EFEB] border-t border-[#EAE2D8]">
      <Skiper16 items={items} onSelectProject={handleSelect} />
    </section>
  );
};
