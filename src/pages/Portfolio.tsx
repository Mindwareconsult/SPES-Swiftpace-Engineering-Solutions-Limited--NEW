import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SafeImage } from '../components/common/SafeImage';

export const Portfolio: React.FC = () => {
  const { projects } = useCms();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));
    return ['All', ...unique];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      const catMatch = selectedCategory === 'All' || project.category === selectedCategory;
      const textMatch =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.location.toLowerCase().includes(q) ||
        project.shortDescription.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [projects, selectedCategory, query]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title="Project Portfolio | SPES Swiftpace Engineering Solutions Limited"
        description="Explore verified on-site civil/structural engineering builds, substructure foundations, multi-level frames, and contemporary architectural concepts."
        canonicalPath="/portfolio"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Projects & Site Documentation',
            url: `${origin}/portfolio`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: projects.map((proj, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: proj.title,
                url: `${origin}/projects/${proj.slug}`
              }))
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Portfolio', item: `${origin}/portfolio` }
            ]
          }
        ]}
      />

      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-22 blueprint-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Projects' }]} />
          <div className="max-w-3xl space-y-4">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Verified Engineering &amp; Design Portfolio
            </div>
            <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white leading-tight">
              Projects &amp; Site Documentation
            </h1>
            <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed">
              Every project record presented here reflects documented site execution, structural framing, or architectural design work managed by SPES Swiftpace.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            {/* Segmented Category Filter Tabs */}
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

            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search projects by title or location"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search project or location..."
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
              <p className="text-slate-300">No projects matched your current filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setQuery('');
                }}
                className="text-xs font-semibold text-[#12BCEB] hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project) => (
                <Link
                  key={project.slug}
                  to={`/projects/${project.slug}`}
                  className="group flex flex-col rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 transition-all overflow-hidden"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#06142B] border-b border-white/10">
                    <SafeImage
                      src={project.coverImage}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="text-xs text-[#12BCEB] font-medium">
                        {project.category} · {project.projectStatus}
                      </div>
                      <h2 className="text-lg font-semibold text-white leading-snug group-hover:text-[#12BCEB] transition-colors">
                        {project.title}
                      </h2>
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {project.shortDescription}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate pr-3">{project.location}</span>
                      <span className="inline-flex items-center gap-1 text-[#12BCEB] font-semibold shrink-0">
                        View Case Study <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-14 sm:py-20 border-t border-white/10 bg-[#081A36]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
            Project Enquiries
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
            Planning a Residential, Commercial, or Structural Development?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discuss your site context, architectural goals, or structural engineering scope directly with SPES Swiftpace consultants.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Submit a Project Brief
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg border border-white/25 hover:border-white/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
            >
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
