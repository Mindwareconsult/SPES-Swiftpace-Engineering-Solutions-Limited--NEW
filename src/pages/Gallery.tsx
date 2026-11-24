import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SafeImage } from '../components/common/SafeImage';

export const Gallery: React.FC = () => {
  const { gallery } = useCms();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(gallery.map((g) => g.category).filter(Boolean)));
    return ['All', ...unique];
  }, [gallery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gallery.filter((item) => {
      const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const textMatch =
        !q ||
        item.caption.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.filename.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [gallery, selectedCategory, query]);

  const openLightbox = (idx: number) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setLightboxIdx(idx);
  };

  const closeLightbox = () => {
    setLightboxIdx(null);
    requestAnimationFrame(() => {
      lastFocusedRef.current?.focus();
    });
  };

  useEffect(() => {
    if (lightboxIdx === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight')
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % filtered.length));
      if (e.key === 'ArrowLeft')
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + filtered.length) % filtered.length
        );
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxIdx, filtered.length]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title="Visual Gallery | SPES Swiftpace Engineering Solutions Limited"
        description="Photographic archive of construction progress, reinforced concrete framing, architectural concepts, and interior spaces delivered by SPES Swiftpace."
        canonicalPath="/gallery"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'ImageGallery',
            name: 'Site & Architectural Gallery',
            url: `${origin}/gallery`
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Gallery', item: `${origin}/gallery` }
            ]
          }
        ]}
      />

      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-22 blueprint-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Gallery' }]} />
          <div className="max-w-3xl space-y-4">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Visual Archive · {gallery.length} Photographs
            </div>
            <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white leading-tight">
              Site &amp; Architectural Gallery
            </h1>
            <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed">
              Browse verified field photography from foundation, slab reinforcement, and structural shoring operations alongside architectural exterior and interior visualizations.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setLightboxIdx(null);
                    }}
                    className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#12BCEB] text-[#06142B]'
                        : 'border border-white/15 bg-[#0B1E3D] text-slate-300 hover:border-white/35 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                aria-label="Filter gallery captions"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLightboxIdx(null);
                }}
                placeholder="Filter captions..."
                className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0B1E3D] pl-10 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#0B1E3D] p-12 text-center space-y-3">
              <p className="text-slate-300">No gallery items match the current selection.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setQuery('');
                }}
                className="text-xs font-semibold text-[#12BCEB] hover:underline"
              >
                Show All Photographs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className="group flex flex-col rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(idx)}
                    aria-label={`Inspect photograph: ${item.caption}`}
                    className="aspect-[4/3] overflow-hidden bg-[#06142B] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB]"
                  >
                    <SafeImage
                      src={item.url}
                      alt={item.caption}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </button>
                  <div className="p-4 flex flex-col flex-1 justify-between space-y-2 border-t border-white/10">
                    <div>
                      <div className="text-[11px] font-medium text-[#12BCEB]">{item.category}</div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1 line-clamp-3">
                        {item.caption}
                      </p>
                    </div>
                    {item.projectSlug ? (
                      <Link
                        to={`/projects/${item.projectSlug}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-[#12BCEB] pt-1"
                      >
                        View Case Study <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-14 sm:py-20 border-t border-white/10 bg-[#081A36]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
            From Documentation to Delivery
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
            Ready to Discuss Your Architectural or Structural Brief?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Explore full project case studies or engage our engineering team directly for site feasibility, design, or construction supervision.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Submit a Project Enquiry
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg border border-white/25 hover:border-white/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
            >
              Browse Project Portfolio
            </Link>
          </div>
        </div>
      </section>

      {lightboxIdx !== null && filtered[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery photograph lightbox viewer"
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex flex-col justify-between p-3 sm:p-8"
          onClick={closeLightbox}
        >
          <div className="flex items-center justify-between gap-3 text-white">
            <span className="font-mono-tech text-xs text-slate-300 truncate">
              {lightboxIdx + 1} / {filtered.length} · {filtered[lightboxIdx].category}
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeLightbox}
              aria-label="Close lightbox"
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB]"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center sm:gap-4 min-h-0 py-3 sm:py-4"
            onClick={(e) => e.stopPropagation()}
          >
            {filtered.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx - 1 + filtered.length) % filtered.length)}
                aria-label="Previous photograph"
                className="absolute left-1 sm:static z-10 inline-flex items-center justify-center w-11 h-11 rounded-full sm:rounded-lg bg-[#06142B]/80 sm:bg-white/10 hover:bg-white/20 border border-white/15 sm:border-transparent text-white shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="min-w-0 flex-1 h-full flex items-center justify-center">
              <SafeImage
                src={filtered[lightboxIdx].url}
                alt={filtered[lightboxIdx].caption}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>

            {filtered.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx + 1) % filtered.length)}
                aria-label="Next photograph"
                className="absolute right-1 sm:static z-10 inline-flex items-center justify-center w-11 h-11 rounded-full sm:rounded-lg bg-[#06142B]/80 sm:bg-white/10 hover:bg-white/20 border border-white/15 sm:border-transparent text-white shrink-0"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="text-center space-y-2 max-w-3xl mx-auto px-2 pb-1">
            <p className="text-xs sm:text-sm text-slate-200">{filtered[lightboxIdx].caption}</p>
            {filtered[lightboxIdx].projectSlug && (
              <Link
                to={`/projects/${filtered[lightboxIdx].projectSlug}`}
                onClick={() => setLightboxIdx(null)}
                className="inline-flex items-center gap-1 py-1 text-xs font-semibold text-[#12BCEB] hover:underline"
              >
                Open Related Project Dossier <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
