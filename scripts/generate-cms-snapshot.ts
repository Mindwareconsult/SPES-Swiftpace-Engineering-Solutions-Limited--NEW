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
} from '../shared/cmsTypes.ts';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content');
const OUTPUT_FILE = path.join(ROOT, 'src', 'generated', 'cms-snapshot.json');
const PUBLIC_DIR = path.join(ROOT, 'public');

function readJsonDir<T>(dirPath: string, filterFn?: (name: string) => boolean): T[] {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith('.json') && (!filterFn || filterFn(f)));
  const items: T[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf8');
      items.push(JSON.parse(raw) as T);
    } catch (err) {
      console.warn(`[CMS Snapshot] Skipping malformed JSON file ${file}:`, err);
    }
  }
  return items;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export function generateCmsSnapshot(): CmsBootstrapPayload {
  const projects = readJsonDir<ProjectItem>(path.join(CONTENT_DIR, 'projects'))
    .filter((p) => p.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const services = readJsonDir<ServiceItem>(path.join(CONTENT_DIR, 'services'))
    .filter((s) => s.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const blogPosts = readJsonDir<BlogPostItem>(
    path.join(CONTENT_DIR, 'blog'),
    (name) => !name.startsWith('_')
  )
    .filter((b) => b.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const blogCategories = readJsonFile<BlogCategoryItem[]>(
    path.join(CONTENT_DIR, 'blog', '_categories.json'),
    []
  );
  const gallery = readJsonFile<GalleryItem[]>(
    path.join(CONTENT_DIR, 'gallery', 'gallery.json'),
    []
  )
    .filter((g) => g.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const faqs = readJsonFile<FaqItem[]>(
    path.join(CONTENT_DIR, 'faqs', 'faqs.json'),
    []
  )
    .filter((f) => f.published)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const company = readJsonFile<CompanyInfo>(
    path.join(CONTENT_DIR, 'company', 'company.json'),
    {} as CompanyInfo
  );
  const settings = readJsonFile<WebsiteSettings>(
    path.join(CONTENT_DIR, 'settings', 'settings.json'),
    {} as WebsiteSettings
  );

  const payload: CmsBootstrapPayload = {
    projects,
    services,
    blogPosts,
    blogCategories,
    gallery,
    faqs,
    company,
    settings,
    meta: {
      cmsMode: 'local',
      generatedAt: new Date().toISOString()
    }
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2) + '\n');

  // Also generate static sitemap.xml and robots.txt for Netlify CDN
  const baseUrl = (
    process.env.URL ||
    process.env.PUBLIC_SITE_URL ||
    'https://spesengineeringlimited.com'
  ).replace(/\/+$/, '');

  const staticRoutes: Array<{ path: string; changefreq: string; priority: string; lastmod?: string }> = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.8' },
    { path: '/services', changefreq: 'monthly', priority: '0.8' },
    { path: '/portfolio', changefreq: 'weekly', priority: '0.8' },
    { path: '/gallery', changefreq: 'monthly', priority: '0.7' },
    { path: '/blog', changefreq: 'weekly', priority: '0.8' },
    { path: '/contact', changefreq: 'monthly', priority: '0.8' },
    { path: '/faq', changefreq: 'monthly', priority: '0.7' },
    { path: '/privacy-policy', changefreq: 'yearly', priority: '0.4' },
    { path: '/terms-and-conditions', changefreq: 'yearly', priority: '0.4' }
  ];

  const publishedCategorySet = new Set(
    blogPosts.filter((b) => b.published).map((b) => b.category.toLowerCase())
  );

  const dynamicRoutes: Array<{ path: string; changefreq: string; priority: string; lastmod?: string }> = [
    ...services
      .filter((s) => s.published)
      .map((s) => ({ path: `/services/${s.slug}`, changefreq: 'monthly', priority: '0.8' })),
    ...projects
      .filter((p) => p.published)
      .map((p) => ({ path: `/projects/${p.slug}`, changefreq: 'monthly', priority: '0.8' })),
    ...blogCategories
      .filter((c) => publishedCategorySet.has(c.name.toLowerCase()))
      .map((c) => ({ path: `/blog/category/${c.slug}`, changefreq: 'monthly', priority: '0.6' })),
    ...blogPosts
      .filter((b) => b.published)
      .map((b) => ({
        path: `/blog/${b.slug}`,
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: b.publishedAt && !Number.isNaN(Date.parse(b.publishedAt))
          ? new Date(b.publishedAt).toISOString().slice(0, 10)
          : undefined
      }))
  ];

  const allUrls = [...staticRoutes, ...dynamicRoutes];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (entry) => `  <url>
    <loc>${baseUrl}${entry.path}</loc>${
      entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''
    }
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /.netlify/

Sitemap: ${baseUrl}/sitemap.xml
`;

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt);

  return payload;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const result = generateCmsSnapshot();
  console.log(
    `[CMS Snapshot] Generated snapshot (${result.projects.length} projects, ${result.services.length} services, ${result.blogPosts.length} blog posts, ${result.gallery.length} gallery items, ${result.faqs.length} FAQs) + sitemap.xml + robots.txt.`
  );
}
