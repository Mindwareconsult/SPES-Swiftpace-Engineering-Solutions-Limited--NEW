import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const PrivacyPolicy: React.FC = () => {
  const { settings } = useCms();
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div className="py-12 sm:py-22">
      <SEOHead
        title={`Privacy Policy | ${settings.companyName || 'SPES Swiftpace'}`}
        description="Privacy notice governing enquiry submissions and communications with SPES Swiftpace Engineering Solutions Limited."
        canonicalPath="/privacy-policy"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${origin}/privacy-policy` }
          ]
        }}
      />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }]} />
        <header className="space-y-3 border-b border-white/10 pb-6 sm:pb-8">
          <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
            Corporate Governance · {settings.rcNumber || 'RC:8978524'}
          </div>
          <h1 className="font-editorial text-[2rem] sm:text-5xl font-semibold text-white leading-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Applicable to {settings.companyName || 'SPES Swiftpace Engineering Solutions Limited'}
          </p>
        </header>

        <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <p>
              When you submit a project enquiry through our website, we collect the contact details and project brief information you voluntarily provide, including your name, organization, email address, telephone number, project location, and scope notes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. How Enquiry Information Is Used</h2>
            <p>
              Submitted details are used strictly to evaluate your engineering, architectural, construction, or consultancy request, prepare responsive technical proposals, and communicate directly with you through your preferred contact channel. We do not sell, rent, or distribute client enquiry data to third-party marketers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Confidentiality &amp; Storage</h2>
            <p>
              Enquiry submissions are stored privately in restricted company records accessible only to authorized administrators of {settings.companyName}. Public website content is maintained separately from private client submissions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Cookies &amp; Sessions</h2>
            <p>
              Public visitors can browse the website without tracking cookies. Strictly necessary security session cookies are issued only when an authorized administrator signs in to the management console.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Contact for Data Requests</h2>
            <p>
              To update or request deletion of previously submitted enquiry correspondence, please contact us at{' '}
              <a href={`mailto:${settings.email}`} className="text-[#12BCEB] hover:underline break-all">
                {settings.email}
              </a>{' '}
              or write to our office at {settings.addressLine1}, {settings.addressCity},{' '}
              {settings.addressState}, {settings.addressCountry}.
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
