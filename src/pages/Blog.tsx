import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SafeImage } from '../components/common/SafeImage';

export const Blog: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const { blogPosts, blogCategories } = useCms();

  const matchedCategory = useMemo(() => {
    if (!categorySlug) return undefined;
    return blogCategories.find((c) => c.slug === categorySlug);
  }, [categorySlug, blogCategories]);

  const initialCategory = matchedCategory ? matchedCategory.name : 'All';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const categories = useMemo(() => {
    const fromPosts = Array.from(new Set(blogPosts.map((p) => p.category).filter(Boolean)));
    const fromConfig = blogCategories.map((c) => c.name);
    const merged = Array.from(new Set([...fromPosts, ...fromConfig]));
    return ['All', ...merged];
  }, [blogPosts, blogCategories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogPosts.filter((post) => {
      const catMatch = selectedCategory === 'All' || post.category === selectedCategory;
      const textMatch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [blogPosts, selectedCategory, query]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';
  const seoTitle =
    matchedCategory
      ? `${matchedCategory.name} Articles | SPES Swiftpace Technical Blog`
      : 'Technical Blog & Insights | SPES Swiftpace Engineering Solutions';
  const seoDescription =
    matchedCategory?.description ||
    'Engineering articles, architectural methodology, construction management insights, and Nigerian built-environment guidance from SPES Swiftpace.';
  const canonicalPath = matchedCategory ? `/blog/category/${matchedCategory.slug}` : '/blog';

  return (
    <div>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: matchedCategory ? `${matchedCategory.name} — SPES Technical Blog` : 'SPES Technical Blog',
            description: seoDescription,
            url: `${origin}${canonicalPath}`
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: matchedCategory
              ? [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                  { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog` },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: matchedCategory.name,
                    item: `${origin}/blog/category/${matchedCategory.slug}`
                  }
                ]
              : [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                  { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog` }
                ]
          }
        ]}
      />

      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-22 blueprint-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Breadcrumbs
            items={
              matchedCategory
                ? [
                    { label: 'Home', to: '/' },
                    { label: 'Blog', to: '/blog' },
                    { label: matchedCategory.name }
                  ]
                : [{ label: 'Home', to: '/' }, { label: 'Blog' }]
            }
          />
          <div className="max-w-3xl space-y-4">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Engineering Journal
            </div>
            <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white leading-tight">
              Technical Insights &amp; Practice Notes
            </h1>
            <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed">
              Practical perspectives on structural safety, climate-responsive architecture, construction scheduling, and pre-build planning across Nigeria.
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
                aria-label="Search technical articles"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
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
              <p className="text-slate-300">No articles found for this topic or search term.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 transition-all overflow-hidden"
                >
                  {post.featuredImage && (
                    <div className="aspect-[16/10] overflow-hidden border-b border-white/10 bg-[#06142B]">
                      <SafeImage
                        src={post.featuredImage}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="text-xs text-[#12BCEB] font-medium">
                        {post.category} ·{' '}
                        <time
                          dateTime={post.publishedAt}
                          className="font-mono-tech text-slate-400"
                        >
                          {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </time>
                      </div>
                      <h2 className="text-xl font-semibold text-white leading-snug group-hover:text-[#12BCEB] transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span>{post.author || 'SPES Technical Desk'}</span>
                      <span className="inline-flex items-center gap-1 text-[#12BCEB] font-semibold">
                        Read Article <ArrowRight className="w-3.5 h-3.5" />
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
            Technical Advisory
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
            Need Engineering Advice Before Starting Your Build?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Speak with our architectural, structural engineering, and construction management consultants about your site or development plan.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Consult SPES Engineers
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg border border-white/25 hover:border-white/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
            >
              View Practice Disciplines
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
