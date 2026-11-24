import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ExternalLink, Instagram } from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { BrandLogo } from '../common/BrandLogo';

export const Footer: React.FC = () => {
  const { settings, services, company } = useCms();
  const year = new Date().getFullYear();

  const socialEntries = [
    { key: 'instagram', label: 'Instagram', handle: '@swiftpace_engineering', href: settings.socialLinks?.instagram },
    { key: 'linkedin', label: 'LinkedIn', handle: 'LinkedIn', href: settings.socialLinks?.linkedin },
    { key: 'facebook', label: 'Facebook', handle: 'Facebook', href: settings.socialLinks?.facebook },
    { key: 'x', label: 'X', handle: 'X', href: settings.socialLinks?.x }
  ].filter((item) => Boolean(item.href && item.href.trim()));

  return (
    <footer className="border-t border-white/10 bg-[#040E20] text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-22 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <BrandLogo sizeClass="w-11 h-11" />
              <div>
                <div className="text-sm font-bold tracking-wider uppercase text-white">
                  {settings.companyName || 'SPES Swiftpace Engineering Solutions Limited'}
                </div>
                <div className="font-mono-tech text-xs text-[#12BCEB]">
                  {settings.rcNumber || 'RC:8978524'}
                </div>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.footerTagline || settings.companyDescription}
            </p>
            {company.sisterEnterprise?.url && (
              <p className="text-xs text-slate-400 pt-1">
                Sister Enterprise:{' '}
                <a
                  href={company.sisterEnterprise.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-200 hover:text-[#12BCEB] inline-flex items-center gap-1 underline underline-offset-4"
                >
                  {company.sisterEnterprise.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            )}
          </div>

          {/* Disciplines Column */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
              Disciplines
            </h2>
            <ul className="space-y-2.5 text-sm">
              {services.slice(0, 6).map((svc) => (
                <li key={svc.slug}>
                  <Link
                    to={`/services/${svc.slug}`}
                    className="text-slate-400 hover:text-[#12BCEB] transition-colors"
                  >
                    {svc.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links Column */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
              Company
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-[#12BCEB] transition-colors">
                  About SPES
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="text-slate-400 hover:text-[#12BCEB] transition-colors">
                  Project Portfolio
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-slate-400 hover:text-[#12BCEB] transition-colors">
                  Photo Gallery
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-slate-400 hover:text-[#12BCEB] transition-colors">
                  Technical Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-[#12BCEB] transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-[#12BCEB] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Contact Column */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
              Corporate Office
            </h2>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" />
                <span>
                  {settings.addressLine1}, {settings.addressCity}, {settings.addressState},{' '}
                  {settings.addressCountry}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" />
                <div className="space-y-1 font-mono-tech text-xs">
                  <div>
                    <a
                      href={`tel:${(settings.phonePrimary || '').replace(/\s+/g, '')}`}
                      className="hover:text-white transition-colors"
                    >
                      {settings.phonePrimary}
                    </a>
                  </div>
                  {settings.phoneSecondary && (
                    <div>
                      <a
                        href={`tel:${settings.phoneSecondary.replace(/\s+/g, '')}`}
                        className="hover:text-white transition-colors"
                      >
                        {settings.phoneSecondary}
                      </a>
                    </div>
                  )}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" />
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {settings.email}
                </a>
              </li>
            </ul>

            {socialEntries.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Official Social Channels
                </div>
                <div className="flex flex-wrap gap-2.5 text-xs">
                  {socialEntries.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`SPES Swiftpace on ${item.label}`}
                      className={`inline-flex items-center gap-2 min-h-[44px] rounded-lg border border-white/15 bg-[#0B1E3D] hover:bg-[#10274D] px-3.5 py-2.5 text-slate-200 hover:text-white transition-colors ${
                        item.key === 'instagram'
                          ? 'hover:border-[#E1306C]/70'
                          : 'hover:border-[#12BCEB]/60'
                      }`}
                    >
                      {item.key === 'instagram' ? (
                        <Instagram className="w-4 h-4 text-[#E1306C] shrink-0" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-[#12BCEB] shrink-0" />
                      )}
                      <span>{item.handle}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="space-y-1.5 leading-relaxed">
            <div>
              &copy; {year} {settings.companyName || 'SPES Swiftpace Engineering Solutions Limited'}. All rights reserved.
            </div>
            <div>
              Website Development By{' '}
              <a
                href="https://mindwareconsult.com.ng/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-200 hover:text-[#12BCEB] underline underline-offset-4 transition-colors"
              >
                Mindware Consulting Ltd
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pr-14 sm:pr-0">
            <Link to="/privacy-policy" className="py-1 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="py-1 hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/admin/login" className="py-1 hover:text-[#12BCEB] transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
