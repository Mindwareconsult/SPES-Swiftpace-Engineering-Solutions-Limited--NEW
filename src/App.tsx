import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WhatsAppButton } from './components/common/WhatsAppButton';
import { BackToTopButton } from './components/common/BackToTopButton';
import { SEOHead } from './components/common/SEOHead';
import { CmsProvider } from './context/CmsContext';
import { AuthProvider } from './context/AuthContext';

// Keep landing page eager for zero-waterfall initial paint
import { Home } from './pages/Home';

// Route-split secondary public pages
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Services = lazy(() => import('./pages/Services').then((m) => ({ default: m.Services })));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail').then((m) => ({ default: m.ServiceDetail })));
const Portfolio = lazy(() => import('./pages/Portfolio').then((m) => ({ default: m.Portfolio })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })));
const Gallery = lazy(() => import('./pages/Gallery').then((m) => ({ default: m.Gallery })));
const Blog = lazy(() => import('./pages/Blog').then((m) => ({ default: m.Blog })));
const BlogDetail = lazy(() => import('./pages/BlogDetail').then((m) => ({ default: m.BlogDetail })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const FAQ = lazy(() => import('./pages/FAQ').then((m) => ({ default: m.FAQ })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));

// Route-split Admin CMS bundle so public visitors never download admin code
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects').then((m) => ({ default: m.AdminProjects })));
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia').then((m) => ({ default: m.AdminMedia })));
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog').then((m) => ({ default: m.AdminBlog })));
const AdminServices = lazy(() => import('./pages/admin/AdminServices').then((m) => ({ default: m.AdminServices })));
const AdminEnquiries = lazy(() => import('./pages/admin/AdminEnquiries').then((m) => ({ default: m.AdminEnquiries })));
const AdminFaqs = lazy(() => import('./pages/admin/AdminFaqs').then((m) => ({ default: m.AdminFaqs })));
const AdminCompany = lazy(() => import('./pages/admin/AdminCompany').then((m) => ({ default: m.AdminCompany })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
};

const RouteFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-[55vh] flex items-center justify-center px-4 text-xs font-mono-tech uppercase tracking-wider text-slate-400"
  >
    Loading page...
  </div>
);

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-[#06142B] text-[#F4F7FB]">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#12BCEB] focus:px-4 focus:py-2.5 focus:text-xs focus:font-bold focus:uppercase focus:tracking-wider focus:text-[#06142B] focus:shadow-lg"
    >
      Skip to main content
    </a>
    <Navbar />
    <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
      {children}
    </main>
    <Footer />
    <BackToTopButton />
    <WhatsAppButton />
  </div>
);

const NotFound: React.FC = () => (
  <div className="min-h-[65vh] flex items-center justify-center text-center px-4">
    <SEOHead
      title="Page Not Found (404) | SPES Swiftpace Engineering Solutions Limited"
      description="The requested page could not be located on the SPES Swiftpace portal."
      noIndex
    />
    <div className="max-w-md space-y-4">
      <div className="font-editorial text-6xl font-semibold text-[#12BCEB]">404</div>
      <h1 className="text-2xl font-semibold text-white">Page Not Found</h1>
      <p className="text-sm text-slate-400 leading-relaxed">
        The requested document or page could not be located on the SPES Swiftpace portal.
      </p>
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Return to Homepage
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg border border-white/20 hover:border-white/40 text-xs font-bold uppercase tracking-wider text-white transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </div>
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CmsProvider>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
              <Route path="/services/:serviceSlug" element={<PublicLayout><ServiceDetail /></PublicLayout>} />
              <Route path="/portfolio" element={<PublicLayout><Portfolio /></PublicLayout>} />
              <Route path="/projects/:projectSlug" element={<PublicLayout><ProjectDetail /></PublicLayout>} />
              <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
              <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
              <Route path="/blog/category/:categorySlug" element={<PublicLayout><Blog /></PublicLayout>} />
              <Route path="/blog/:articleSlug" element={<PublicLayout><BlogDetail /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
              <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
              <Route path="/terms-and-conditions" element={<PublicLayout><Terms /></PublicLayout>} />

              {/* Admin Auth */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

              {/* Protected Admin CMS Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="projects/new" element={<AdminProjects />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="blog/new" element={<AdminBlog />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="enquiries" element={<AdminEnquiries />} />
                <Route path="faqs" element={<AdminFaqs />} />
                <Route path="company" element={<AdminCompany />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </CmsProvider>
    </BrowserRouter>
  );
}

export default App;
