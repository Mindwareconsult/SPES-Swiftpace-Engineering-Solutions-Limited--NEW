import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 360);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollToTop = () => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 sm:right-5 z-40 inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#0B1E3D]/95 hover:bg-[#12BCEB] text-[#12BCEB] hover:text-[#06142B] border border-[#12BCEB]/45 hover:border-[#12BCEB] shadow-xl shadow-black/45 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#12BCEB] focus:ring-offset-2 focus:ring-offset-[#06142B]"
    >
      <ArrowUp className="w-5 h-5" aria-hidden="true" />
    </button>
  );
};
