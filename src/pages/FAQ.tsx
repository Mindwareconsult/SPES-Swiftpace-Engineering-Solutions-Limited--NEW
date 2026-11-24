import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const FAQ: React.FC = () => {
  const { faqs } = useCms();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)));
    return ['All', ...unique];
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((item) => {
      const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const textMatch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [faqs, selectedCategory, query]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title="Frequently Asked Questions | SPES Swiftpace Engineering Solutions"
        description="Answers on engineering consultations, architectural deliverables, construction timelines, supervision, and statutory compliance with SPES Swiftpace."
        canonicalPath="/faq"
        jsonLd={[
          ...(faqs.length > 0
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: faqs.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: item.answer
                    }
                  }))
                }
              ]
            : []),
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${origin}/faq` }
            ]
          }
        ]}
      />

      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-22 blueprint-grid">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]} />
          <div className="space-y-4">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Client Knowledge Base
            </div>
            <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Clear guidance on how SPES Swiftpace handles design briefs, structural calculations, project supervision, and client communication.
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(cat)}
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

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search frequently asked questions"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0B1E3D] pl-10 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h2 className="sr-only">Questions and Answers</h2>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#0B1E3D] p-10 text-center space-y-3">
              <p className="text-slate-300">No FAQ entries matched your search.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setQuery('');
                }}
                className="text-xs font-semibold text-[#12BCEB] hover:underline"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            filtered.map((item) => {
              const isOpen = openId === item.id;
              const btnId = `faq-btn-${item.id}`;
              const panelId = `faq-panel-${item.id}`;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-[#0B1E3D] overflow-hidden"
                >
                  <h3>
                    <button
                      id={btnId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="w-full px-4 sm:px-6 py-4 sm:py-5 min-h-[56px] flex items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12BCEB]"
                    >
                      <div>
                        <div className="text-[11px] font-medium text-[#12BCEB] mb-1">
                          {item.category}
                        </div>
                        <span className="text-sm sm:text-base font-medium text-white leading-snug">{item.question}</span>
                      </div>
                      <ChevronDown
                        aria-hidden="true"
                        className={`w-4 h-4 text-[#12BCEB] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className="px-4 sm:px-6 pb-5 pt-2.5 text-sm text-slate-300 leading-relaxed border-t border-white/10"
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="pt-8">
            <div className="p-5 sm:p-8 rounded-xl border border-[#12BCEB]/30 bg-[#081A36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-white">
                  Have a Specific Project Question?
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Reach our office in Ado Ekiti or send your enquiry directly.
                </p>
              </div>
              <Link
                to="/contact"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-[44px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-3 text-xs font-bold uppercase tracking-wider shrink-0"
              >
                Contact SPES <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
