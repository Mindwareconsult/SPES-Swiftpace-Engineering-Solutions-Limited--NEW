import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  FolderKanban,
  HelpCircle,
  Images,
  Inbox,
  Info,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ContactEnquiry } from '../../types';

interface OverviewResponse {
  cmsMode: 'github' | 'local';
  enquiryStorage: 'github-issues' | 'local-preview';
  counts: {
    projectsTotal: number;
    projectsPublished: number;
    blogTotal: number;
    blogPublished: number;
    servicesTotal: number;
    servicesPublished: number;
    galleryTotal: number;
    galleryPublished: number;
    faqsTotal: number;
    faqsPublished: number;
    enquiriesTotal: number;
    enquiriesNew: number;
  };
  recentEnquiries: ContactEnquiry[];
  recentUpdates: Array<{
    type: string;
    title: string;
    status: string;
    updatedAt: string;
    href: string;
  }>;
}

export const AdminDashboard: React.FC = () => {
  const { adminFetch } = useAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/overview');
        if (!res.ok) throw new Error('Unable to load overview metrics.');
        setData((await res.json()) as OverviewResponse);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard overview.');
      }
    })();
  }, [adminFetch]);

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-slate-400">Loading SPES CMS overview...</div>;
  }

  const statCards = [
    {
      label: 'Projects',
      value: `${data.counts.projectsPublished} / ${data.counts.projectsTotal}`,
      sub: 'Published / Total',
      href: '/admin/projects',
      icon: FolderKanban
    },
    {
      label: 'Blog Articles',
      value: `${data.counts.blogPublished} / ${data.counts.blogTotal}`,
      sub: 'Published / Total',
      href: '/admin/blog',
      icon: FileText
    },
    {
      label: 'Services',
      value: `${data.counts.servicesPublished} / ${data.counts.servicesTotal}`,
      sub: 'Published / Total',
      href: '/admin/services',
      icon: Briefcase
    },
    {
      label: 'Gallery Photos',
      value: `${data.counts.galleryPublished} / ${data.counts.galleryTotal}`,
      sub: 'Visible / Total',
      href: '/admin/media',
      icon: Images
    },
    {
      label: 'FAQs',
      value: `${data.counts.faqsPublished} / ${data.counts.faqsTotal}`,
      sub: 'Published / Total',
      href: '/admin/faqs',
      icon: HelpCircle
    },
    {
      label: 'Client Enquiries',
      value: `${data.counts.enquiriesNew} New`,
      sub: `${data.counts.enquiriesTotal} Total recorded`,
      href: '/admin/enquiries',
      icon: Inbox
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">
            CMS Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage SPES Swiftpace projects, photography, technical articles, services, FAQs, and private client enquiries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-4 py-2 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Manage Projects
          </Link>
          <Link
            to="/admin/blog"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 hover:border-white/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
          >
            <Plus className="w-4 h-4" /> Write Article
          </Link>
        </div>
      </div>

      {/* Mode Notice */}
      <div className="p-4 rounded-xl border border-[#12BCEB]/25 bg-[#0B1E3D] flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
        <Info className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" />
        <div>
          {data.cmsMode === 'github' ? (
            <span>
              <strong className="text-white">GitHub Live CMS Active:</strong> Changes commit directly to your GitHub repository (<code className="font-mono-tech">content/</code> &amp; <code className="font-mono-tech">public/uploads/</code>) and appear live via the API immediately while Netlify runs a background rebuild. Enquiries are saved privately as GitHub Issues.
            </span>
          ) : (
            <span>
              <strong className="text-white">Local Preview Mode:</strong> Changes save directly to local <code className="font-mono-tech">content/</code> files and <code className="font-mono-tech">public/uploads/</code>. When deployed on Netlify with <code className="font-mono-tech">GITHUB_TOKEN</code>, <code className="font-mono-tech">GITHUB_OWNER</code>, and <code className="font-mono-tech">GITHUB_REPO</code>, updates commit directly to GitHub.
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.href}
              className="p-5 rounded-xl border border-white/10 bg-[#0B1E3D] hover:border-[#12BCEB]/50 transition-colors flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-slate-400">{card.label}</div>
                <div className="font-mono-tech text-2xl font-semibold text-white">{card.value}</div>
                <div className="text-xs text-slate-500">{card.sub}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#12BCEB]/10 border border-[#12BCEB]/25 text-[#12BCEB] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Enquiries & Recent Content Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-[#0B1E3D] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Client Enquiries</h2>
            <Link to="/admin/enquiries" className="text-xs text-[#12BCEB] hover:underline">
              Open Inbox
            </Link>
          </div>
          {data.recentEnquiries.length === 0 ? (
            <div className="p-6 text-xs text-slate-400">
              No client enquiries recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {data.recentEnquiries.map((enq) => (
                <Link
                  key={enq.id}
                  to="/admin/enquiries"
                  className="block px-5 py-3.5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white truncate">{enq.fullName}</span>
                    <span className="font-mono-tech text-[11px] text-[#12BCEB] shrink-0">
                      {enq.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {enq.serviceRequired} · {enq.projectLocation}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0B1E3D] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Recent Content Records</h2>
          </div>
          <div className="divide-y divide-white/10">
            {data.recentUpdates.map((item, idx) => (
              <Link
                key={idx}
                to={item.href}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.type}</div>
                </div>
                <span className="font-mono-tech text-[11px] text-slate-300 shrink-0">
                  {item.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
