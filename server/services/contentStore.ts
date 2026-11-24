import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  BlogCategoryItem,
  BlogPostItem,
  CmsBootstrapPayload,
  CompanyInfo,
  FaqItem,
  GalleryItem,
  ProjectItem,
  ServiceItem,
  WebsiteSettings
} from '../../shared/cmsTypes.ts';
import {
  ghDeleteFile,
  ghGetFile,
  ghListDir,
  ghPutFile,
  isGitHubConfigured,
  sanitizeRepoPath
} from './github.ts';

const ROOT = process.cwd();
const CONTENT_DIR = path.resolve(ROOT, 'content');
const PUBLIC_UPLOADS_DIR = path.resolve(ROOT, 'public', 'uploads');

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB safe under Netlify 6 MB function limit
export const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

export function inferImageMime(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

export function sanitizeSlug(raw: string): string {
  const clean = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  if (!clean) {
    throw new Error('A valid title or slug is required.');
  }
  return clean;
}

export function validateImageBuffer(
  buffer: Buffer,
  filename: string
): { valid: boolean; ext: string; reason?: string } {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return { valid: false, ext, reason: 'Only JPG, JPEG, PNG, WEBP, GIF, and SVG images are supported.' };
  }
  if (!buffer || buffer.length === 0) {
    return { valid: false, ext, reason: 'Uploaded image is empty.' };
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { valid: false, ext, reason: 'Image exceeds the 4 MB upload limit. Please compress or resize it.' };
  }

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { valid: true, ext };
      }
      return { valid: false, ext, reason: 'Invalid JPEG file signature.' };
    case '.png':
      if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        return { valid: true, ext };
      }
      return { valid: false, ext, reason: 'Invalid PNG file signature.' };
    case '.webp':
      if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      ) {
        return { valid: true, ext };
      }
      return { valid: false, ext, reason: 'Invalid WEBP file signature.' };
    case '.gif': {
      const header = buffer.subarray(0, 6).toString('ascii');
      if (header === 'GIF87a' || header === 'GIF89a') {
        return { valid: true, ext };
      }
      return { valid: false, ext, reason: 'Invalid GIF file signature.' };
    }
    case '.svg': {
      const text = buffer.toString('utf8');
      if (!/<svg[\s>]/i.test(text.slice(0, 4096))) {
        return { valid: false, ext, reason: 'Invalid SVG markup.' };
      }
      if (/<script\b|javascript:|on\w+\s*=/i.test(text)) {
        return { valid: false, ext, reason: 'SVG contains disallowed script content.' };
      }
      return { valid: true, ext };
    }
    default:
      return { valid: false, ext, reason: 'Unsupported image format.' };
  }
}

function resolveConfinedPath(baseDir: string, relativePath: string): string {
  const cleanRel = sanitizeRepoPath(relativePath);
  const resolved = path.resolve(baseDir, cleanRel);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    throw new Error('Path confinement violation.');
  }
  return resolved;
}

function tryWriteLocalFile(baseDir: string, relativePath: string, data: Buffer | string): void {
  try {
    const fullPath = resolveConfinedPath(baseDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, data);
  } catch {
    // Serverless environments (e.g. AWS Lambda / Netlify Functions) have a read-only bundle filesystem
  }
}

function tryDeleteLocalFile(baseDir: string, relativePath: string): void {
  try {
    const fullPath = resolveConfinedPath(baseDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    // Ignore read-only bundle errors
  }
}

async function readJsonFromLocal<T>(relPath: string): Promise<T | null> {
  const fullPath = resolveConfinedPath(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw) as T;
}

async function readJson<T>(repoPath: string, preferRemote = false): Promise<T | null> {
  if (preferRemote && isGitHubConfigured()) {
    try {
      const remote = await ghGetFile(repoPath);
      if (remote) {
        return JSON.parse(remote.content.toString('utf8')) as T;
      }
    } catch (err) {
      console.warn(`[CMS] Falling back to bundled file for ${repoPath}:`, err);
    }
  }
  return readJsonFromLocal<T>(repoPath);
}

async function listJsonCollection<T>(dirRepoPath: string, preferRemote = false, filterFn?: (name: string) => boolean): Promise<T[]> {
  if (preferRemote && isGitHubConfigured()) {
    try {
      const entries = await ghListDir(dirRepoPath);
      const jsonEntries = entries.filter(
        (e) => e.type === 'file' && e.name.endsWith('.json') && (!filterFn || filterFn(e.name))
      );
      const results = await Promise.all(
        jsonEntries.map(async (entry) => {
          const file = await ghGetFile(entry.path);
          return file ? (JSON.parse(file.content.toString('utf8')) as T) : null;
        })
      );
      const out: T[] = [];
      for (const item of results) {
        if (item !== null) out.push(item as T);
      }
      return out;
    } catch (err) {
      console.warn(`[CMS] Falling back to bundled dir for ${dirRepoPath}:`, err);
    }
  }

  const localDir = resolveConfinedPath(ROOT, dirRepoPath);
  if (!fs.existsSync(localDir)) return [];
  const files = fs
    .readdirSync(localDir)
    .filter((name) => name.endsWith('.json') && (!filterFn || filterFn(name)));
  const out: T[] = [];
  for (const name of files) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(localDir, name), 'utf8')) as T;
      out.push(parsed);
    } catch {
      // Skip malformed entry
    }
  }
  return out;
}

async function writeJson(repoPath: string, data: unknown, commitMessage: string): Promise<{ persistedTo: 'github' | 'local' }> {
  const serialized = JSON.stringify(data, null, 2) + '\n';
  if (isGitHubConfigured()) {
    await ghPutFile(repoPath, serialized, commitMessage);
    tryWriteLocalFile(ROOT, repoPath, serialized);
    return { persistedTo: 'github' };
  }

  const fullPath = resolveConfinedPath(ROOT, repoPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, serialized, 'utf8');
  return { persistedTo: 'local' };
}

async function removeJson(repoPath: string, commitMessage: string): Promise<{ persistedTo: 'github' | 'local' }> {
  if (isGitHubConfigured()) {
    await ghDeleteFile(repoPath, commitMessage);
    tryDeleteLocalFile(ROOT, repoPath);
    return { persistedTo: 'github' };
  }
  const fullPath = resolveConfinedPath(ROOT, repoPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
  return { persistedTo: 'local' };
}

// =========================================================================
// Public & Admin CMS Operations
// =========================================================================

export async function getFullCmsData(options: { preferRemote?: boolean; includeUnpublished?: boolean } = {}): Promise<CmsBootstrapPayload> {
  const preferRemote = Boolean(options.preferRemote);
  const includeUnpublished = Boolean(options.includeUnpublished);

  const [projectsRaw, servicesRaw, blogPostsRaw, blogCategories, galleryRaw, faqsRaw, company, settings] =
    await Promise.all([
      listJsonCollection<ProjectItem>('content/projects', preferRemote),
      listJsonCollection<ServiceItem>('content/services', preferRemote),
      listJsonCollection<BlogPostItem>('content/blog', preferRemote, (n) => !n.startsWith('_')),
      readJson<BlogCategoryItem[]>('content/blog/_categories.json', preferRemote),
      readJson<GalleryItem[]>('content/gallery/gallery.json', preferRemote),
      readJson<FaqItem[]>('content/faqs/faqs.json', preferRemote),
      readJson<CompanyInfo>('content/company/company.json', preferRemote),
      readJson<WebsiteSettings>('content/settings/settings.json', preferRemote)
    ]);

  const projects = projectsRaw
    .filter((p) => includeUnpublished || p.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const services = servicesRaw
    .filter((s) => includeUnpublished || s.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const blogPosts = blogPostsRaw
    .filter((b) => includeUnpublished || b.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const gallery = (galleryRaw || [])
    .filter((g) => includeUnpublished || g.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const faqs = (faqsRaw || [])
    .filter((f) => includeUnpublished || f.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return {
    projects,
    services,
    blogPosts,
    blogCategories: blogCategories || [],
    gallery,
    faqs,
    company: company || ({} as CompanyInfo),
    settings: settings || ({} as WebsiteSettings),
    meta: {
      cmsMode: isGitHubConfigured() ? 'github' : 'local',
      generatedAt: new Date().toISOString()
    }
  };
}

export async function saveProject(project: ProjectItem) {
  const slug = sanitizeSlug(project.slug || project.title);
  const record: ProjectItem = {
    ...project,
    id: slug,
    slug,
    updatedAt: new Date().toISOString()
  };
  const status = await writeJson(`content/projects/${slug}.json`, record, `CMS: Save project "${record.title}"`);
  return { item: record, ...status };
}

export async function deleteProject(slug: string) {
  const clean = sanitizeSlug(slug);
  return removeJson(`content/projects/${clean}.json`, `CMS: Delete project "${clean}"`);
}

export async function saveService(service: ServiceItem) {
  const slug = sanitizeSlug(service.slug || service.title);
  const record: ServiceItem = {
    ...service,
    id: slug,
    slug,
    updatedAt: new Date().toISOString()
  };
  const status = await writeJson(`content/services/${slug}.json`, record, `CMS: Save service "${record.title}"`);
  return { item: record, ...status };
}

export async function deleteService(slug: string) {
  const clean = sanitizeSlug(slug);
  return removeJson(`content/services/${clean}.json`, `CMS: Delete service "${clean}"`);
}

export async function saveBlogPost(post: BlogPostItem) {
  const slug = sanitizeSlug(post.slug || post.title);
  const record: BlogPostItem = {
    ...post,
    id: slug,
    slug,
    updatedAt: new Date().toISOString()
  };
  const status = await writeJson(`content/blog/${slug}.json`, record, `CMS: Save blog post "${record.title}"`);
  return { item: record, ...status };
}

export async function deleteBlogPost(slug: string) {
  const clean = sanitizeSlug(slug);
  return removeJson(`content/blog/${clean}.json`, `CMS: Delete blog post "${clean}"`);
}

export async function saveBlogCategories(categories: BlogCategoryItem[]) {
  const status = await writeJson('content/blog/_categories.json', categories, 'CMS: Update blog categories');
  return { items: categories, ...status };
}

export async function saveGalleryItems(items: GalleryItem[]) {
  const normalized = items.map((item, idx) => ({ ...item, order: item.order ?? idx + 1 }));
  const status = await writeJson('content/gallery/gallery.json', normalized, 'CMS: Update gallery items');
  return { items: normalized, ...status };
}

export async function saveFaqs(items: FaqItem[]) {
  const normalized = items.map((item, idx) => ({ ...item, order: item.order ?? idx + 1 }));
  const status = await writeJson('content/faqs/faqs.json', normalized, 'CMS: Update FAQs');
  return { items: normalized, ...status };
}

export async function saveCompanyInfo(company: CompanyInfo) {
  const status = await writeJson('content/company/company.json', company, 'CMS: Update company profile');
  return { item: company, ...status };
}

export async function saveSettings(settings: WebsiteSettings) {
  const status = await writeJson('content/settings/settings.json', settings, 'CMS: Update website settings');
  return { item: settings, ...status };
}

export async function uploadImageAsset(options: {
  folder: 'projects' | 'blog' | 'services' | 'gallery' | 'branding';
  filename: string;
  base64Data: string;
  subFolder?: string;
}): Promise<{ url: string; filename: string; persistedTo: 'github' | 'local' }> {
  const cleanBase64 = options.base64Data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const validation = validateImageBuffer(buffer, options.filename);
  if (!validation.valid) {
    throw new Error(validation.reason || 'Invalid image upload.');
  }

  const rawBase = path.basename(options.filename, validation.ext);
  const safeBase =
    rawBase
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image';
  const suffix = crypto.randomUUID().slice(0, 6);
  const finalFilename = `${safeBase}-${suffix}${validation.ext}`;

  const cleanSub = options.subFolder ? sanitizeSlug(options.subFolder) : '';
  const relUnderUploads = cleanSub
    ? `${options.folder}/${cleanSub}/${finalFilename}`
    : `${options.folder}/${finalFilename}`;

  const repoPath = `public/uploads/${relUnderUploads}`;
  const publicUrl = `/uploads/${relUnderUploads}`;

  if (isGitHubConfigured()) {
    await ghPutFile(repoPath, buffer, `CMS: Upload image ${relUnderUploads}`);
    tryWriteLocalFile(PUBLIC_UPLOADS_DIR, relUnderUploads, buffer);
    return { url: publicUrl, filename: finalFilename, persistedTo: 'github' };
  }

  const destPath = resolveConfinedPath(PUBLIC_UPLOADS_DIR, relUnderUploads);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  return { url: publicUrl, filename: finalFilename, persistedTo: 'local' };
}

export async function readPublicUploadAsset(relPath: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  let cleanRel: string;
  try {
    cleanRel = sanitizeRepoPath(relPath);
  } catch {
    return null;
  }

  const localPath = resolveConfinedPath(PUBLIC_UPLOADS_DIR, cleanRel);
  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    return {
      buffer: fs.readFileSync(localPath),
      contentType: inferImageMime(cleanRel)
    };
  }

  if (isGitHubConfigured()) {
    try {
      const remote = await ghGetFile(`public/uploads/${cleanRel}`);
      if (remote) {
        return {
          buffer: remote.content,
          contentType: inferImageMime(cleanRel)
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}
