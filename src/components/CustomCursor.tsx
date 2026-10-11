import React, { useEffect, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices and when reduced motion is not preferred
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) return;

    let rafId: number;
    let mouseX = -100;
    let mouseY = -100;
    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible && cursorRef.current) {
        isVisible = true;
        cursorRef.current.style.opacity = '1';
      }

      if (ringRef.current && e.target instanceof HTMLElement) {
        const isInteractive =
          e.target.closest('button') ||
          e.target.closest('a') ||
          e.target.closest('.cursor-pointer') ||
          e.target.tagName === 'BUTTON' ||
          e.target.tagName === 'A';

        if (isInteractive) {
          ringRef.current.className =
            'w-10 h-10 -ml-5 -mt-5 rounded-full border border-[#24211E]/40 bg-[#24211E]/10 scale-100 transition-all duration-150 ease-out';
        } else {
          ringRef.current.className =
            'w-4 h-4 -ml-2 -mt-2 rounded-full border border-[#C87D65]/40 bg-[#C87D65]/20 scale-75 transition-all duration-150 ease-out';
        }
      }
    };

    const render = () => {
      if (cursorRef.current && isVisible) {
        cursorRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      rafId = requestAnimationFrame(render);
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-50 opacity-0 will-change-transform"
      style={{
        transform: 'translate3d(-100px, -100px, 0)',
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        ref={ringRef}
        className="w-4 h-4 -ml-2 -mt-2 rounded-full border border-[#C87D65]/40 bg-[#C87D65]/20 scale-75 transition-all duration-150 ease-out"
      />
    </div>
  );
};
