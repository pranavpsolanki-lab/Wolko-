import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CRAFT_STEPS, BRAND_ASSETS } from '../data/products';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Leaf, 
  Layers, 
  Feather, 
  Scissors, 
  PackageCheck 
} from 'lucide-react';

interface StageMeta {
  duration: string;
  artisanRole: string;
  image: string;
  icon: React.ReactNode;
  specs: string[];
}

const STAGE_METADATA: StageMeta[] = [
  {
    duration: '45 mins sorting',
    artisanRole: 'Master Fiber Grader',
    image: BRAND_ASSETS.hero,
    icon: <Leaf className="w-4 h-4 text-[#7B8A78]" />,
    specs: ['Hypoallergenic long-staple fleece', 'Zero chemical bleach or solvents', 'Naturally retains moisture-wicking lanolin']
  },
  {
    duration: '4.5 hours continuous looping',
    artisanRole: 'Master Finger-Looper',
    image: BRAND_ASSETS.craftHands,
    icon: <Layers className="w-4 h-4 text-[#C87D65]" />,
    specs: ['Continuous yarn thread (zero splices)', 'Calibrated human finger tension', '3D volumetric cloud cushioning']
  },
  {
    duration: '2.5 hours needlework',
    artisanRole: 'Botanical Embroiderer',
    image: BRAND_ASSETS.cozyPouch,
    icon: <Scissors className="w-4 h-4 text-[#7B8A78]" />,
    specs: ['Over 140 hand-stitched French knots', 'Tinted with vegetable-derived dyes', 'Freshwater mother-of-pearl accents']
  },
  {
    duration: '12 hours drying & rest',
    artisanRole: 'Steam Artisan',
    image: BRAND_ASSETS.knitLaptopSleeve,
    icon: <Feather className="w-4 h-4 text-[#C87D65]" />,
    specs: ['Cured on natural cedar wooden blocks', 'Gentle steam locks stitch elasticity', 'Zero chemical setting glues or binders']
  },
  {
    duration: 'Individual inspection',
    artisanRole: 'Studio Curator',
    image: BRAND_ASSETS.giftBoxTrio,
    icon: <PackageCheck className="w-4 h-4 text-[#7B8A78]" />,
    specs: ['Hand-numbered batch certificate', 'Seed paper box that sprouts herbs', 'Packed in reusable organic cotton pouch']
  }
];

export const CraftStory: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = CRAFT_STEPS[activeStepIndex];
  const meta = STAGE_METADATA[activeStepIndex];

  const handlePrev = () => {
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveStepIndex((prev) => Math.min(CRAFT_STEPS.length - 1, prev + 1));
  };

  return (
    <section id="craft-story" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] border-t border-[#EAE2D8]">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Heading */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#8C827A] font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C87D65]" />
            <span>The Philosophy of Slow Hands</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#24211E] font-normal tracking-tight leading-[1.12] mb-6">
            Made slowly. <br />
            <span className="italic text-[#8C9A86]">Because good things take time.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#574E45] font-light leading-relaxed">
            In our Indian artisan ateliers, we deliberately reject industrial assembly lines. Every Wolko creation begins as raw ethical merino wool roving, patiently sculpted row by row using fingers and traditional wooden hooks.
          </p>
        </div>

        {/* 01. HORIZONTAL PROGRESS STEPPER (Unified, responsive, non-clunky) */}
        <div id="process" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-[#8C827A] font-medium">
              5-Stage Craft Journey
            </span>
            <div className="flex items-center gap-2 text-xs font-mono text-[#24211E]">
              <span className="text-[#C87D65] font-bold">Stage 0{activeStepIndex + 1}</span>
              <span className="text-[#D9CFC4]">/</span>
              <span className="text-[#8C827A]">05</span>
            </div>
          </div>

          {/* Stepper Navigation Pills with Progress Rail */}
          <div className="relative">
            {/* Background Track */}
            <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#EAE2D8] -translate-y-1/2 z-0" />
            
            {/* Active Progress Fill */}
            <div 
              className="hidden sm:block absolute top-1/2 left-0 h-0.5 bg-[#24211E] -translate-y-1/2 z-0 transition-all duration-500 ease-out"
              style={{ width: `${(activeStepIndex / (CRAFT_STEPS.length - 1)) * 100}%` }}
            />

            {/* Stepper Buttons (Responsive, horizontal scrollable on mobile) */}
            <div className="relative z-10 flex items-center justify-between gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x">
              {CRAFT_STEPS.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;

                return (
                  <button
                    key={step.number}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`shrink-0 snap-start flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full border transition-all duration-300 text-left focus:outline-none ${
                      isActive
                        ? 'bg-[#24211E] text-white border-[#24211E] shadow-sm scale-102'
                        : isPassed
                        ? 'bg-white text-[#24211E] border-[#C87D65]/40 hover:border-[#24211E]'
                        : 'bg-white/80 text-[#6B6158] border-[#EAE2D8] hover:bg-white hover:text-[#24211E]'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-semibold ${
                        isActive
                          ? 'bg-[#FAF8F5] text-[#24211E]'
                          : isPassed
                          ? 'bg-[#C87D65] text-white'
                          : 'bg-[#F5EFEB] text-[#8C827A]'
                      }`}
                    >
                      {step.number}
                    </span>
                    <span className="text-xs font-medium tracking-wide whitespace-nowrap">
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 02. INTERACTIVE STAGE SHOWCASE CARD (Magazine Style) */}
        <div className="bg-white rounded-3xl border border-[#EAE2D8] shadow-[0_12px_40px_rgba(36,33,30,0.06)] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStepIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 items-stretch"
            >
              {/* Left Column: Visual Documentary Artwork (7 cols) */}
              <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[420px] lg:min-h-[500px] bg-[#F5EFEB] overflow-hidden">
                <img
                  src={meta.image}
                  alt={activeStep.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-103"
                />
                
                {/* Visual Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/40 text-[#24211E] text-xs font-medium tracking-wider uppercase shadow-xs">
                    {meta.icon}
                    <span>{meta.artisanRole}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#E8B4B8]" />
                    <span>{meta.duration}</span>
                  </span>
                </div>

                {/* Bottom Documentary Legend */}
                <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                  <div className="text-[10px] uppercase tracking-widest text-[#FAF8F5]/80 font-mono mb-1">
                    Authentic Atelier Craft Documentation
                  </div>
                  <p className="font-editorial text-lg sm:text-xl text-white font-medium drop-shadow-sm">
                    "{activeStep.subtitle}"
                  </p>
                </div>
              </div>

              {/* Right Column: Stage Story & Technical Breakdown (5 cols) */}
              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-white">
                <div>
                  {/* Stage Meta Header */}
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F0EBE4]">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#C87D65] font-semibold">
                      Phase 0{activeStepIndex + 1} of 05
                    </span>
                    <span className="text-xs text-[#8C827A] font-light">
                      100% Handcrafted
                    </span>
                  </div>

                  {/* Stage Title */}
                  <h3 className="font-editorial text-2xl sm:text-4xl text-[#24211E] font-medium tracking-tight mb-4 leading-snug">
                    {activeStep.title}
                  </h3>

                  {/* Stage Description */}
                  <p className="text-sm sm:text-base text-[#4A443E] font-light leading-relaxed mb-6">
                    {activeStep.description}
                  </p>

                  {/* Quality Checklist Specifications */}
                  <div className="space-y-2.5 mb-8">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C827A] font-medium block">
                      Artisan Quality Standards
                    </span>
                    {meta.specs.map((spec, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#574E45]">
                        <CheckCircle2 className="w-4 h-4 text-[#7B8A78] shrink-0 mt-0.5" />
                        <span className="font-light leading-tight">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Action Footer */}
                <div className="pt-6 border-t border-[#F0EBE4] flex items-center justify-between gap-4">
                  <button
                    disabled={activeStepIndex === 0}
                    onClick={handlePrev}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#D9CFC4] text-xs font-medium text-[#4A443E] hover:text-[#24211E] hover:border-[#24211E] disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {CRAFT_STEPS.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setActiveStepIndex(dotIdx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          dotIdx === activeStepIndex
                            ? 'w-6 bg-[#24211E]'
                            : 'w-1.5 bg-[#D9CFC4] hover:bg-[#8C827A]'
                        }`}
                        aria-label={`Jump to stage ${dotIdx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    disabled={activeStepIndex === CRAFT_STEPS.length - 1}
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#24211E] text-white hover:bg-[#3A3530] text-xs font-medium disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default CraftStory;
