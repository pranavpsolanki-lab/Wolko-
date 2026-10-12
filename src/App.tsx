/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShopProvider } from './context/ShopContext';
import { Preloader } from './components/Preloader';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Hero3DExperience } from './components/Hero3DExperience';
import { DiwaliSaleSection } from './components/DiwaliSaleSection';
import { BrandStatement } from './components/BrandStatement';
import { FeaturedCollection } from './components/FeaturedCollection';
import { CustomerCommentsWall } from './components/CustomerCommentsWall';
import { ProductScrollSection } from './components/ProductScrollSection';
import { CraftStory } from './components/CraftStory';
import { EditorialSpotlight } from './components/EditorialSpotlight';
import { CategoryDiscovery } from './components/CategoryDiscovery';
import { Marquee } from './components/Marquee';
import { AboutSection } from './components/AboutSection';
import { TrustProof } from './components/TrustProof';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductModal } from './components/ProductModal';
import { SearchModal } from './components/SearchModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerDashboardModal } from './components/CustomerDashboardModal';
import { CustomCursor } from './components/CustomCursor';

export default function App() {
  return (
    <ShopProvider>
      <div className="relative min-h-screen bg-[#FAF8F5] text-[#24211E] selection:bg-[#E2D2C3] selection:text-[#24211E]">
        {/* Custom cursor for desktop enhancement */}
        <CustomCursor />

        {/* Branded Preloader */}
        <Preloader />

        {/* Top Announcement Bar */}
        <AnnouncementBar />

        {/* Sticky Header */}
        <Header />

        {/* Main Content Sections */}
        <main>
          {/* 01. Cinematic Hero */}
          <Hero />

          {/* 02. Skiper31 3D Hyper-Realistic Spatial Scroll Animation */}
          <Hero3DExperience />

          {/* 03. Shubh Diwali Limited Atelier Sale & Festive Offers */}
          <DiwaliSaleSection />

          {/* 04. Editorial Brand Statement */}
          <BrandStatement />

          {/* 05. Curated Featured Collection with Asymmetric Grid */}
          <FeaturedCollection />

          {/* 05B. Live Public Customer Comment Box & Collector Wall */}
          <CustomerCommentsWall />

          {/* 06. Skiper16 Stacked Card Image Scroll Animation — The Tactile Archive */}
          <ProductScrollSection />

          {/* 07. Craft Story & Interactive 5-Step Timeline */}
          <CraftStory />

          {/* 08. Full-width Editorial Campaign Highlight */}
          <EditorialSpotlight />

          {/* 09. Category Discovery Cards */}
          <CategoryDiscovery />

          {/* 10. Infinite Subtle Marquee */}
          <Marquee />

          {/* 11. About Wolko & Indian Artisan Heritage */}
          <AboutSection />

          {/* 12. Social Proof & Material Trust */}
          <TrustProof />

          {/* 13. Final Cinematic CTA */}
          <FinalCta />
        </main>

        {/* 14. Editorial Footer */}
        <Footer />

        {/* Interactive Drawers & Overlays */}
        <CartDrawer />
        <ProductModal />
        <SearchModal />
        <WishlistDrawer />
        <CheckoutModal />
        <CustomerDashboardModal />
      </div>
    </ShopProvider>
  );
}

