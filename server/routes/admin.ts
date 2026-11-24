import express from 'express';
import type {
  BlogCategoryItem,
  BlogPostItem,
  CompanyInfo,
  EnquiryStatus,
  FaqItem,
  GalleryItem,
  ProjectItem,
  ServiceItem,
  WebsiteSettings
} from '../../shared/cmsTypes.ts';
import {
  claimInitialAdminPassword,
  clearLoginFailures,
  clearSessionCookie,
  extractSessionToken,
  getClientIp,
  getConfiguredAdminUsername,
  isEnvAdminPasswordConfigured,
  isLoginRateLimited,
  issueSessionToken,
  needsInitialPasswordClaim,
  recordLoginFailure,
  requireAdmin,
  revokeSessionToken,
  setSessionCookie,
  verifyAdminCredentials,
  type AuthenticatedRequest
} from '../middleware/auth.ts';
import {
  deleteBlogPost,
  deleteProject,
  deleteService,
  getFullCmsData,
  sanitizeSlug,
  saveBlogCategories,
  saveBlogPost,
  saveCompanyInfo,
  saveFaqs,
  saveGalleryItems,
  saveProject,
  saveService,
  saveSettings,
  uploadImageAsset
} from '../services/contentStore.ts';
import { deleteEnquiry, listEnquiries, updateEnquiry } from '../services/enquiryStore.ts';
import { isGitHubConfigured } from '../services/github.ts';

const router = express.Router();

// =========================================================================
// Authentication Routes
// =========================================================================

router.get('/status', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    initialized: !needsInitialPasswordClaim(),
    needsClaim: needsInitialPasswordClaim(),
    configuredUsername: getConfiguredAdminUsername(),
    envPasswordConfigured: isEnvAdminPasswordConfigured(),
    cmsMode: isGitHubConfigured() ? 'github' : 'local'
  });
});

router.post('/claim-initial-password', (req, res) => {
  try {
    if (!needsInitialPasswordClaim()) {
      return res.status(409).json({
        error: 'Administrator password is already configured. Please sign in.'
      });
    }

    const username = typeof req.body?.username === 'string' ? req.body.username : undefined;
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const claimed = claimInitialAdminPassword(username, password);
    const session = issueSessionToken(claimed.username);
    setSessionCookie(res, req, session.token);

    return res.status(201).json({
      token: session.token,
      expiresAt: session.expiresAt,
      username: claimed.username
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Unable to set initial administrator password.' });
  }
});

router.post('/login', (req, res) => {
  const clientIp = getClientIp(req);
  if (isLoginRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too many failed login attempts. Please wait 10 minutes before trying again.'
    });
  }

  if (needsInitialPasswordClaim()) {
    return res.status(409).json({
      error: 'Initial administrator password setup is required first.',
      needsClaim: true
    });
  }

  const username = typeof req.body?.username === 'string' ? req.body.username : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!username.trim() || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const check = verifyAdminCredentials(username, password);
  if (!check.valid) {
    recordLoginFailure(clientIp);
    return res.status(401).json({ error: 'Invalid administrator username or password.' });
  }

  clearLoginFailures(clientIp);
  const session = issueSessionToken(check.username);
  setSessionCookie(res, req, session.token);

  return res.json({
    token: session.token,
    expiresAt: session.expiresAt,
    username: check.username
  });
});

router.post('/logout', (req, res) => {
  const { token } = extractSessionToken(req);
  revokeSessionToken(token);
  clearSessionCookie(res, req);
  return res.json({ ok: true });
});

// All routes below require authenticated administrator session
router.use(requireAdmin);

router.get('/me', (req: AuthenticatedRequest, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    username: req.admin!.username,
    cmsMode: isGitHubConfigured() ? 'github' : 'local',
    envPasswordConfigured: isEnvAdminPasswordConfigured()
  });
});

// =========================================================================
// Dashboard Overview & Full CMS Bootstrap
// =========================================================================

router.get('/bootstrap', async (_req, res) => {
  try {
    const data = await getFullCmsData({ preferRemote: true, includeUnpublished: true });
    res.setHeader('Cache-Control', 'no-store');
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to load CMS content.' });
  }
});

router.get('/overview', async (_req, res) => {
  try {
    const [cms, enquiryResult] = await Promise.all([
      getFullCmsData({ preferRemote: true, includeUnpublished: true }),
      listEnquiries()
    ]);

    const enquiries = enquiryResult.enquiries;
    const recentUpdates = [
      ...cms.projects.map((p) => ({
        type: 'Project',
        title: p.title,
        status: p.published ? 'Published' : 'Draft',
        updatedAt: p.updatedAt,
        href: '/admin/projects'
      })),
      ...cms.blogPosts.map((b) => ({
        type: 'Blog',
        title: b.title,
        status: b.published ? 'Published' : 'Draft',
        updatedAt: b.updatedAt,
        href: '/admin/blog'
      })),
      ...cms.services.map((s) => ({
        type: 'Service',
        title: s.title,
        status: s.published ? 'Published' : 'Hidden',
        updatedAt: s.updatedAt,
        href: '/admin/services'
      }))
    ]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 8);

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      cmsMode: isGitHubConfigured() ? 'github' : 'local',
      enquiryStorage: enquiryResult.storage,
      counts: {
        projectsTotal: cms.projects.length,
        projectsPublished: cms.projects.filter((p) => p.published).length,
        blogTotal: cms.blogPosts.length,
        blogPublished: cms.blogPosts.filter((b) => b.published).length,
        servicesTotal: cms.services.length,
        servicesPublished: cms.services.filter((s) => s.published).length,
        galleryTotal: cms.gallery.length,
        galleryPublished: cms.gallery.filter((g) => g.published).length,
        faqsTotal: cms.faqs.length,
        faqsPublished: cms.faqs.filter((f) => f.published).length,
        enquiriesTotal: enquiries.length,
        enquiriesNew: enquiries.filter((e) => e.status === 'New').length
      },
      recentEnquiries: enquiries.slice(0, 5),
      recentUpdates
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to load dashboard overview.' });
  }
});

// =========================================================================
// Projects CRUD
// =========================================================================

router.post('/projects', async (req, res) => {
  try {
    const project = req.body as ProjectItem;
    if (!project?.title?.trim()) {
      return res.status(400).json({ error: 'Project title is required.' });
    }
    const result = await saveProject(project);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to save project.' });
  }
});

router.patch('/projects/reorder', async (req, res) => {
  try {
    const orderedSlugs = Array.isArray(req.body?.orderedSlugs)
      ? (req.body.orderedSlugs as string[])
      : [];
    if (orderedSlugs.length === 0) {
      return res.status(400).json({ error: 'orderedSlugs array is required.' });
    }
    const cms = await getFullCmsData({ preferRemote: true, includeUnpublished: true });
    const bySlug = new Map(cms.projects.map((p) => [p.slug, p]));
    const updated: ProjectItem[] = [];
    for (let i = 0; i < orderedSlugs.length; i++) {
      const target = bySlug.get(orderedSlugs[i]);
      if (target && target.order !== i + 1) {
        const saved = await saveProject({ ...target, order: i + 1 });
        updated.push(saved.item);
      }
    }
    return res.json({ ok: true, updatedCount: updated.length });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to reorder projects.' });
  }
});

router.put('/projects/:slug', async (req, res) => {
  try {
    const existingSlug = sanitizeSlug(req.params.slug);
    const project = req.body as ProjectItem;
    if (!project?.title?.trim()) {
      return res.status(400).json({ error: 'Project title is required.' });
    }
    const targetSlug = sanitizeSlug(project.slug || project.title);
    const result = await saveProject({ ...project, slug: targetSlug });
    if (existingSlug !== targetSlug) {
      await deleteProject(existingSlug).catch(() => undefined);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update project.' });
  }
});

router.delete('/projects/:slug', async (req, res) => {
  try {
    const result = await deleteProject(req.params.slug);
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to delete project.' });
  }
});

// =========================================================================
// Services CRUD
// =========================================================================

router.post('/services', async (req, res) => {
  try {
    const service = req.body as ServiceItem;
    if (!service?.title?.trim()) {
      return res.status(400).json({ error: 'Service title is required.' });
    }
    const result = await saveService(service);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to save service.' });
  }
});

router.patch('/services/reorder', async (req, res) => {
  try {
    const orderedSlugs = Array.isArray(req.body?.orderedSlugs)
      ? (req.body.orderedSlugs as string[])
      : [];
    if (orderedSlugs.length === 0) {
      return res.status(400).json({ error: 'orderedSlugs array is required.' });
    }
    const cms = await getFullCmsData({ preferRemote: true, includeUnpublished: true });
    const bySlug = new Map(cms.services.map((s) => [s.slug, s]));
    let updatedCount = 0;
    for (let i = 0; i < orderedSlugs.length; i++) {
      const target = bySlug.get(orderedSlugs[i]);
      if (target && target.order !== i + 1) {
        await saveService({ ...target, order: i + 1 });
        updatedCount++;
      }
    }
    return res.json({ ok: true, updatedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to reorder services.' });
  }
});

router.put('/services/:slug', async (req, res) => {
  try {
    const existingSlug = sanitizeSlug(req.params.slug);
    const service = req.body as ServiceItem;
    if (!service?.title?.trim()) {
      return res.status(400).json({ error: 'Service title is required.' });
    }
    const targetSlug = sanitizeSlug(service.slug || service.title);
    const result = await saveService({ ...service, slug: targetSlug });
    if (existingSlug !== targetSlug) {
      await deleteService(existingSlug).catch(() => undefined);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update service.' });
  }
});

router.delete('/services/:slug', async (req, res) => {
  try {
    const result = await deleteService(req.params.slug);
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to delete service.' });
  }
});

// =========================================================================
// Blog Posts & Categories CRUD
// =========================================================================

router.post('/blog', async (req, res) => {
  try {
    const post = req.body as BlogPostItem;
    if (!post?.title?.trim()) {
      return res.status(400).json({ error: 'Article title is required.' });
    }
    const result = await saveBlogPost(post);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to save blog article.' });
  }
});

router.put('/blog/:slug', async (req, res) => {
  try {
    const existingSlug = sanitizeSlug(req.params.slug);
    const post = req.body as BlogPostItem;
    if (!post?.title?.trim()) {
      return res.status(400).json({ error: 'Article title is required.' });
    }
    const targetSlug = sanitizeSlug(post.slug || post.title);
    const result = await saveBlogPost({ ...post, slug: targetSlug });
    if (existingSlug !== targetSlug) {
      await deleteBlogPost(existingSlug).catch(() => undefined);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update blog article.' });
  }
});

router.delete('/blog/:slug', async (req, res) => {
  try {
    const result = await deleteBlogPost(req.params.slug);
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to delete blog article.' });
  }
});

router.put('/blog-categories', async (req, res) => {
  try {
    const categories = Array.isArray(req.body?.categories)
      ? (req.body.categories as BlogCategoryItem[])
      : null;
    if (!categories) {
      return res.status(400).json({ error: 'categories array is required.' });
    }
    const result = await saveBlogCategories(categories);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to save blog categories.' });
  }
});

// =========================================================================
// Gallery & FAQs Bulk Persist
// =========================================================================

router.put('/gallery', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? (req.body.items as GalleryItem[]) : null;
    if (!items) {
      return res.status(400).json({ error: 'items array is required.' });
    }
    const result = await saveGalleryItems(items);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update gallery.' });
  }
});

router.put('/faqs', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? (req.body.items as FaqItem[]) : null;
    if (!items) {
      return res.status(400).json({ error: 'items array is required.' });
    }
    const result = await saveFaqs(items);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update FAQs.' });
  }
});

// =========================================================================
// Company Info & Website Settings
// =========================================================================

router.put('/company', async (req, res) => {
  try {
    const company = req.body as CompanyInfo;
    if (!company?.legalName?.trim()) {
      return res.status(400).json({ error: 'Company legal name is required.' });
    }
    const result = await saveCompanyInfo(company);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update company profile.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = req.body as WebsiteSettings;
    if (!settings?.companyName?.trim()) {
      return res.status(400).json({ error: 'Website company name is required.' });
    }
    const result = await saveSettings(settings);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update website settings.' });
  }
});

// =========================================================================
// Direct Image Upload to GitHub Repo (or Local Preview)
// =========================================================================

const ALLOWED_UPLOAD_FOLDERS = new Set(['projects', 'blog', 'services', 'gallery', 'branding']);

router.post('/upload', async (req, res) => {
  try {
    const folder = String(req.body?.folder || 'gallery').trim() as
      | 'projects'
      | 'blog'
      | 'services'
      | 'gallery'
      | 'branding';
    const filename = String(req.body?.filename || '').trim();
    const base64Data = String(req.body?.base64Data || '').trim();
    const subFolder = typeof req.body?.subFolder === 'string' ? req.body.subFolder : undefined;

    if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
      return res.status(400).json({ error: 'Invalid upload destination folder.' });
    }
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Filename and base64Data are required.' });
    }

    const result = await uploadImageAsset({ folder, filename, base64Data, subFolder });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Image upload failed.' });
  }
});

// =========================================================================
// Private Enquiries Management (GitHub Issues API / Local Preview)
// =========================================================================

const VALID_ENQUIRY_STATUSES = new Set<EnquiryStatus>(['New', 'Reviewed', 'Responded', 'Archived']);

function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  // Neutralize CSV formula injection (=, +, -, @, tab, CR)
  const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

router.get('/enquiries', async (_req, res) => {
  try {
    const result = await listEnquiries();
    res.setHeader('Cache-Control', 'no-store');
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unable to load enquiries.' });
  }
});

router.get('/enquiries/export.csv', async (_req, res) => {
  try {
    const { enquiries } = await listEnquiries();
    const headers = [
      'Reference',
      'Date Submitted',
      'Status',
      'Full Name',
      'Company',
      'Email',
      'Phone',
      'Subject',
      'Service Required',
      'Project Type',
      'Project Location',
      'Estimated Budget',
      'Preferred Contact',
      'Message',
      'Internal Notes'
    ];
    const rows = enquiries.map((e) =>
      [
        e.issueNumber ? `SPES-${e.issueNumber}` : `SPES-${e.id.slice(0, 8).toUpperCase()}`,
        e.createdAt,
        e.status,
        e.fullName,
        e.companyName,
        e.email,
        e.phone,
        e.subject,
        e.serviceRequired,
        e.projectType,
        e.projectLocation,
        e.estimatedBudget,
        e.preferredContactMethod,
        e.message,
        e.internalNotes
      ]
        .map(sanitizeCsvCell)
        .join(',')
    );

    const csv = [headers.map(sanitizeCsvCell).join(','), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="spes-enquiries-export.csv"');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unable to export enquiries CSV.' });
  }
});

router.patch('/enquiries/:id', async (req, res) => {
  try {
    const status = req.body?.status as EnquiryStatus | undefined;
    const internalNotes =
      typeof req.body?.internalNotes === 'string' ? req.body.internalNotes : undefined;

    if (status !== undefined && !VALID_ENQUIRY_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid enquiry status.' });
    }

    const updated = await updateEnquiry(req.params.id, { status, internalNotes });
    return res.json({ enquiry: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Unable to update enquiry.' });
  }
});

router.delete('/enquiries/:id', async (req, res) => {
  try {
    await deleteEnquiry(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Unable to delete enquiry.' });
  }
});

export default router;
