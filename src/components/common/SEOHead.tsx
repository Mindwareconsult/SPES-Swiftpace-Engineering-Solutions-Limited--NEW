import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCms } from '../../context/CmsContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  canonicalPath?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function toAbsoluteUrl(urlOrPath: string, origin: string): string {
  if (!urlOrPath) return '';
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const normalizedPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${origin}${normalizedPath}`;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  type = 'website',
  canonicalPath,
  noIndex = false,
  jsonLd
}) => {
  const { settings } = useCms();
  const { pathname } = useLocation();

  const resolvedTitle =
    title ||
    settings.seoDefaults?.siteTitle ||
    `${settings.companyName || 'SPES Swiftpace Engineering Solutions Limited'} | Engineering, Architecture & Construction`;
  const resolvedDescription =
    description ||
    settings.seoDefaults?.metaDescription ||
    settings.companyDescription ||
    '';
  const resolvedImage =
    image ||
    settings.seoDefaults?.ogImage ||
    settings.logoFallbackUrl ||
    '/assets/spes_logo.jpeg';
  const resolvedPath = canonicalPath || pathname || '/';
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://spesengineeringlimited.com';
    const absoluteImage = toAbsoluteUrl(resolvedImage, origin);
    const canonicalUrl = toAbsoluteUrl(resolvedPath, origin);

    document.title = resolvedTitle;

    const setMeta = (
      selector: string,
      content: string,
      attr: 'name' | 'property' = 'name',
      key?: string
    ) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el && key) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      if (el) el.setAttribute('content', content);
    };

    if (resolvedDescription) {
      setMeta('meta[name="description"]', resolvedDescription, 'name', 'description');
      setMeta('meta[property="og:description"]', resolvedDescription, 'property', 'og:description');
      setMeta('meta[name="twitter:description"]', resolvedDescription, 'name', 'twitter:description');
    }

    setMeta('meta[property="og:title"]', resolvedTitle, 'property', 'og:title');
    setMeta('meta[property="og:type"]', type, 'property', 'og:type');
    setMeta('meta[name="twitter:title"]', resolvedTitle, 'name', 'twitter:title');

    if (absoluteImage) {
      setMeta('meta[property="og:image"]', absoluteImage, 'property', 'og:image');
      setMeta('meta[name="twitter:image"]', absoluteImage, 'name', 'twitter:image');
    }

    if (noIndex) {
      setMeta('meta[name="robots"]', 'noindex, nofollow', 'name', 'robots');
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.remove();
      const ogUrlEl = document.querySelector('meta[property="og:url"]');
      if (ogUrlEl) ogUrlEl.remove();
    } else {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();

      let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonicalUrl);
      setMeta('meta[property="og:url"]', canonicalUrl, 'property', 'og:url');
    }

    const existingLd = document.querySelector<HTMLScriptElement>('script[data-spes-seo-ld="true"]');
    if (serializedJsonLd) {
      const scriptEl = existingLd || document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.setAttribute('data-spes-seo-ld', 'true');
      scriptEl.textContent = serializedJsonLd;
      if (!existingLd) {
        document.head.appendChild(scriptEl);
      }
    } else if (existingLd) {
      existingLd.remove();
    }

    return () => {
      const staleLd = document.querySelector('script[data-spes-seo-ld="true"]');
      if (staleLd) staleLd.remove();
    };
  }, [resolvedTitle, resolvedDescription, resolvedImage, resolvedPath, type, noIndex, serializedJsonLd]);

  return null;
};
