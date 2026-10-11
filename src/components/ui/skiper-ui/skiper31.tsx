"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  scrollYProgress: MotionValue<number>;
  colorClass?: string;
};

export const CharacterV1 = ({
  char,
  index,
  centerIndex,
  scrollYProgress,
  colorClass = "text-[#24211E]",
}: CharacterProps) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  // GPU-accelerated smooth vertical translation without heavy spring loops
  const y = useTransform(
    scrollYProgress,
    [0, 0.42],
    [distanceFromCenter * 3.5, 0]
  );

  // Soft, subtle 3D rotational tilt
  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.42],
    [distanceFromCenter * 3, 0]
  );
  const rotateY = useTransform(
    scrollYProgress,
    [0, 0.42],
    [distanceFromCenter * 2, 0]
  );

  // Gentle, atmospheric opacity
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0.45, 1]
  );

  return (
    <motion.span
      className={cn(
        "inline-block font-editorial transform-gpu select-none will-change-transform",
        colorClass,
        isSpace ? "w-2 sm:w-4" : "px-[0.5px] sm:px-[1px]"
      )}
      style={{
        y,
        rotateX,
        rotateY,
        opacity,
        transformStyle: "preserve-3d",
      }}
    >
      {char}
    </motion.span>
  );
};

export type ItemCardProps = {
  item: {
    id?: string;
    title: string;
    subtitle?: string;
    image: string;
    badge?: string;
    tag?: string;
  };
  index: number;
  centerIndex: number;
  scrollYProgress: MotionValue<number>;
  onClick?: () => void;
};

export const CharacterV2 = ({
  item,
  index,
  centerIndex,
  scrollYProgress,
  onClick,
}: ItemCardProps) => {
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 20, 0]
  );
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.88, 1]);
  const y = useTransform(
    scrollYProgress,
    [0, 0.5],
    [Math.abs(distanceFromCenter) * 15, 0]
  );
  const rotateZ = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 3, 0]
  );

  return (
    <motion.div
      onClick={onClick}
      className="group relative cursor-pointer snap-center flex flex-col items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EAE2D8] shadow-[0_8px_24px_rgba(36,33,30,0.06)] hover:shadow-[0_16px_36px_rgba(36,33,30,0.12)] transition-shadow duration-300 transform-gpu will-change-transform w-[78vw] max-w-[260px] sm:w-48 md:w-52 shrink-0 select-none"
      style={{
        x,
        scale,
        y,
        rotateZ,
        transformOrigin: "center",
      }}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#F5EFEB] mb-3">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
        />
        {item.badge && (
          <span className="absolute top-2.5 left-2.5 text-[9px] font-medium tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FAF8F5]/95 text-[#24211E] border border-[#EAE2D8] shadow-xs">
            {item.badge}
          </span>
        )}
      </div>
      <div className="w-full text-center">
        <h4 className="font-editorial text-sm sm:text-base font-medium text-[#24211E] line-clamp-1 group-hover:text-[#C87D65] transition-colors">
          {item.title}
        </h4>
        {item.subtitle && (
          <span className="text-[11px] text-[#8C827A] font-light line-clamp-1 mt-0.5 block">
            {item.subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const CharacterV3 = ({
  item,
  index,
  centerIndex,
  scrollYProgress,
  onClick,
}: ItemCardProps) => {
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 30, 0]
  );
  const rotate = useTransform(
    scrollYProgress,
    [0, 0.5],
    [distanceFromCenter * 8, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [0, 0.5],
    [-Math.abs(distanceFromCenter) * 10, 0]
  );
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1]);

  return (
    <motion.div
      onClick={onClick}
      className="group relative cursor-pointer snap-center flex flex-col items-center justify-between p-3.5 sm:p-5 rounded-3xl bg-white border border-[#EAE2D8] shadow-[0_10px_30px_rgba(36,33,30,0.08)] hover:shadow-[0_20px_45px_rgba(36,33,30,0.15)] hover:border-[#24211E] transition-shadow duration-300 transform-gpu will-change-transform w-[82vw] max-w-[280px] sm:w-56 md:w-60 shrink-0 select-none"
      style={{
        x,
        rotate,
        y,
        scale,
        transformOrigin: "center",
      }}
    >
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#FAF8F5] mb-3">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
        {item.tag && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#24211E]/90 text-white shadow-xs">
            {item.tag}
          </span>
        )}
      </div>
      <div className="w-full text-left">
        <h4 className="font-editorial text-base sm:text-lg font-medium text-[#24211E] group-hover:text-[#C87D65] transition-colors line-clamp-1">
          {item.title}
        </h4>
        {item.subtitle && (
          <p className="text-xs text-[#6B6158] font-light line-clamp-1 mt-0.5">
            {item.subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export const Bracket = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 27 78"
      className={cn("h-7 sm:h-12 text-[#24211E] shrink-0", className)}
    >
      <path
        fill="currentColor"
        d="M26.52 77.21h-5.75c-6.83 0-12.38-5.56-12.38-12.38V48.38C8.39 43.76 4.63 40 .01 40v-4c4.62 0 8.38-3.76 8.38-8.38V12.4C8.38 5.56 13.94 0 20.77 0h5.75v4h-5.75c-4.62 0-8.38 3.76-8.38 8.38V27.6c0 4.34-2.25 8.17-5.64 10.38 3.39 2.21 5.64 6.04 5.64 10.38v16.45c0 4.62 3.76 8.38 8.38 8.38h5.75v4.02Z"
      />
    </svg>
  );
};

export interface Skiper31Props {
  headline?: string;
  tagline?: string;
  items?: Array<{
    id?: string;
    title: string;
    subtitle?: string;
    image: string;
    badge?: string;
    tag?: string;
  }>;
  onSelectItem?: (item: any, index: number) => void;
  className?: string;
}

export const Skiper31: React.FC<Skiper31Props> = ({
  headline = "WOVEN BY HAND",
  tagline = "A 3D spatial celebration of slow craft, human patience & tactile merino wool",
  items = [],
  onSelectItem,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef1 = useRef<HTMLDivElement | null>(null);
  const targetRef2 = useRef<HTMLDivElement | null>(null);

  const carouselRef2 = useRef<HTMLDivElement | null>(null);

  const [activeIndex2, setActiveIndex2] = useState(0);
  const [isPaused2, setIsPaused2] = useState(false);
  const [isInView2, setIsInView2] = useState(false);

  const { scrollYProgress: scrollYProgress1 } = useScroll({
    target: targetRef1,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress: scrollYProgress2 } = useScroll({
    target: targetRef2,
    offset: ["start end", "end start"],
  });

  const characters = headline.split("");
  const words = headline.split(" ");
  const centerIndex = Math.floor(characters.length / 2);

  const displayItems = items;
  const itemCenterIndex = Math.floor(displayItems.length / 2);

  // Strictly scroll the container horizontally WITHOUT touching the window or page screen
  const scrollToIndex = useCallback((carousel: HTMLDivElement | null, index: number) => {
    if (!carousel) return;
    const cards = carousel.querySelectorAll<HTMLElement>('.snap-center');
    const targetCard = cards[index];
    if (targetCard) {
      const containerWidth = carousel.clientWidth;
      const cardLeft = targetCard.offsetLeft;
      const cardWidth = targetCard.offsetWidth;
      const targetScrollLeft = cardLeft - (containerWidth - cardWidth) / 2;

      carousel.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, []);

  const handleNext2 = useCallback(() => {
    setActiveIndex2((prev) => {
      const next = (prev + 1) % displayItems.length;
      scrollToIndex(carouselRef2.current, next);
      return next;
    });
  }, [displayItems.length, scrollToIndex]);

  const handlePrev2 = useCallback(() => {
    setActiveIndex2((prev) => {
      const next = (prev - 1 + displayItems.length) % displayItems.length;
      scrollToIndex(carouselRef2.current, next);
      return next;
    });
  }, [displayItems.length, scrollToIndex]);

  // Track visibility with IntersectionObserver so auto-scroll only runs when user looks at the section
  useEffect(() => {
    const observer2 = new IntersectionObserver(
      ([entry]) => {
        setIsInView2(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    if (targetRef2.current) observer2.observe(targetRef2.current);

    return () => {
      observer2.disconnect();
    };
  }, []);

  // Automatic 3-second gentle progression ONLY for cards inside the container (page never moves)
  useEffect(() => {
    if (!isInView2 || isPaused2 || displayItems.length <= 1) return;
    const timer = setInterval(() => {
      handleNext2();
    }, 3000);
    return () => clearInterval(timer);
  }, [isInView2, isPaused2, displayItems.length, handleNext2]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full relative overflow-hidden bg-[#FAF8F5]", className)}
    >
      {/* 3D Scene 1: Letter-by-letter 3D perspective convergence */}
      <div
        ref={targetRef1}
        className="relative box-border flex flex-col min-h-[60vh] sm:min-h-[75vh] items-center justify-center overflow-hidden py-14 px-4"
      >
        <div className="text-center mb-6 max-w-md mx-auto">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8C827A] font-medium block mb-1.5">
            3D Spatial Craft Convergence
          </span>
          <p className="text-xs sm:text-sm text-[#6B6158] font-light">
            Scroll down to watch each sculpted letter and piece align softly in 3D space
          </p>
        </div>

        <div
          className="w-full max-w-5xl flex flex-wrap items-center justify-center gap-x-3.5 sm:gap-x-7 gap-y-2 text-center text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold uppercase tracking-wide text-[#24211E] py-4"
          style={{
            perspective: "900px",
          }}
        >
          {words.map((word, wIdx) => {
            const wordStartIdx = words.slice(0, wIdx).join(" ").length + (wIdx > 0 ? 1 : 0);
            return (
              <span key={wIdx} className="inline-flex items-center whitespace-nowrap">
                {word.split("").map((char, cIdx) => (
                  <CharacterV1
                    key={cIdx}
                    char={char}
                    index={wordStartIdx + cIdx}
                    centerIndex={centerIndex}
                    scrollYProgress={scrollYProgress1}
                    colorClass={wIdx === 1 ? "text-[#C87D65]" : "text-[#24211E]"}
                  />
                ))}
              </span>
            );
          })}
        </div>

        <p className="text-xs sm:text-base text-[#574E45] font-editorial italic mt-4 text-center max-w-xl px-4">
          {tagline}
        </p>
      </div>

      {/* 3D Scene 2: Converging Artifact Cards in 3D Arc with Left/Right Arrows & Auto-Scroll */}
      <div
        ref={targetRef2}
        className="relative box-border flex flex-col min-h-[65vh] sm:min-h-[75vh] items-center justify-center overflow-hidden py-14 px-4 bg-[#F5EFEB]/60 border-t border-[#EAE2D8]"
        onMouseEnter={() => setIsPaused2(true)}
        onMouseLeave={() => setIsPaused2(false)}
        onTouchStart={() => setIsPaused2(true)}
        onTouchEnd={() => {
          setTimeout(() => setIsPaused2(false), 2500);
        }}
      >
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-6 text-center px-4">
          <Bracket className="h-8 sm:h-12 text-[#8C827A]" />
          <div>
            <h3 className="font-editorial text-2xl sm:text-4xl text-[#24211E] font-medium tracking-tight">
              Tactile Material Ecosystem
            </h3>
            <span className="text-[10px] sm:text-[11px] text-[#8C827A] uppercase tracking-wider block mt-1 font-light">
              3-Second Auto-Scroll · Tap Cards to Explore
            </span>
          </div>
          <Bracket className="h-8 sm:h-12 scale-x-[-1] text-[#8C827A]" />
        </div>

        {/* Carousel Wrapper with Floating Navigation Arrows */}
        <div className="relative w-full max-w-6xl mx-auto flex items-center">
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev2}
            className="absolute left-1 sm:left-4 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#24211E] border border-[#EAE2D8] shadow-[0_4px_16px_rgba(36,33,30,0.12)] flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 focus:outline-none"
            aria-label="Previous artisan piece"
          >
            <ChevronLeft className="w-5 h-5 text-[#24211E]" />
          </button>

          {/* Cards Scroll Container */}
          <div
            ref={carouselRef2}
            className="w-full flex items-center gap-4 sm:gap-6 overflow-x-auto py-6 px-12 sm:px-16 scroll-smooth snap-x snap-mandatory scrollbar-none"
            style={{
              perspective: "900px",
            }}
          >
            {displayItems.map((item, index) => (
              <CharacterV2
                key={index}
                item={item}
                index={index}
                centerIndex={itemCenterIndex}
                scrollYProgress={scrollYProgress2}
                onClick={() => onSelectItem?.(item, index)}
              />
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext2}
            className="absolute right-1 sm:right-4 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-[#24211E] border border-[#EAE2D8] shadow-[0_4px_16px_rgba(36,33,30,0.12)] flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 focus:outline-none"
            aria-label="Next artisan piece"
          >
            <ChevronRight className="w-5 h-5 text-[#24211E]" />
          </button>
        </div>

        {/* Interactive Dots Pagination */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {displayItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex2(idx);
                scrollToIndex(carouselRef2.current, idx);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                activeIndex2 === idx
                  ? "w-6 bg-[#24211E]"
                  : "w-1.5 bg-[#D9CFC4] hover:bg-[#8C827A]"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skiper31;
