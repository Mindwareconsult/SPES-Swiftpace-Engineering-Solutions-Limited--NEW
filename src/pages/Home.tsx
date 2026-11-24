import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Building2, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { MotionReveal } from '../components/common/MotionReveal';
import { SafeImage } from '../components/common/SafeImage';
import { ServiceIcon } from '../utils/serviceIcons';

export const Home: React.FC = () => {
  const { settings, company, services, projects, blogPosts, gallery } = useCms();
  const primaryHero =
    settings.heroImage ||
    '/assets/projects/commercial-column-shoring/commercial-column-shoring-01.jpg';
  const fallbackHero =
    '/uploads/projects/architectural-facade-concepts/arch-terraced-streetscape-01.jpg';
  const [heroSrc, setHeroSrc] = React.useState(primaryHero);

  React.useEffect(() => {
    setHeroSrc(primaryHero);
  }, [primaryHero]);

  const featuredProjects = (
    projects.filter((p) => p.featured).length > 0 ? projects.filter((p) => p.featured) : projects
  ).slice(0, 6);

  const latestArticles = blogPosts.slice(0, 3);
  const previewGallery = gallery.filter((g) => g.category !== 'Company').slice(0, 6);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        canonicalPath="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: settings.companyName || 'SPES Swiftpace Engineering Solutions Limited',
          url: origin
        }}
      />

      {/* Editorial Full-Bleed Construction & Architectural Hero */}
      <section className="relative overflow-hidden border-b border-white/10 min-h-[480px] sm:min-h-[600px] lg:min-h-[660px] flex items-center bg-[#06142B] bg-[radial-gradient(ellipse_at_top_right,_#12356B_0%,_#06142B_72%)]">
        <div className="absolute inset-0">
          <img
            src={heroSrc}
            alt="SPES Swiftpace commercial structural shoring, reinforced concrete columns, and glazed building construction site"
            fetchPriority="high"
            decoding="async"
            onError={() => {
              if (heroSrc !== fallbackHero) {
                setHeroSrc(fallbackHero);
              }
            }}
            className="w-full h-full object-cover object-[62%_38%] sm:object-[65%_35%]"
          />
          {/* Directional contrast scrim: stronger mobile coverage for crisp readability while showcasing the site photograph */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06142B]/95 via-[#06142B]/82 sm:via-[#06142B]/68 to-[#06142B]/60 sm:to-[#06142B]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06142B]/92 via-transparent to-[#06142B]/40 sm:to-[#06142B]/35" />
          <div className="absolute inset-y-0 left-0 w-2/3 blueprint-grid opacity-30 pointer-events-none" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-26 lg:py-30">
          <div className="max-w-2xl space-y-5 sm:space-y-6">
            <div className="font-mono-tech text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#12BCEB] drop-shadow-sm leading-relaxed">
              {settings.companyName || 'SPES Swiftpace Engineering Solutions Limited'} ·{' '}
              {settings.rcNumber || 'RC:8978524'}
            </div>

            <h1 className="font-editorial text-[2.25rem] sm:text-6xl lg:text-[4.25rem] font-semibold leading-[1.08] sm:leading-[1.06] tracking-tight text-white drop-shadow-md">
              {settings.heroHeadline || 'Engineering Excellence. Building the Future.'}
            </h1>

            <p className="text-[15px] sm:text-lg text-slate-200 leading-relaxed max-w-xl drop-shadow-sm">
              {settings.heroSubtitle || settings.companyDescription}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-black/30 transition-colors"
              >
                Explore Project Portfolio
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg border border-white/35 hover:border-white/65 bg-[#06142B]/65 hover:bg-[#06142B]/85 backdrop-blur-sm text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Request Consultation
              </Link>
            </div>

            <div className="pt-5 sm:pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#12BCEB] shrink-0" />
                {settings.addressCity || 'Ado Ekiti'}, {settings.addressState || 'Ekiti State'},{' '}
                {settings.addressCountry || 'Nigeria'}
              </span>
              <span className="inline-flex items-center gap-2 font-mono-tech">
                <Building2 className="w-3.5 h-3.5 text-[#12BCEB] shrink-0" />
                Incorporated under CAMA ({settings.rcNumber || 'RC:8978524'})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Disciplines */}
      <section className="py-14 sm:py-24 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-9 sm:mb-12">
            <div className="space-y-3 max-w-2xl">
              <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
                Integrated Capabilities
              </div>
              <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white">
                Multidisciplinary Engineering &amp; Construction Services
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#12BCEB] hover:text-white transition-colors shrink-0"
            >
              View All Disciplines
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <MotionReveal key={service.slug} delay={idx * 0.05}>
                <Link
                  to={`/services/${service.slug}`}
                  className="group flex flex-col h-full rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 hover:bg-[#10274D] transition-all overflow-hidden"
                >
                  {service.heroImage && (
                    <div className="aspect-[16/10] overflow-hidden border-b border-white/10 bg-[#06142B]">
                      <SafeImage
                        src={service.heroImage}
                        alt={service.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-[#12BCEB]/10 border border-[#12BCEB]/25 text-[#12BCEB] flex items-center justify-center">
                          <ServiceIcon name={service.iconName} className="w-5 h-5" />
                        </div>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="w-4 h-4 text-slate-400 group-hover:text-[#12BCEB] transition-colors"
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-[#12BCEB] transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {service.shortDescription}
                      </p>
                    </div>
                    <div className="pt-2 text-xs font-semibold text-[#12BCEB] inline-flex items-center gap-1.5">
                      Explore Scope <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Selected Engineering & Architectural Works */}
      <section className="py-14 sm:py-24 border-b border-white/10 bg-[#040E20]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-9 sm:mb-12">
            <div className="space-y-3 max-w-2xl">
              <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
                Portfolio &amp; Site Documentation
              </div>
              <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white">
                Verified Works &amp; Architectural Concepts
              </h2>
            </div>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#12BCEB] hover:text-white transition-colors shrink-0"
            >
              Browse Full Portfolio ({projects.length})
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project, idx) => (
              <MotionReveal key={project.slug} delay={idx * 0.05}>
                <Link
                  to={`/projects/${project.slug}`}
                  className="group flex flex-col h-full rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 transition-all overflow-hidden"
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
                      <h3 className="text-lg font-semibold text-white leading-snug group-hover:text-[#12BCEB] transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {project.shortDescription}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate pr-3">{project.location}</span>
                      <span className="font-mono-tech shrink-0 text-slate-300">
                        {project.images?.length || 1} Photos
                      </span>
                    </div>
                  </div>
                </Link>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Identity & Delivery Approach */}
      <section className="py-14 sm:py-24 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          <div className="lg:col-span-5 space-y-5">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Corporate Profile
            </div>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white leading-tight">
              Grounded in Technical Precision and Responsible Delivery
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {company.overview}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              {company.extendedOverview}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 hover:border-[#12BCEB] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-[#12BCEB] transition-colors"
              >
                Read Corporate Profile
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#12BCEB] hover:text-white transition-colors"
              >
                Discuss Your Project <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(company.deliveryPrinciples || []).map((principle, idx) => (
              <div
                key={principle.title}
                className="p-5 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech text-xs text-[#12BCEB]">
                    0{idx + 1}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#078A43]" />
                </div>
                <h3 className="text-base font-semibold text-white">{principle.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{principle.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Field & Design Gallery Strip */}
      {previewGallery.length > 0 && (
        <section className="py-14 sm:py-24 border-b border-white/10 bg-[#040E20]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
              <div className="space-y-2">
                <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
                  Visual Archive
                </div>
                <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
                  Site Progress &amp; Architectural Renderings
                </h2>
              </div>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#12BCEB] hover:text-white transition-colors"
              >
                Open Full Gallery ({gallery.length})
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {previewGallery.map((item) => (
                <Link
                  key={item.id}
                  to={item.projectSlug ? `/projects/${item.projectSlug}` : '/gallery'}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-[#12BCEB]/50 bg-[#0B1E3D] transition-colors"
                >
                  <SafeImage
                    src={item.url}
                    alt={item.caption}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06142B]/92 via-[#06142B]/55 to-transparent p-2.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100 transition-opacity duration-200">
                    <div className="text-[11px] font-medium text-white line-clamp-2 leading-snug">
                      {item.caption}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Technical Journal */}
      {latestArticles.length > 0 && (
        <section className="py-14 sm:py-24 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9 sm:mb-12">
              <div className="space-y-2">
                <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
                  Engineering Insights
                </div>
                <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
                  Technical Articles &amp; Industry Notes
                </h2>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#12BCEB] hover:text-white transition-colors"
              >
                Read All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestArticles.map((post) => (
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
                    <div className="space-y-2">
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
                      <h3 className="text-lg font-semibold text-white leading-snug group-hover:text-[#12BCEB] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-slate-300 group-hover:text-[#12BCEB] inline-flex items-center gap-1.5">
                      Read Article <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Consultation Call to Action */}
      <section className="py-14 sm:py-24 bg-[#081A36]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 sm:space-y-6">
          <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
            Project Enquiries &amp; Technical Proposals
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-white">
            Planning a Building, Structural, or Engineering Development?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {settings.contactNotice}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-7 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Submit a Project Enquiry
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`tel:${(settings.phonePrimary || '').replace(/\s+/g, '')}`}
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg border border-white/25 hover:border-white/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors font-mono-tech"
            >
              <Phone className="w-4 h-4 text-[#12BCEB]" />
              {settings.phonePrimary}
            </a>
          </div>
          {settings.email && (
            <div className="pt-1 text-xs text-slate-400">
              Or write directly to{' '}
              <a
                href={`mailto:${settings.email}`}
                className="text-slate-200 hover:text-[#12BCEB] underline underline-offset-4 transition-colors"
              >
                {settings.email}
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
