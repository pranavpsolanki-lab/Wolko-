/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { ShopProvider } from './context/ShopContext';
import { Preloader } from './components/Preloader';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Hero3DExperience } from './components/Hero3DExperience';
import { DiwaliSaleSection } from './components/DiwaliSaleSection';
import { BrandStatement } from './components/BrandStatement';
import { FeaturedCollection } from './components/FeaturedCollection';
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
import { AiVoiceCallAgent } from './components/AiVoiceCallAgent';
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

        {/* Floating WhatsApp Quick Action Button */}
        <a
          href="https://wa.me/918237323043?text=Hi%20Wolko!%20I%20have%20an%20inquiry%20about%20your%20handcrafted%20crochet%20collection."
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
          title="Chat with Wolko on WhatsApp (+91 82373 23043)"
          aria-label="WhatsApp Support (+91 82373 23043)"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 fill-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-[#25D366] animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-[#25D366]" />
          </div>
          <span className="hidden sm:inline font-sans text-xs font-semibold tracking-wide">
            Order on WhatsApp
          </span>
        </a>

        {/* Interactive Drawers & Overlays */}
        <CartDrawer />
        <ProductModal />
        <SearchModal />
        <WishlistDrawer />
        <CheckoutModal />
        <AiVoiceCallAgent />
      </div>
    </ShopProvider>
  );
}
