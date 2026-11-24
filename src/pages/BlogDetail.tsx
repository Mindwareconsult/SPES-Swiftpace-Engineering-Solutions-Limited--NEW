import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SafeImage } from '../components/common/SafeImage';
import { SafeMarkdown } from '../components/common/SafeMarkdown';

export const BlogDetail: React.FC = () => {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  const { blogPosts, settings } = useCms();

  const post = blogPosts.find((b) => b.slug === articleSlug);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-5">
        <SEOHead title="Article Not Found | SPES Swiftpace" noIndex />
        <h1 className="font-editorial text-4xl font-semibold text-white">Article Not Found</h1>
        <p className="text-slate-400">The requested technical article could not be located.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Journal
        </Link>
      </div>
    );
  }

  const related = blogPosts.filter((b) => b.slug !== post.slug).slice(0, 2);
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';
  const absoluteImage = post.featuredImage
    ? post.featuredImage.startsWith('http')
      ? post.featuredImage
      : `${origin}${post.featuredImage.startsWith('/') ? '' : '/'}${post.featuredImage}`
    : undefined;

  return (
    <div>
      <SEOHead
        title={post.seoTitle || `${post.title} | SPES Swiftpace`}
        description={post.metaDescription || post.excerpt}
        image={post.featuredImage}
        type="article"
        canonicalPath={`/blog/${post.slug}`}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            datePublished: post.publishedAt,
            ...(absoluteImage ? { image: absoluteImage } : {}),
            author: {
              '@type': 'Organization',
              name: post.author || settings.companyName || 'SPES Swiftpace Engineering Solutions Limited'
            },
            publisher: {
              '@type': 'Organization',
              name: settings.companyName || 'SPES Swiftpace Engineering Solutions Limited',
              url: origin
            },
            mainEntityOfPage: `${origin}/blog/${post.slug}`
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog` },
              { '@type': 'ListItem', position: 3, name: post.title, item: `${origin}/blog/${post.slug}` }
            ]
          }
        ]}
      />

      <article className="py-12 sm:py-20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Blog', to: '/blog' },
                { label: post.title }
              ]}
            />
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-[#12BCEB]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to All Articles
            </Link>
          </div>

          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#12BCEB] font-medium">
              <span>{post.category}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt} className="font-mono-tech text-slate-400">
                {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </time>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">{post.author || 'SPES Technical Desk'}</span>
            </div>

            <h1 className="font-editorial text-[1.875rem] sm:text-5xl font-semibold text-white leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-[15px] sm:text-lg text-slate-300 leading-relaxed border-l-2 border-[#12BCEB] pl-4">
                {post.excerpt}
              </p>
            )}
          </header>

          {post.featuredImage && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B1E3D]">
              <SafeImage
                src={post.featuredImage}
                alt={post.title}
                loading="eager"
                fetchPriority="high"
                className="w-full max-h-[500px] object-cover"
              />
            </div>
          )}

          <div className="pt-2">
            <SafeMarkdown content={post.content} />
          </div>

          <div className="mt-10 sm:mt-12 p-5 sm:p-8 rounded-xl border border-[#12BCEB]/30 bg-[#081A36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-editorial text-2xl font-semibold text-white">
                Need Engineering Advice on Your Project?
              </h2>
              <p className="text-sm text-slate-300">
                Speak with SPES Swiftpace consultants about design, structural feasibility, or build execution.
              </p>
            </div>
            <Link
              to={`/contact?service=${encodeURIComponent(post.category)}`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-[44px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-3 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors"
            >
              Contact Desk <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-14 sm:py-18 bg-[#040E20]/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
              More Technical Notes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  className="group p-5 rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 space-y-2 transition-all"
                >
                  <div className="text-xs text-[#12BCEB]">{item.category}</div>
                  <h3 className="text-base font-semibold text-white group-hover:text-[#12BCEB]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
