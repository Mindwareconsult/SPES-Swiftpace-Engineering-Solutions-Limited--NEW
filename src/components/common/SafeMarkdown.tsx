import React from 'react';
import { SafeImage } from './SafeImage';

function isSafeHref(rawUrl: string): boolean {
  const url = rawUrl.trim();
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('#')) return true;
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isSafeImageSrc(rawUrl: string): boolean {
  const url = rawUrl.trim();
  if (!url) return false;
  if (url.startsWith('/assets/') || url.startsWith('/uploads/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    const key = `inline-${keyCounter++}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={key} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-white/10 font-mono-tech text-[0.85em] text-[#12BCEB]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (isSafeHref(href)) {
          const isExternal = href.startsWith('http');
          nodes.push(
            <a
              key={key}
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-[#12BCEB] underline underline-offset-4 hover:text-white transition-colors break-words"
            >
              {label}
            </a>
          );
        } else {
          nodes.push(label);
        }
      } else {
        nodes.push(token);
      }
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }
  return nodes;
}

export const SafeMarkdown: React.FC<{ content: string; className?: string }> = ({
  content,
  className = ''
}) => {
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Standalone image syntax: ![alt](src)
    const imgMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(trimmed);
    if (imgMatch) {
      const [, alt, src] = imgMatch;
      if (isSafeImageSrc(src)) {
        elements.push(
          <figure key={`img-${i}`} className="my-8 overflow-hidden rounded-xl border border-white/10 bg-[#0B1E3D]">
            <SafeImage src={src} alt={alt || 'Engineering figure'} loading="lazy" className="w-full max-h-[520px] object-cover" />
            {alt ? (
              <figcaption className="px-4 py-2.5 text-xs text-slate-400 border-t border-white/10">
                {alt}
              </figcaption>
            ) : null}
          </figure>
        );
      }
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-8 mb-3 text-xl font-semibold text-white tracking-tight">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="mt-10 mb-4 font-editorial text-2xl sm:text-3xl font-semibold text-white">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="mt-10 mb-4 font-editorial text-3xl sm:text-4xl font-semibold text-white">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-6 pl-5 border-l-2 border-[#12BCEB] text-slate-200 italic leading-relaxed"
        >
          {renderInline(quoteLines.join(' '))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-5 space-y-2.5 pl-5 list-disc marker:text-[#12BCEB] text-slate-300 leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-5 space-y-2.5 pl-5 list-decimal marker:text-[#12BCEB] text-slate-300 leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph (gather consecutive non-block lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3}\s+|>\s+|[-*]\s+|\d+\.\s+|!\[)/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    elements.push(
      <p key={`p-${i}`} className="my-4 text-slate-300 leading-[1.8]">
        {renderInline(paraLines.join(' '))}
      </p>
    );
  }

  return <div className={`text-[15px] sm:text-base break-words ${className}`}>{elements}</div>;
};
