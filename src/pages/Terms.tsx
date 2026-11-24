import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const Terms: React.FC = () => {
  const { settings } = useCms();
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div className="py-12 sm:py-22">
      <SEOHead
        title={`Terms & Conditions | ${settings.companyName || 'SPES Swiftpace'}`}
        description="Terms of use for the corporate portal of SPES Swiftpace Engineering Solutions Limited."
        canonicalPath="/terms-and-conditions"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: 'Terms & Conditions', item: `${origin}/terms-and-conditions` }
          ]
        }}
      />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Terms & Conditions' }]} />
        <header className="space-y-3 border-b border-white/10 pb-6 sm:pb-8">
          <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
            Corporate Governance · {settings.rcNumber || 'RC:8978524'}
          </div>
          <h1 className="font-editorial text-[2rem] sm:text-5xl font-semibold text-white leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-slate-400">
            {settings.companyName || 'SPES Swiftpace Engineering Solutions Limited'}
          </p>
        </header>

        <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Portal Purpose</h2>
            <p>
              This website presents general corporate, architectural, engineering, and construction information for {settings.companyName} ({settings.rcNumber}). Content published here is for informational and initial consultation purposes and does not constitute a binding construction contract or stamped engineering design until formal agreements are executed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Project Proposals &amp; Scope</h2>
            <p>
              Formal project engagements require site assessment, verified client briefs, agreed technical specifications, statutory approvals where applicable, and written contractual documentation signed by authorized representatives.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Intellectual Property</h2>
            <p>
              All architectural visualizations, site photography, technical articles, brand emblems, and structural documentation published on this portal remain the intellectual property of {settings.companyName} or its respective project clients and may not be reproduced commercially without written authorization.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Corporate Correspondence</h2>
            <p>
              Official correspondence may be directed to{' '}
              <a href={`mailto:${settings.email}`} className="text-[#12BCEB] hover:underline break-all">
                {settings.email}
              </a>
              , telephone{' '}
              <a
                href={`tel:${(settings.phonePrimary || '').replace(/\s+/g, '')}`}
                className="text-[#12BCEB] hover:underline font-mono-tech"
              >
                {settings.phonePrimary}
              </a>
              , or our registered office at {settings.addressLine1}, {settings.addressCity}, {settings.addressState}, {settings.addressCountry}.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs font-semibold uppercase tracking-wider">
          <Link to="/" className="min-h-[44px] inline-flex items-center text-slate-300 hover:text-white transition-colors">
            Return to Homepage
          </Link>
          <Link to="/contact" className="min-h-[44px] inline-flex items-center text-[#12BCEB] hover:text-white transition-colors">
            Contact Us
          </Link>
        </div>
      </article>
    </div>
  );
};
