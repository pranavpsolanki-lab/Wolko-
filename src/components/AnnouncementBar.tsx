import React, { useState } from 'react';
import { X, Sparkles, Flame, MessageCircle } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const scrollToDiwali = () => {
    document.getElementById('diwali-sale')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <aside aria-label="Diwali Announcement" className="bg-gradient-to-r from-[#1F1916] via-[#2F1E19] to-[#1F1916] text-[#FAF8F5] text-xs py-2 px-4 transition-all border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-2.5 text-center overflow-hidden">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 animate-pulse" />
          <p className="truncate tracking-wide font-normal text-[11px] sm:text-xs">
            <span className="font-semibold text-amber-300">🪔 Shubh Diwali Sale Live:</span> Flat 15%–25% OFF on Handcrafted Amigurumi & Festive Hair Accessories · Use code <strong className="font-mono text-white underline">DIWALISPARKLE</strong> · Free Delivery Above ₹1,999
          </p>
          <button
            onClick={scrollToDiwali}
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-semibold border border-amber-400/30 transition-colors shrink-0"
          >
            <span>Explore Sale</span>
            <span>→</span>
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[#FAF8F5]/60 hover:text-white transition-colors ml-3 p-1 shrink-0"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
