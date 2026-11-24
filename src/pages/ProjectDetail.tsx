import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SafeImage } from '../components/common/SafeImage';

export const ProjectDetail: React.FC = () => {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const { projects, settings } = useCms();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const project = projects.find((p) => p.slug === projectSlug);

  const images = project?.images?.length
    ? project.images
    : project?.coverImage
      ? [{ id: 'cover', url: project.coverImage, caption: project.title, order: 1 }]
      : [];

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
      if (e.key === 'ArrowRight') setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % images.length));
      if (e.key === 'ArrowLeft')
        setLightboxIdx((prev) => (prev === null ? null : (prev - 1 + images.length) % images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxIdx, images.length]);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-5">
        <SEOHead title="Project Not Found | SPES Swiftpace" noIndex />
        <h1 className="font-editorial text-4xl font-semibold text-white">Project Record Not Found</h1>
        <p className="text-slate-400">The requested project documentation could not be found.</p>
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portfolio
        </Link>
      </div>
    );
  }

  const related = projects.filter((p) => p.slug !== project.slug).slice(0, 3);
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title={project.seoTitle || `${project.title} | SPES Swiftpace`}
        description={project.metaDescription || project.shortDescription}
        image={project.coverImage}
        canonicalPath={`/projects/${project.slug}`}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: project.title,
            description: project.metaDescription || project.shortDescription,
            url: `${origin}/projects/${project.slug}`,
            locationCreated: project.location,
            creator: {
              '@type': 'Organization',
              name: settings.companyName || 'SPES Swiftpace Engineering Solutions Limited',
              url: origin
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Projects', item: `${origin}/portfolio` },
              { '@type': 'ListItem', position: 3, name: project.title, item: `${origin}/projects/${project.slug}` }
            ]
          }
        ]}
      />

      {/* Project Hero & Metadata */}
      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Projects', to: '/portfolio' },
                { label: project.title }
              ]}
            />
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-[#12BCEB]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All Projects
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs text-[#12BCEB] font-medium">
                {project.category} · {project.projectStatus}
              </div>
              <h1 className="font-editorial text-[1.875rem] sm:text-5xl font-semibold text-white leading-tight">
                {project.title}
              </h1>
              <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed">
                {project.shortDescription}
              </p>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-400">Location</dt>
                  <dd className="text-slate-200 mt-0.5">{project.location}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-400">Status</dt>
                  <dd className="text-slate-200 mt-0.5">{project.projectStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-400">Client</dt>
                  <dd className="text-slate-200 mt-0.5">{project.client}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-400">Timeline</dt>
                  <dd className="font-mono-tech text-slate-200 mt-0.5">{project.completionDate}</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-5">
              <button
                type="button"
                onClick={() => openLightbox(0)}
                aria-label={`Enlarge ${project.title} cover photograph`}
                className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-white/15 bg-[#0B1E3D] block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB]"
              >
                <SafeImage
                  src={project.coverImage}
                  alt={project.title}
                  loading="eager"
                  fetchPriority="high"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-[#06142B]/85 border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white opacity-85 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-3.5 h-3.5 text-[#12BCEB]" aria-hidden="true" />
                  Enlarge
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering & Architectural Dossier */}
      <section className="py-12 sm:py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
                Project Overview
              </h2>
              <p className="text-slate-300 leading-relaxed">{project.overview}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.objectives && (
                <div className="p-6 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#12BCEB]">
                    Objectives
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{project.objectives}</p>
                </div>
              )}
              {project.scopeOfWork && (
                <div className="p-6 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#12BCEB]">
                    Scope of Work
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{project.scopeOfWork}</p>
                </div>
              )}
              {project.technicalApproach && (
                <div className="p-6 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#12BCEB]">
                    Technical Approach
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {project.technicalApproach}
                  </p>
                </div>
              )}
              {project.projectOutcome && (
                <div className="p-6 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#12BCEB]">
                    Project Outcome
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{project.projectOutcome}</p>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24 p-6 rounded-xl border border-[#12BCEB]/30 bg-[#081A36] space-y-4">
              <h3 className="font-editorial text-2xl font-semibold text-white">
                Enquire About Similar Works
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Need engineering, architectural design, or construction supervision for a similar project? Contact our technical team directly.
              </p>
              <Link
                to={`/contact?project=${encodeURIComponent(project.title)}&service=${encodeURIComponent(project.category)}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Request Consultation <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Project Photographic Documentation */}
      {images.length > 0 && (
        <section className="py-12 sm:py-20 border-b border-white/10 bg-[#040E20]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
                Project Photographic Documentation ({images.length})
              </h2>
              <span className="font-mono-tech text-xs text-slate-400">
                Select any photograph to enlarge
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => openLightbox(idx)}
                  aria-label={`Enlarge photograph: ${img.caption || project.title}`}
                  className="group text-left rounded-xl border border-white/10 bg-[#0B1E3D] overflow-hidden hover:border-[#12BCEB]/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#06142B]">
                    <SafeImage
                      src={img.url}
                      alt={img.caption || project.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {img.caption && (
                    <div className="p-3.5 text-xs text-slate-300 border-t border-white/10 leading-relaxed">
                      {img.caption}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Works */}
      {related.length > 0 && (
        <section className="py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
              Additional Portfolio Records
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/projects/${item.slug}`}
                  className="group rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 overflow-hidden transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#06142B] border-b border-white/10">
                    <SafeImage
                      src={item.coverImage}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-1.5">
                    <div className="text-xs text-[#12BCEB]">{item.category}</div>
                    <h3 className="text-base font-semibold text-white group-hover:text-[#12BCEB]">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Project photograph viewer for ${project.title}`}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex flex-col justify-between p-3 sm:p-8"
          onClick={closeLightbox}
        >
          <div className="flex items-center justify-between text-white">
            <span className="font-mono-tech text-xs text-slate-300">
              {lightboxIdx + 1} / {images.length}
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeLightbox}
              aria-label="Close lightbox"
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12BCEB]"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center sm:gap-4 min-h-0 py-3 sm:py-4"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx - 1 + images.length) % images.length)}
                aria-label="Previous image"
                className="absolute left-1 sm:static z-10 inline-flex items-center justify-center w-11 h-11 rounded-full sm:rounded-lg bg-[#06142B]/80 sm:bg-white/10 hover:bg-white/20 border border-white/15 sm:border-transparent text-white shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="min-w-0 flex-1 h-full flex items-center justify-center">
              <SafeImage
                src={images[lightboxIdx].url}
                alt={images[lightboxIdx].caption || project.title}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIdx((lightboxIdx + 1) % images.length)}
                aria-label="Next image"
                className="absolute right-1 sm:static z-10 inline-flex items-center justify-center w-11 h-11 rounded-full sm:rounded-lg bg-[#06142B]/80 sm:bg-white/10 hover:bg-white/20 border border-white/15 sm:border-transparent text-white shrink-0"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="text-center text-xs sm:text-sm text-slate-200 max-w-3xl mx-auto px-2 pb-1">
            {images[lightboxIdx].caption}
          </div>
        </div>
      )}
    </div>
  );
};
