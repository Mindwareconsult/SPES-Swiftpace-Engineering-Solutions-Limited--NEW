export interface ProjectImageItem {
  id: string;
  url: string;
  caption: string;
  order: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string;
  client: string;
  projectStatus: string;
  completionDate: string;
  shortDescription: string;
  overview: string;
  objectives: string;
  scopeOfWork: string;
  technicalApproach: string;
  projectOutcome: string;
  coverImage: string;
  featured: boolean;
  published: boolean;
  order: number;
  seoTitle: string;
  metaDescription: string;
  images: ProjectImageItem[];
  updatedAt: string;
}

export interface ServiceBenefitItem {
  title: string;
  desc: string;
}

export interface ServiceStageItem {
  step: string;
  title: string;
  desc: string;
}

export interface ServiceFaqItem {
  q: string;
  a: string;
}

export interface ServiceGalleryImage {
  src: string;
  alt: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  iconName: string;
  shortDescription: string;
  heroImage: string;
  relatedCategory: string;
  galleryImages: ServiceGalleryImage[];
  detailedOverview: string;
  capabilities: string[];
  clientBenefits: ServiceBenefitItem[];
  processStages: ServiceStageItem[];
  faqs: ServiceFaqItem[];
  order: number;
  published: boolean;
  seoTitle: string;
  metaDescription: string;
  updatedAt: string;
}

export interface BlogCategoryItem {
  name: string;
  slug: string;
  description: string;
}

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  published: boolean;
  publishedAt: string;
  seoTitle: string;
  metaDescription: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  filename: string;
  url: string;
  caption: string;
  category: string;
  projectSlug?: string;
  order: number;
  published: boolean;
  uploadedAt: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
}

export interface CompanyInfo {
  legalName: string;
  shortName: string;
  rcNumber: string;
  incorporationAct: string;
  headquarters: string;
  overview: string;
  extendedOverview: string;
  vision: string;
  mission: string;
  coreValues: Array<{ title: string; desc: string }>;
  deliveryPrinciples: Array<{ title: string; desc: string }>;
  verificationPolicy: string;
  sisterEnterprise: {
    name: string;
    description: string;
    url: string;
  };
}

export interface WebsiteSettings {
  companyName: string;
  companyDescription: string;
  rcNumber: string;
  email: string;
  phonePrimary: string;
  phoneSecondary: string;
  whatsappPrimary: string;
  whatsappSecondary: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImage: string;
  contactNotice: string;
  logoUrl: string;
  logoFallbackUrl: string;
  faviconUrl: string;
  footerTagline: string;
  socialLinks: {
    linkedin: string;
    facebook: string;
    instagram: string;
    x: string;
  };
  seoDefaults: {
    siteTitle: string;
    metaDescription: string;
    ogImage: string;
  };
}

export type EnquiryStatus = 'New' | 'Reviewed' | 'Responded' | 'Archived';

export interface ContactEnquiry {
  id: string;
  issueNumber?: number;
  issueUrl?: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  subject: string;
  serviceRequired: string;
  projectType: string;
  projectLocation: string;
  estimatedBudget: string;
  preferredContactMethod: string;
  message: string;
  status: EnquiryStatus;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsBootstrapPayload {
  projects: ProjectItem[];
  services: ServiceItem[];
  blogPosts: BlogPostItem[];
  blogCategories: BlogCategoryItem[];
  gallery: GalleryItem[];
  faqs: FaqItem[];
  company: CompanyInfo;
  settings: WebsiteSettings;
  meta: {
    cmsMode: 'github' | 'local';
    generatedAt: string;
  };
}
