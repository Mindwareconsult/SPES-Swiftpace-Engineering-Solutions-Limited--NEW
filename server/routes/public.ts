import express from 'express';
import { getFullCmsData, readPublicUploadAsset } from '../services/contentStore.ts';
import { createEnquiry } from '../services/enquiryStore.ts';
import { isGitHubConfigured } from '../services/github.ts';
import { getClientIp } from '../middleware/auth.ts';

const router = express.Router();

// Sliding window IP rate limit for public contact enquiries (max 8 per 15 mins per IP)
const enquirySubmissions = new Map<string, number[]>();
const ENQUIRY_WINDOW_MS = 15 * 60 * 1000;
const ENQUIRY_MAX_PER_WINDOW = 8;

function isEnquiryRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (enquirySubmissions.get(ip) || []).filter((ts) => now - ts < ENQUIRY_WINDOW_MS);
  enquirySubmissions.set(ip, recent);
  return recent.length >= ENQUIRY_MAX_PER_WINDOW;
}

function recordEnquirySubmission(ip: string): void {
  const now = Date.now();
  const recent = (enquirySubmissions.get(ip) || []).filter((ts) => now - ts < ENQUIRY_WINDOW_MS);
  recent.push(now);
  enquirySubmissions.set(ip, recent);
}

router.get('/public/bootstrap', async (_req, res) => {
  try {
    const payload = await getFullCmsData({ preferRemote: true, includeUnpublished: false });
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    return res.json(payload);
  } catch (err: any) {
    console.error('[SPES Public Bootstrap Error]', err);
    return res.status(500).json({ error: 'Unable to load website content.' });
  }
});

router.get('/public/uploads/*', async (req, res) => {
  const rawPath = req.path.replace(/^\/public\/uploads\//, '');
  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return res.status(400).json({ error: 'Invalid upload asset path.' });
  }

  const asset = await readPublicUploadAsset(decodedPath);
  if (!asset) {
    return res.status(404).json({ error: 'Uploaded image not found.' });
  }

  res.setHeader('Content-Type', asset.contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(asset.buffer);
});

router.post('/enquiries', async (req, res) => {
  try {
    const body = (req.body || {}) as Record<string, unknown>;

    // Silent honeypot check for spam bots
    const honeypot = String(body.website || body.company_website || '').trim();
    if (honeypot.length > 0) {
      return res.status(200).json({
        ok: true,
        reference: 'RECEIVED',
        storage: isGitHubConfigured() ? 'github-issues' : 'local-preview'
      });
    }

    const clientIp = getClientIp(req);
    if (isEnquiryRateLimited(clientIp)) {
      return res.status(429).json({
        error: 'Too many enquiry submissions from this connection. Please wait a few minutes or call us directly.'
      });
    }

    const fullName = String(body.fullName || '').trim();
    const companyName = String(body.companyName || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const subject = String(body.subject || '').trim();
    const serviceRequired = String(body.serviceRequired || '').trim();
    const projectType = String(body.projectType || '').trim();
    const projectLocation = String(body.projectLocation || '').trim();
    const estimatedBudget = String(body.estimatedBudget || '').trim();
    const preferredContactMethod = String(body.preferredContactMethod || 'Email').trim();
    const message = String(body.message || '').trim();

    if (fullName.length < 2 || fullName.length > 140) {
      return res.status(400).json({ error: 'Please provide your full name (2–140 characters).' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 180) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (phone.length < 6 || phone.length > 40) {
      return res.status(400).json({ error: 'Please enter a valid telephone or WhatsApp number.' });
    }
    if (!serviceRequired || !projectType) {
      return res.status(400).json({ error: 'Please select a service discipline and project category.' });
    }
    if (projectLocation.length < 2 || projectLocation.length > 180) {
      return res.status(400).json({ error: 'Please specify the project location or city/state.' });
    }
    if (message.length < 10 || message.length > 5000) {
      return res.status(400).json({ error: 'Please include a brief project summary (at least 10 characters).' });
    }

    recordEnquirySubmission(clientIp);

    const saved = await createEnquiry({
      fullName,
      companyName,
      email,
      phone,
      subject,
      serviceRequired,
      projectType,
      projectLocation,
      estimatedBudget,
      preferredContactMethod,
      message
    });

    return res.status(201).json({
      ok: true,
      id: saved.enquiry.id,
      reference: saved.enquiry.issueNumber
        ? `SPES-${saved.enquiry.issueNumber}`
        : `SPES-${saved.enquiry.id.slice(0, 8).toUpperCase()}`,
      storage: saved.storage
    });
  } catch (err: any) {
    console.error('[SPES Enquiry Submit Error]', err);
    return res.status(500).json({
      error: err?.message || 'Unable to submit enquiry right now. Please contact us via telephone or WhatsApp.'
    });
  }
});

router.get('/health', async (_req, res) => {
  try {
    const data = await getFullCmsData({ preferRemote: false, includeUnpublished: false });
    return res.json({
      status: 'ok',
      cmsMode: isGitHubConfigured() ? 'github' : 'local',
      githubConfigured: isGitHubConfigured(),
      publishedProjects: data.projects.length,
      publishedServices: data.services.length,
      publishedBlogPosts: data.blogPosts.length,
      publishedGalleryItems: data.gallery.length,
      publishedFaqs: data.faqs.length,
      company: 'SPES Swiftpace Engineering Solutions Limited',
      rc: 'RC:8978524'
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: err?.message || 'Health check failed.' });
  }
});

export default router;
