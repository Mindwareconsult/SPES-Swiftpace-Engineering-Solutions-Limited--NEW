import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from '@formspree/react';
import { CheckCircle2, ExternalLink, Instagram, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { FORMSPREE_FORM_ID } from '../config/formspree';
import { buildFormspreeSubmissionData } from '../services/formspree';

const PROJECT_TYPES = [
  'Residential Development',
  'Commercial / Mixed-Use Building',
  'Industrial / Warehouse Structure',
  'Civil Infrastructure / Drainage',
  'Structural Assessment / Retrofitting',
  'Interior Fit-Out & Remodeling',
  'Consultancy / Feasibility Study'
];

const BUDGET_RANGES = [
  'Under ₦10 Million',
  '₦10 Million – ₦35 Million',
  '₦35 Million – ₦100 Million',
  '₦100 Million – ₦300 Million',
  'Above ₦300 Million',
  'To be discussed after brief review'
];

export const Contact: React.FC = () => {
  const { settings, services } = useCms();
  const [searchParams] = useSearchParams();

  const initialService = useMemo(() => {
    const param = searchParams.get('service') || '';
    if (!param) return services[0]?.title || 'Architecture';
    const found = services.find((s) => s.title.toLowerCase().includes(param.toLowerCase()));
    return found ? found.title : param;
  }, [searchParams, services]);

  const initialSubject = useMemo(() => {
    const proj = searchParams.get('project');
    return proj ? `Enquiry regarding similar work: ${proj}` : '';
  }, [searchParams]);

  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    subject: initialSubject,
    serviceRequired: initialService,
    projectType: PROJECT_TYPES[0],
    projectLocation: '',
    estimatedBudget: BUDGET_RANGES[5],
    preferredContactMethod: 'Email',
    message: '',
    website: '' // Honeypot
  });

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const submissionSessionRef = useRef(0);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [formspreeState, submitToFormspree, resetFormspree] = useForm<Record<string, string>>(FORMSPREE_FORM_ID);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      serviceRequired: searchParams.get('service') ? initialService : prev.serviceRequired,
      subject: searchParams.get('project') ? initialSubject : prev.subject
    }));
  }, [searchParams, initialService, initialSubject]);

  useEffect(() => {
    if (formspreeState.errors) {
      console.warn('[SPES Formspree] Formspree did not accept the background submission.');
    }
  }, [formspreeState.errors]);

  const validateContactForm = (values: typeof form): string | null => {
    const fullName = values.fullName.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    const serviceRequired = values.serviceRequired.trim();
    const projectType = values.projectType.trim();
    const projectLocation = values.projectLocation.trim();
    const message = values.message.trim();

    if (fullName.length < 2 || fullName.length > 140) {
      return 'Please provide your full name (2–140 characters).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 180) {
      return 'Please enter a valid email address.';
    }
    if (phone.length < 6 || phone.length > 40 || phoneDigits.length < 6) {
      return 'Please enter a valid telephone or WhatsApp number.';
    }
    if (!serviceRequired || !projectType) {
      return 'Please select a service discipline and project category.';
    }
    if (projectLocation.length < 2 || projectLocation.length > 180) {
      return 'Please specify the site location or city/state.';
    }
    if (message.length < 10 || message.length > 5000) {
      return 'Please enter your project scope and message (at least 10 characters).';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) {
      return;
    }

    setError('');

    const validationError = validateContactForm(form);
    if (validationError) {
      setError(validationError);
      requestAnimationFrame(() => {
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    const submissionPayload = {
      ...form,
      fullName: form.fullName.trim(),
      companyName: form.companyName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: form.subject.trim(),
      serviceRequired: form.serviceRequired.trim(),
      projectType: form.projectType.trim(),
      projectLocation: form.projectLocation.trim(),
      estimatedBudget: form.estimatedBudget.trim(),
      preferredContactMethod: form.preferredContactMethod.trim(),
      message: form.message.trim()
    };

    const sessionId = ++submissionSessionRef.current;
    submittingRef.current = true;
    setSubmitting(true);

    // Display the approved confirmation screen immediately upon valid submission
    // without waiting for Formspree or the SPES backend to respond.
    setSubmittedRef('RECEIVED');
    setForm({
      fullName: '',
      companyName: '',
      email: '',
      phone: '',
      subject: '',
      serviceRequired: services[0]?.title || 'Architecture',
      projectType: PROJECT_TYPES[0],
      projectLocation: '',
      estimatedBudget: BUDGET_RANGES[5],
      preferredContactMethod: 'Email',
      message: '',
      website: ''
    });

    // Channel 1 (Independent): Submit to Formspree via @formspree/react (skip if honeypot triggered)
    if (!submissionPayload.website) {
      const formspreeData = buildFormspreeSubmissionData(submissionPayload);
      void Promise.resolve(submitToFormspree(formspreeData)).catch((err) => {
        console.warn('[SPES Formspree] Background submission error.', err);
      });
    }

    // Channel 2 (Independent): Submit to existing SPES backend / GitHub-backed CMS
    void (async () => {
      try {
        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify(submissionPayload)
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          reference?: string;
        };
        if (submissionSessionRef.current === sessionId && res.ok && data.ok && data.reference) {
          setSubmittedRef((current) => (current ? data.reference! : current));
        }
      } catch (err) {
        console.warn('[SPES Enquiry] Background SPES backend submission error.', err);
      } finally {
        if (submissionSessionRef.current === sessionId) {
          submittingRef.current = false;
          setSubmitting(false);
        }
      }
    })();
  };

  const whatsappDigits = (settings.whatsappPrimary || '2347076365837').replace(/\D/g, '');
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';

  return (
    <div>
      <SEOHead
        title="Contact & Project Enquiry | SPES Swiftpace Engineering Solutions Limited"
        description="Submit a project brief or reach SPES Swiftpace Engineering Solutions Limited in Ado Ekiti, Ekiti State, Nigeria."
        canonicalPath="/contact"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Engage SPES Swiftpace Engineering',
            url: `${origin}/contact`
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: 'Contact Us', item: `${origin}/contact` }
            ]
          }
        ]}
      />

      <section className="border-b border-white/10 bg-[#040E20]/70 py-12 sm:py-22 blueprint-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]} />
          <div className="max-w-3xl space-y-4">
            <div className="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#12BCEB]">
              Project Consultation Desk
            </div>
            <h1 className="font-editorial text-[2rem] sm:text-6xl font-semibold text-white leading-tight">
              Engage SPES Swiftpace Engineering
            </h1>
            <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed">
              {settings.contactNotice ||
                'Share your site context, architectural goals, or structural engineering requirements. All enquiries are handled confidentially.'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Direct Contact Panel (placed after form on mobile for fast lead entry, left column on desktop) */}
          <aside className="lg:col-span-4 order-2 lg:order-1 space-y-6">
            <div className="p-5 sm:p-8 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-6">
              <div>
                <div className="font-mono-tech text-xs text-[#12BCEB]">
                  {settings.rcNumber || 'RC:8978524'}
                </div>
                <h2 className="font-editorial text-2xl font-semibold text-white mt-1">
                  Corporate Office
                </h2>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#12BCEB] shrink-0 mt-1" />
                  <div>
                    <div className="font-medium text-white">Address</div>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      {settings.addressLine1}, {settings.addressCity}, {settings.addressState},{' '}
                      {settings.addressCountry}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#12BCEB] shrink-0 mt-1" />
                  <div>
                    <div className="font-medium text-white">Telephone</div>
                    <div className="font-mono-tech text-xs text-slate-300 space-y-1 mt-1">
                      <div>
                        <a
                          href={`tel:${(settings.phonePrimary || '').replace(/\s+/g, '')}`}
                          className="hover:text-[#12BCEB]"
                        >
                          {settings.phonePrimary}
                        </a>
                      </div>
                      {settings.phoneSecondary && (
                        <div>
                          <a
                            href={`tel:${settings.phoneSecondary.replace(/\s+/g, '')}`}
                            className="hover:text-[#12BCEB]"
                          >
                            {settings.phoneSecondary}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#12BCEB] shrink-0 mt-1" />
                  <div>
                    <div className="font-medium text-white">Email</div>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-slate-300 hover:text-[#12BCEB] break-all mt-0.5 inline-block"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#078A43] hover:bg-[#09a350] text-white px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message on WhatsApp
                </a>

                {(settings.socialLinks?.instagram ||
                  settings.socialLinks?.linkedin ||
                  settings.socialLinks?.facebook ||
                  settings.socialLinks?.x) && (
                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Official Social Media
                    </div>
                    <div className="space-y-2">
                      {settings.socialLinks?.instagram && (
                        <a
                          href={settings.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[44px] flex items-center justify-between rounded-lg border border-white/15 bg-[#06142B] hover:border-[#E1306C]/70 px-3.5 py-2.5 text-xs text-slate-200 hover:text-white transition-colors"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Instagram className="w-4 h-4 text-[#E1306C] shrink-0" />
                            <span>
                              <strong className="font-semibold text-white block">Instagram</strong>
                              <span className="text-slate-400">@swiftpace_engineering</span>
                            </span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </a>
                      )}
                      {settings.socialLinks?.linkedin && (
                        <a
                          href={settings.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[44px] flex items-center justify-between rounded-lg border border-white/15 bg-[#06142B] hover:border-[#12BCEB]/60 px-3.5 py-2.5 text-xs text-slate-200 hover:text-white transition-colors"
                        >
                          <span>LinkedIn</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                      {settings.socialLinks?.facebook && (
                        <a
                          href={settings.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[44px] flex items-center justify-between rounded-lg border border-white/15 bg-[#06142B] hover:border-[#12BCEB]/60 px-3.5 py-2.5 text-xs text-slate-200 hover:text-white transition-colors"
                        >
                          <span>Facebook</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                      {settings.socialLinks?.x && (
                        <a
                          href={settings.socialLinks.x}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[44px] flex items-center justify-between rounded-lg border border-white/15 bg-[#06142B] hover:border-[#12BCEB]/60 px-3.5 py-2.5 text-xs text-slate-200 hover:text-white transition-colors"
                        >
                          <span>X</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Enquiry Form */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            {submittedRef ? (
              <div className="p-6 sm:p-10 rounded-xl border border-[#078A43]/50 bg-[#0B1E3D] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#078A43]/20 border border-[#078A43]/40 text-[#37d67a] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="font-editorial text-3xl font-semibold text-white">
                  Project Enquiry Recorded
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Thank you for contacting {settings.companyName}. Your confidential brief has been logged privately for our engineering review team.
                </p>
                <div className="font-mono-tech text-xs text-[#12BCEB]">
                  Reference ID: {submittedRef}
                </div>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      submittingRef.current = false;
                      setSubmitting(false);
                      setError('');
                      resetFormspree();
                      setSubmittedRef(null);
                    }}
                    className="w-full sm:w-auto min-h-[44px] rounded-lg border border-white/20 hover:border-white/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-8 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-5"
              >
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
                  Project Brief Form
                </h2>

                {error && (
                  <div
                    ref={errorBannerRef}
                    role="alert"
                    className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-200"
                  >
                    {error}
                  </div>
                )}

                {/* Honeypot anti-spam field hidden offscreen */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Full Name *
                    </label>
                    <input
                      id="contact-fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={140}
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="e.g. Engr. Adewale Ogunleye"
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-companyName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Organization / Company
                    </label>
                    <input
                      id="contact-companyName"
                      name="companyName"
                      type="text"
                      autoComplete="organization"
                      maxLength={140}
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="Optional"
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      maxLength={180}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      minLength={6}
                      maxLength={40}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+234 ..."
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-serviceRequired" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Service Discipline *
                    </label>
                    <select
                      id="contact-serviceRequired"
                      name="serviceRequired"
                      required
                      value={form.serviceRequired}
                      onChange={(e) => setForm({ ...form, serviceRequired: e.target.value })}
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-[#12BCEB]"
                    >
                      {services.map((s) => (
                        <option key={s.slug} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                      <option value="General Enquiry">General / Multiple Disciplines</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-projectType" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Project Category *
                    </label>
                    <select
                      id="contact-projectType"
                      name="projectType"
                      required
                      value={form.projectType}
                      onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-[#12BCEB]"
                    >
                      {PROJECT_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-projectLocation" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Site Location *
                    </label>
                    <input
                      id="contact-projectLocation"
                      name="projectLocation"
                      type="text"
                      required
                      minLength={2}
                      maxLength={180}
                      value={form.projectLocation}
                      onChange={(e) => setForm({ ...form, projectLocation: e.target.value })}
                      placeholder="City / State"
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-estimatedBudget" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Estimated Budget
                    </label>
                    <select
                      id="contact-estimatedBudget"
                      name="estimatedBudget"
                      value={form.estimatedBudget}
                      onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-[#12BCEB]"
                    >
                      {BUDGET_RANGES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-preferredContactMethod" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Preferred Contact
                    </label>
                    <select
                      id="contact-preferredContactMethod"
                      name="preferredContactMethod"
                      value={form.preferredContactMethod}
                      onChange={(e) => setForm({ ...form, preferredContactMethod: e.target.value })}
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-[#12BCEB]"
                    >
                      <option value="Email">Email</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    maxLength={180}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Short title for your project brief"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Project Scope &amp; Details *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Outline land status, structural scope, design needs, or preferred timeline..."
                    className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-3 text-base sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#12BCEB]"
                  />
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] disabled:opacity-60 text-[#06142B] px-7 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting Enquiry...' : 'Submit Confidential Enquiry'}
                  </button>
                  <p className="text-xs text-slate-400 text-center sm:text-right">
                    Handled confidentially by our engineering consultation desk.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
