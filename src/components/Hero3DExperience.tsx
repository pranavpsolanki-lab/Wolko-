import React from 'react';
import { Skiper31 } from './ui/skiper-ui/skiper31';
import { PRODUCTS } from '../data/products';
import { useShop } from '../context/ShopContext';

export const Hero3DExperience: React.FC = () => {
  const { openProductModal } = useShop();

  // Select unique products for the 3D Spatial Experience without any repetition
  const uniqueItems = [
    {
      id: 'tulip-botanical-charm',
      title: 'Pastel Petal Tulip Bag Charm',
      subtitle: 'Hand-knitted blossom with brass swivel clip',
      image: PRODUCTS.find((p) => p.id === 'tulip-botanical-charm')?.primaryImage || '',
      badge: 'Limited Run',
      tag: '₹850',
    },
    {
      id: 'heritage-cable-laptop-sleeve',
      title: 'Heritage Felt & Cable Laptop Sleeve',
      subtitle: '4mm organic pressed wool with wood toggle',
      image: PRODUCTS.find((p) => p.id === 'heritage-cable-laptop-sleeve')?.primaryImage || '',
      badge: 'Everyday Cozy',
      tag: '₹2,450',
    },
    {
      id: 'wild-buttercup-coin-purse',
      title: 'Wild Buttercup Round Coin Pouch',
      subtitle: 'Embroidered merino felt with antique zipper',
      image: PRODUCTS.find((p) => p.id === 'wild-buttercup-coin-purse')?.primaryImage || '',
      badge: 'Hand-Stitched',
      tag: '₹1,150',
    },
    {
      id: 'artisan-blossom-trio-gift-box',
      title: 'The Botanical Charm Gift Trio',
      subtitle: 'Packaged in seeded plantable cotton box',
      image: PRODUCTS.find((p) => p.id === 'artisan-blossom-trio-gift-box')?.primaryImage || '',
      badge: 'Gift Ready',
      tag: '₹2,150',
    },
  ];

  const handleSelectItem = (item: any) => {
    const product = PRODUCTS.find((p) => p.id === item.id || p.name === item.title);
    if (product) {
      openProductModal(product);
    }
  };

  return (
    <section id="hero-3d-experience" className="relative border-b border-[#EAE2D8]">
      <Skiper31
        headline="WOVEN BY HAND"
        tagline="A 3D spatial celebration of slow craft, human patience & tactile merino wool"
        items={uniqueItems}
        onSelectItem={handleSelectItem}
      />
    </section>
  );
};

export default Hero3DExperience;
