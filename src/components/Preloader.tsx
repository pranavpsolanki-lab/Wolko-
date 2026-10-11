import React, { useState, useEffect } from 'react';
import { BRAND_ASSETS } from '../data/products';

export const Preloader: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check if user has already visited in this session to respect performance
    const hasVisited = sessionStorage.getItem('wolko_preloaded');
    if (hasVisited) {
      setVisible(false);
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setVisible(false);
            sessionStorage.setItem('wolko_preloaded', 'true');
            onComplete?.();
          }, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 35);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF8F5] transition-opacity duration-700 ease-out ${
        progress >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-xs text-center px-6">
        <div className="relative w-24 h-24 mb-6 rounded-full overflow-hidden shadow-sm border border-[#EAE2D8]/60 bg-white p-1">
          <img
            src={BRAND_ASSETS.logo}
            alt="Wolko Handmade Artisan Logo"
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        <h1 className="font-editorial text-2xl tracking-widest text-[#24211E] uppercase mb-1">
          Wolko
        </h1>
        <p className="text-xs text-[#8C827A] tracking-wider uppercase mb-6 font-light">
          Handmade · Woven with Care
        </p>

        {/* Minimal progress meter */}
        <div className="w-36 h-[2px] bg-[#EAE2D8] overflow-hidden rounded-full mb-3">
          <div
            className="h-full bg-[#24211E] transition-all duration-75 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[11px] font-mono tabular-nums text-[#8C827A]">
          {progress}%
        </span>
      </div>
    </div>
  );
};
