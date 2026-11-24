export interface FormspreeEnquiryPayload {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  subject: string;
  serviceRequired: string;
  projectType: string;
  projectLocation: string;
  estimatedBudget: string;
  preferredContactMethod: string;
  message: string;
  website: string; // Honeypot field mapped to Formspree's _gotcha
}

/**
 * Formats contact form fields for @formspree/react's useForm submission handler.
 * Includes _subject, _replyto, _gotcha, and formIdentifier so enquiries are clearly
 * tagged as SPES Swiftpace Engineering Solutions Limited website submissions.
 */
export function buildFormspreeSubmissionData(
  payload: FormspreeEnquiryPayload
): Record<string, string> {
  const trimmedSubject = (payload.subject || '').trim();
  const formattedEmailSubject = trimmedSubject
    ? `[SPES Website Enquiry] ${trimmedSubject}`
    : `[SPES Website Enquiry] ${payload.serviceRequired.trim()} — ${payload.fullName.trim()}`;

  return {
    formIdentifier: 'SPES Swiftpace Engineering Solutions Limited — Website Contact Form',
    _subject: formattedEmailSubject,
    _replyto: payload.email.trim(),
    _gotcha: payload.website,
    name: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    company: payload.companyName.trim() || 'Not specified',
    subject: trimmedSubject || 'Project Consultation Enquiry',
    serviceRequired: payload.serviceRequired.trim(),
    projectCategory: payload.projectType.trim(),
    siteLocation: payload.projectLocation.trim(),
    estimatedBudget: payload.estimatedBudget.trim(),
    preferredContactMethod: payload.preferredContactMethod.trim(),
    message: payload.message.trim(),
    sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
    submittedAt: new Date().toISOString()
  };
}
