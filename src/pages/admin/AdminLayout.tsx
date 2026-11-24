import React, { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  ExternalLink,
  FileText,
  FolderKanban,
  HelpCircle,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { SEOHead } from '../../components/common/SEOHead';

const ADMIN_NAV = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Projects', to: '/admin/projects', icon: FolderKanban },
  { label: 'Gallery Photos', to: '/admin/media', icon: Images },
  { label: 'Blog Articles', to: '/admin/blog', icon: FileText },
  { label: 'Services', to: '/admin/services', icon: Briefcase },
  { label: 'Enquiries', to: '/admin/enquiries', icon: Inbox },
  { label: 'FAQs', to: '/admin/faqs', icon: HelpCircle },
  { label: 'Company Profile', to: '/admin/company', icon: Building2 },
  { label: 'Website Settings', to: '/admin/settings', icon: Settings }
];

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, isLoading, username, statusInfo, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06142B] flex items-center justify-center text-sm text-slate-300">
        Verifying administrator session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <BrandLogo sizeClass="w-9 h-9" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              SPES Admin
            </div>
            <div className="font-mono-tech text-[11px] text-[#12BCEB]">
              {statusInfo?.cmsMode === 'github' ? 'GitHub Live CMS' : 'Local Preview CMS'}
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Administrator navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#12BCEB]/15 text-[#12BCEB] border border-[#12BCEB]/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="text-xs text-slate-400">
          Signed in as <span className="font-mono-tech text-white">{username}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 hover:border-white/35 px-3 py-2 text-xs font-medium text-slate-200"
          >
            View Site <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06142B] text-slate-100 flex">
      <SEOHead title="Admin CMS | SPES Swiftpace Engineering Solutions" noIndex />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-white/10 bg-[#040E20]">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-68 bg-[#040E20] border-r border-white/10 h-full">
            {navContent}
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-white/10 bg-[#040E20]/80 px-4 sm:px-6 flex items-center justify-between lg:justify-end">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden inline-flex items-center gap-2 text-xs font-semibold text-slate-200"
          >
            <Menu className="w-5 h-5" aria-hidden="true" /> Menu
          </button>
          <div className="text-xs text-slate-400">
            SPES Swiftpace Content Management · GitHub Repository &amp; Issues Sync
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
