import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Phone } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SafeImage } from '../components/common/SafeImage';
import { ServiceIcon } from '../utils/serviceIcons';

export const ServiceDetail: React.FC = () => {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { services, projects, settings } = useCms();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const service = services.find((s) => s.slug === serviceSlug);

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-5">
        <SEOHead title="Service Not Found | SPES Swiftpace" noIndex />
        <h1 className="font-editorial text-4xl font-semibold text-white">Service Discipline Not Found</h1>
        <p className="text-slate-400">The engineering service you requested could not be located.</p>
        <Link
          to="/services"
          className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Services
        </Link>
      </div>
    );
  }

  const relatedProjects = projects
    .filter((p) =>
      service.relatedCategory
        ? p.category.toLowerCase().includes(service.relatedCategory.toLowerCase()) ||
          service.relatedCategory.toLowerCase().includes(p.category.toLowerCase())
        : false
    )
    .slice(0, 3);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title={service.seoTitle || `${service.title} | SPES Swiftpace`}
        description={service.metaDescription || service.shortDescription}
        image={service.heroImage}
        canonicalPath={`/services/${service.slug}`}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: service.title,
            description: service.metaDescription || service.shortDescription,
            serviceType: service.title,
            url: `${origin}/services/${service.slug}`,
            provider: {
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
              { '@type': 'ListItem', position: 2, name: 'Services', item: `${origin}/services` },
              { '@type': 'ListItem', position: 3, name: service.title, item: `${origin}/services/${service.slug}` }
            ]
          }
        ]}
      />

      {/* Header */}
      <section className="relative border-b border-white/10 overflow-hidden">
        {service.heroImage && (
          <div className="absolute inset-0" aria-hidden="true">
            <img
              src={service.heroImage}
              alt=""
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#06142B]/85 via-[#06142B]/85 to-[#06142B]" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-22 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: 'Home', to: '/' },
                { label: 'Services', to: '/services' },
                { label: service.title }
              ]}
            />
            <Link
              to="/services"
              className="inline-flex items-center gap-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-[#12BCEB] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All Engineering Disciplines
            </Link>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#12BCEB]/15 border border-[#12BCEB]/35 text-[#12BCEB] flex items-center justify-center shrink-0">
              <ServiceIcon name={service.iconName} className="w-5 h-5" />
            </div>
            <span className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Service Dossier
            </span>
          </div>

          <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white max-w-4xl leading-tight">
            {service.title}
          </h1>

          <p className="text-[15px] sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            {service.shortDescription}
          </p>

          <div className="pt-2">
            <Link
              to={`/contact?service=${encodeURIComponent(service.title)}`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors text-center"
            >
              <span>Enquire About {service.title}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Detailed Overview & Capabilities */}
      <section className="py-12 sm:py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-editorial text-3xl font-semibold text-white">
              Technical Scope &amp; Overview
            </h2>
            <p className="text-slate-300 leading-relaxed text-base">
              {service.detailedOverview}
            </p>

            {service.galleryImages?.length > 0 && (
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.galleryImages.map((img, i) => (
                  <figure
                    key={i}
                    className="overflow-hidden rounded-xl border border-white/10 bg-[#0B1E3D]"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-[#06142B]">
                      <SafeImage src={img.src} alt={img.alt} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    {img.alt && (
                      <figcaption className="px-4 py-2.5 text-xs text-slate-400 border-t border-white/10 leading-relaxed">
                        {img.alt}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-4">
              <h3 className="text-lg font-semibold text-white">Core Deliverables &amp; Capabilities</h3>
              <ul className="space-y-3">
                {(service.capabilities || []).map((cap) => (
                  <li key={cap} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {service.clientBenefits?.length > 0 && (
              <div className="p-6 sm:p-8 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-4">
                <h3 className="text-lg font-semibold text-white">Client Value &amp; Standards</h3>
                <div className="space-y-4">
                  {service.clientBenefits.map((benefit) => (
                    <div key={benefit.title} className="space-y-1">
                      <div className="text-sm font-semibold text-[#12BCEB]">{benefit.title}</div>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{benefit.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Process Stages */}
      {service.processStages?.length > 0 && (
        <section className="py-16 sm:py-20 border-b border-white/10 bg-[#040E20]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10 space-y-2">
              <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
                Execution Workflow
              </div>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
                How We Deliver {service.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {service.processStages.map((stage) => (
                <div
                  key={stage.step + stage.title}
                  className="p-6 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2"
                >
                  <div className="font-mono-tech text-xs text-[#12BCEB]">STEP {stage.step}</div>
                  <h3 className="text-lg font-semibold text-white">{stage.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Discipline FAQs */}
      {service.faqs?.length > 0 && (
        <section className="py-12 sm:py-20 border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
              Frequently Asked Questions — {service.title}
            </h2>
            <div className="space-y-3">
              {service.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                const btnId = `service-faq-btn-${idx}`;
                const panelId = `service-faq-panel-${idx}`;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-[#0B1E3D] overflow-hidden"
                  >
                    <h3>
                      <button
                        id={btnId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full px-4 sm:px-6 py-4 min-h-[52px] flex items-center justify-between text-left gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12BCEB]"
                      >
                        <span className="text-sm sm:text-base font-medium text-white leading-snug">{faq.q}</span>
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
                        className="px-4 sm:px-6 pb-5 pt-2 text-sm text-slate-300 leading-relaxed border-t border-white/10"
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
                Related Portfolio Documentation
              </h2>
              <Link to="/portfolio" className="text-xs font-semibold text-[#12BCEB] hover:text-white py-1">
                View All Projects
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((project) => (
                <Link
                  key={project.slug}
                  to={`/projects/${project.slug}`}
                  className="group rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 overflow-hidden transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#06142B] border-b border-white/10">
                    <SafeImage
                      src={project.coverImage}
                      alt={project.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-1.5">
                    <div className="text-xs text-[#12BCEB]">{project.projectStatus}</div>
                    <h3 className="text-base font-semibold text-white group-hover:text-[#12BCEB]">
                      {project.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Discipline Consultation CTA */}
      <section className="py-14 sm:py-20 border-t border-white/10 bg-[#081A36]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
            Project Initiation
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
            Discuss Your {service.title} Requirements
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Request a scoped consultation with SPES Swiftpace Engineering Solutions Limited for feasibility review, deliverables, and scheduling.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              to={`/contact?service=${encodeURIComponent(service.title)}`}
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors text-center"
            >
              <span>Request {service.title} Quote</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
            {settings.phonePrimary && (
              <a
                href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg border border-white/25 hover:border-white/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors font-mono-tech"
              >
                <Phone className="w-4 h-4 text-[#12BCEB] shrink-0" />
                {settings.phonePrimary}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
