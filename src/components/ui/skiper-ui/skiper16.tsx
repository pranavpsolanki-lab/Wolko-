"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

export interface SkiperProject {
  id?: string;
  title: string;
  subtitle?: string;
  category?: string;
  price?: number;
  badge?: string;
  src: string;
  onClick?: () => void;
}

const defaultProjects: SkiperProject[] = [
  {
    title: "The Wolko Chunky Cloud Tote",
    subtitle: "Hand-looped merino wool everyday carry with soft structured handles",
    category: "Handmade Bags",
    price: 3450,
    badge: "Artisan Signature",
    src: "/image.png",
  },
  {
    title: "Hand-Embroidered Daisy Charm",
    subtitle: "Delicate wool blossom with mother-of-pearl center and brushed brass clasp",
    category: "Keychains & Charms",
    price: 790,
    badge: "Bestseller",
    src: "/image.png",
  },
  {
    title: "Flora Embroidered Wool Pouch",
    subtitle: "Muted sage merino felt zip pouch with botanical French knot needlework",
    category: "Cozy Pouches",
    price: 1850,
    badge: "New Arrival",
    src: "/image.png",
  },
  {
    title: "The Botanical Charm Gift Trio",
    subtitle: "Curated set of 3 hand-stitched charms packaged in a letterpress keepsake box",
    category: "Gift Sets",
    price: 2150,
    badge: "Gift Ready",
    src: "/image.png",
  },
  {
    title: "The Petite Handheld Knit Clutch",
    subtitle: "Chunky braided wool evening pouch with hidden magnetic closure",
    category: "Limited Run",
    price: 2650,
    badge: "Small Batch",
    src: "/image.png",
  },
];

const StickyCard_001 = ({
  i,
  title,
  subtitle,
  category,
  price,
  badge,
  src,
  onClick,
  progress,
  range,
  targetScale,
}: {
  i: number;
  title: string;
  subtitle?: string;
  category?: string;
  price?: number;
  badge?: string;
  src: string;
  onClick?: () => void;
  progress: any;
  range: [number, number];
  targetScale: number;
}) => {
  const container = useRef<HTMLDivElement>(null);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={container}
      className="sticky top-14 sm:top-20 md:top-24 flex items-center justify-center pointer-events-auto px-3"
    >
      <motion.div
        style={{
          scale,
          top: `calc(12px + ${i * 18}px)`,
        }}
        onClick={onClick}
        className="group cursor-pointer relative flex h-[350px] sm:h-[430px] md:h-[480px] w-[94vw] max-w-[720px] origin-top flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-[#EAE2D8] shadow-[0_12px_40px_rgba(36,33,30,0.1)] hover:shadow-[0_24px_60px_rgba(36,33,30,0.16)] transition-shadow duration-300 transform-gpu will-change-transform"
      >
        {/* Full Card Image Background with Subtle Gradient Overlay */}
        <div className="relative w-full h-[65%] sm:h-[70%] overflow-hidden bg-[#F5EFEB]">
          <img
            src={src}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            {badge && (
              <span className="inline-flex items-center gap-1.5 bg-[#FAF8F5]/95 backdrop-blur-xs text-[#24211E] text-[11px] font-medium tracking-wider uppercase px-3 py-1.5 rounded-full border border-[#EAE2D8] shadow-xs">
                <Sparkles className="w-3 h-3 text-[#C87D65]" />
                {badge}
              </span>
            )}
            <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs text-[#24211E] border border-[#EAE2D8]">
              0{i + 1} / 05
            </span>
          </div>

          {category && (
            <div className="absolute bottom-4 left-4">
              <span className="text-xs uppercase tracking-widest text-[#FAF8F5] drop-shadow-md font-medium">
                {category}
              </span>
            </div>
          )}
        </div>

        {/* Card Content Footer */}
        <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-start justify-between gap-4 mb-1">
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#24211E] font-medium leading-tight group-hover:text-[#C87D65] transition-colors">
                {title}
              </h3>
              {price && (
                <span className="font-mono text-lg sm:text-xl font-semibold text-[#24211E] tabular-nums shrink-0">
                  ₹{price.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#6B6158] font-light line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-[#F0EBE4] flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#8C827A]">
              Pure Merino Wool · Handcrafted in India
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#24211E] group-hover:translate-x-1 transition-transform">
              <span>Explore Piece</span>
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export interface Skiper16Props {
  items?: SkiperProject[];
  className?: string;
  onSelectProject?: (project: SkiperProject, index: number) => void;
}

const Skiper16: React.FC<Skiper16Props> = ({
  items = defaultProjects,
  className = "",
  onSelectProject,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={container}
      className={`relative flex w-full flex-col items-center justify-center pb-[35vh] pt-[15vh] ${className}`}
    >
      <div className="sticky top-20 z-10 mb-8 flex flex-col items-center text-center px-4">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#8C827A] font-medium mb-1">
          Stacked Card Scroll Animation
        </span>
        <h2 className="font-editorial text-2xl sm:text-4xl text-[#24211E] font-normal tracking-tight">
          The Tactile Archive
        </h2>
        <p className="text-xs text-[#6B6158] mt-1 font-light">
          Scroll to watch each handcrafted piece layer into place
        </p>
      </div>

      <div className="w-full flex flex-col items-center">
        {items.map((project, i) => {
          const targetScale = Math.max(0.72, 1 - (items.length - i - 1) * 0.06);
          return (
            <StickyCard_001
              key={`p_${i}`}
              i={i}
              {...project}
              onClick={() => onSelectProject?.(project, i)}
              progress={scrollYProgress}
              range={[i * (0.8 / items.length), 1]}
              targetScale={targetScale}
            />
          );
        })}
      </div>
    </div>
  );
};

export { Skiper16, StickyCard_001 };
