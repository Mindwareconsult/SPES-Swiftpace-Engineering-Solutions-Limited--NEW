import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Compass, ExternalLink, Mail, MapPin, Phone, ShieldAlert } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BrandLogo } from '../components/common/BrandLogo';

export const About: React.FC = () => {
  const { company, settings } = useCms();
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title={`About ${company.legalName || 'SPES Swiftpace'} | Corporate Profile`}
        description={company.overview}
        canonicalPath="/about"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: `About ${company.legalName || 'SPES Swiftpace Engineering Solutions Limited'}`,
            description: company.overview,
            url: `${origin}/about`
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'About Us', item: `${origin}/about` }
            ]
          }
        ]}
      />

      {/* Page Header */}
      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-22 blueprint-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About Us' }]} />
          <div className="max-w-3xl space-y-4">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Corporate Profile · {company.rcNumber || settings.rcNumber || 'RC:8978524'}
            </div>
            <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white leading-tight">
              {company.legalName || settings.companyName}
            </h1>
            <p className="text-[15px] sm:text-lg text-slate-300 leading-relaxed">
              {company.overview}
            </p>
          </div>
        </div>
      </section>

      {/* Corporate Identity & Registration Facts */}
      <section className="py-12 sm:py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-editorial text-3xl font-semibold text-white">
              Integrated Built-Environment Practice
            </h2>
            <p className="text-slate-300 leading-relaxed">{company.overview}</p>
            <p className="text-slate-400 leading-relaxed">{company.extendedOverview}</p>

            {company.verificationPolicy && (
              <div className="mt-6 p-5 rounded-xl border border-[#12BCEB]/25 bg-[#0B1E3D] flex items-start gap-3.5">
                <ShieldAlert className="w-5 h-5 text-[#12BCEB] shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">
                  {company.verificationPolicy}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#0B1E3D] p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <BrandLogo sizeClass="w-14 h-14" />
              <div>
                <div className="font-semibold text-white">{company.shortName || 'SPES Swiftpace'}</div>
                <div className="font-mono-tech text-xs text-[#12BCEB]">
                  {company.rcNumber || 'RC:8978524'}
                </div>
              </div>
            </div>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">
                  Incorporation Framework
                </dt>
                <dd className="text-slate-200 mt-1">{company.incorporationAct}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">
                  Corporate Headquarters
                </dt>
                <dd className="text-slate-200 mt-1 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" />
                  <span>{company.headquarters}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">
                  Primary Contact Email
                </dt>
                <dd className="text-slate-200 mt-1">
                  <a
                    href={`mailto:${settings.email}`}
                    className="inline-flex items-center gap-2 text-slate-200 hover:text-[#12BCEB] transition-colors break-all"
                  >
                    <Mail className="w-4 h-4 text-[#12BCEB] shrink-0" />
                    <span>{settings.email}</span>
                  </a>
                </dd>
              </div>
              {settings.phonePrimary && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-400">
                    Direct Telephone
                  </dt>
                  <dd className="text-slate-200 mt-1">
                    <a
                      href={`tel:${settings.phonePrimary.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-2 font-mono-tech text-xs text-slate-200 hover:text-[#12BCEB] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#12BCEB] shrink-0" />
                      <span>{settings.phonePrimary}</span>
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-12 sm:py-20 border-b border-white/10 bg-[#040E20]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#12BCEB]/10 border border-[#12BCEB]/30 text-[#12BCEB] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
              Our Vision
            </h2>
            <p className="text-slate-300 leading-relaxed">{company.vision}</p>
          </div>

          <div className="p-6 sm:p-8 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#078A43]/15 border border-[#078A43]/35 text-[#37d67a] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
              Our Mission
            </h2>
            <p className="text-slate-300 leading-relaxed">{company.mission}</p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 sm:py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8 sm:mb-10 space-y-2">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Institutional Standards
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
              Core Values
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(company.coreValues || []).map((val) => (
              <div
                key={val.title}
                className="p-5 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2"
              >
                <h3 className="text-base font-semibold text-white">{val.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Delivery Principles */}
      <section className="py-12 sm:py-20 border-b border-white/10 bg-[#040E20]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8 sm:mb-10 space-y-2">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Methodology
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-white">
              Six-Stage Project Delivery Approach
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(company.deliveryPrinciples || []).map((item, idx) => (
              <div
                key={item.title}
                className="p-6 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech text-xs text-[#12BCEB]">
                    Stage 0{idx + 1}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#078A43]" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sister Enterprise & CTA */}
      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {company.sisterEnterprise?.name && (
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-3">
              <div className="font-mono-tech text-xs uppercase tracking-wider text-[#12BCEB]">
                Engineering Heritage
              </div>
              <h2 className="text-xl font-semibold text-white">
                {company.sisterEnterprise.name}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {company.sisterEnterprise.description}
              </p>
              {company.sisterEnterprise.url && (
                <a
                  href={company.sisterEnterprise.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-[#12BCEB] hover:text-white pt-1"
                >
                  Visit Sister Enterprise Website <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          <div className="lg:col-span-5 p-6 sm:p-8 rounded-xl border border-[#12BCEB]/30 bg-[#081A36] space-y-4">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
              Discuss Your Project Scope
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Engage our architectural, civil/structural engineering, or construction management desk directly.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-3 text-xs font-bold uppercase tracking-wider"
              >
                Contact Our Team <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-lg border border-white/20 hover:border-white/40 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white"
              >
                View Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
