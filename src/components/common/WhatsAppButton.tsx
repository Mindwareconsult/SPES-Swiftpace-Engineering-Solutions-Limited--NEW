import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useCms } from '../../context/CmsContext';

export const WhatsAppButton: React.FC = () => {
  const { settings } = useCms();
  const digits = (settings.whatsappPrimary || '2347076365837').replace(/\D/g, '');
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(
    'Hello SPES Swiftpace Engineering Solutions, I would like to discuss an engineering or construction project.'
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with SPES Swiftpace on WhatsApp"
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 sm:right-5 z-40 inline-flex items-center justify-center gap-2.5 w-11 h-11 sm:w-auto sm:h-auto rounded-full bg-[#078A43] hover:bg-[#09a350] text-white sm:px-4 sm:py-3 text-xs font-semibold shadow-xl shadow-black/40 border border-white/15 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB]"
    >
      <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
      <span className="hidden sm:inline">WhatsApp Desk</span>
    </a>
  );
};
