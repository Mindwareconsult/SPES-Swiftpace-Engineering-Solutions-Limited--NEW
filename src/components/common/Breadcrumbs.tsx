import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbEntry {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbEntry[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5 min-w-0">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-[#12BCEB] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={
                    isLast
                      ? 'text-slate-200 font-medium truncate max-w-[240px] sm:max-w-md'
                      : 'text-slate-400 whitespace-nowrap'
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
