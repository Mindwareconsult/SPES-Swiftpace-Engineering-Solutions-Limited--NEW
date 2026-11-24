/**
 * Formspree Configuration (Separate Public Enquiry Notification Channel)
 * ---------------------------------------------------------------------
 * Official Formspree React integration (@formspree/react) targeting SPES's
 * live Formspree form. This channel operates independently of the SPES Admin
 * Dashboard enquiry system (/api/enquiries).
 */
export const FORMSPREE_FORM_ID =
  (import.meta.env?.VITE_FORMSPREE_FORM_ID || '').trim() || 'xeagldqq';

export const FORMSPREE_ENDPOINT =
  (import.meta.env?.VITE_FORMSPREE_ENDPOINT || '').trim() ||
  `https://formspree.io/f/${FORMSPREE_FORM_ID}`;
