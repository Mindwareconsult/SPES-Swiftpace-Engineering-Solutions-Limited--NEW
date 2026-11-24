import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SafeImage } from '../components/common/SafeImage';
import { ServiceIcon } from '../utils/serviceIcons';

export const Services: React.FC = () => {
  const { services } = useCms();
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title="Engineering & Architectural Services | SPES Swiftpace Engineering Solutions"
        description="Integrated disciplines across Architecture, Building Construction, Civil & Structural Engineering, Construction Management, Consultancy, and Allied Services."
        canonicalPath="/services"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Engineering, Architecture & Construction Solutions',
            url: `${origin}/services`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: services.map((svc, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: svc.title,
                url: `${origin}/services/${svc.slug}`
              }))
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Services', item: `${origin}/services` }
            ]
          }
        ]}
      />

      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-22 blueprint-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Services' }]} />
          <div className="max-w-3xl space-y-4">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Practice Disciplines
            </div>
            <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white leading-tight">
              Engineering, Architecture &amp; Construction Solutions
            </h1>
            <p className="text-[15px] sm:text-lg text-slate-300 leading-relaxed">
              Every project is delivered through coordinated technical disciplines uniting architectural form, structural reliability, buildability, and site governance.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-22">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {services.map((service, idx) => (
            <div
              key={service.slug}
              className="grid grid-cols-1 lg:grid-cols-12 items-stretch rounded-xl border border-white/10 bg-[#0B1E3D] overflow-hidden"
            >
              <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto lg:h-full min-h-[210px] sm:min-h-[240px] lg:min-h-[320px] bg-[#06142B] border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
                <SafeImage
                  src={service.heroImage}
                  alt={service.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#12BCEB]/10 border border-[#12BCEB]/25 text-[#12BCEB] flex items-center justify-center">
                      <ServiceIcon name={service.iconName} className="w-5 h-5" />
                    </div>
                    <span className="font-mono-tech text-xs text-slate-400">
                      0{idx + 1}. {service.relatedCategory || 'Engineering Discipline'}
                    </span>
                  </div>

                  <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
                    {service.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {service.detailedOverview || service.shortDescription}
                  </p>

                  {service.capabilities?.length > 0 && (
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {service.capabilities.slice(0, 4).map((cap) => (
                        <div key={cap} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                  <Link
                    to={`/services/${service.slug}`}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Full Scope &amp; Process
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/contact?service=${encodeURIComponent(service.title)}`}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-lg border border-white/20 hover:border-white/40 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                  >
                    Request Service Quote
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 sm:py-20 border-t border-white/10 bg-[#081A36]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
            Multidisciplinary Coordination
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
            Need Advice on Which Disciplines Your Site Requires?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Share your land location, architectural goals, or structural condition and our team will outline the appropriate technical scope.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Request Technical Consultation
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-lg border border-white/25 hover:border-white/50 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
            >
              View Verified Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
