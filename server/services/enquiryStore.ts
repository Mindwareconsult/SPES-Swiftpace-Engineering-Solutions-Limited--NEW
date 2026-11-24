import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { ContactEnquiry, EnquiryStatus } from '../../shared/cmsTypes.ts';
import {
  ghCreateEnquiryIssue,
  ghDeleteEnquiryIssue,
  ghListEnquiryIssues,
  ghUpdateEnquiryIssue,
  isGitHubConfigured
} from './github.ts';

const PRIVATE_ENQUIRY_DIR = path.resolve(process.cwd(), '.private_enquiries');
const PRIVATE_ENQUIRY_FILE = path.join(PRIVATE_ENQUIRY_DIR, 'enquiries.json');

// In-memory fallback for serverless preview when GitHub is not yet configured
let memoryEnquiries: ContactEnquiry[] | null = null;

function readLocalEnquiries(): ContactEnquiry[] {
  if (memoryEnquiries) return memoryEnquiries;
  try {
    if (fs.existsSync(PRIVATE_ENQUIRY_FILE)) {
      const raw = fs.readFileSync(PRIVATE_ENQUIRY_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryEnquiries = parsed as ContactEnquiry[];
        return memoryEnquiries;
      }
    }
  } catch {
    // Fall back to empty list
  }
  memoryEnquiries = [];
  return memoryEnquiries;
}

function writeLocalEnquiries(items: ContactEnquiry[]): void {
  memoryEnquiries = items;
  try {
    fs.mkdirSync(PRIVATE_ENQUIRY_DIR, { recursive: true });
    fs.writeFileSync(PRIVATE_ENQUIRY_FILE, JSON.stringify(items, null, 2) + '\n', { mode: 0o600 });
  } catch {
    // Serverless filesystem may be read-only when unconfigured; memoryEnquiries holds state for session
  }
}

export async function createEnquiry(input: {
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  subject?: string;
  serviceRequired: string;
  projectType: string;
  projectLocation: string;
  estimatedBudget?: string;
  preferredContactMethod?: string;
  message: string;
}): Promise<{ enquiry: ContactEnquiry; storage: 'github-issues' | 'local-preview' }> {
  const now = new Date().toISOString();
  const record: ContactEnquiry = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    companyName: (input.companyName || '').trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    subject: (input.subject || input.serviceRequired || 'Project Enquiry').trim(),
    serviceRequired: input.serviceRequired.trim(),
    projectType: input.projectType.trim(),
    projectLocation: input.projectLocation.trim(),
    estimatedBudget: (input.estimatedBudget || 'To be discussed').trim(),
    preferredContactMethod: (input.preferredContactMethod || 'Email').trim(),
    message: input.message.trim(),
    status: 'New',
    internalNotes: '',
    createdAt: now,
    updatedAt: now
  };

  if (isGitHubConfigured()) {
    const saved = await ghCreateEnquiryIssue(record);
    return { enquiry: saved, storage: 'github-issues' };
  }

  const current = readLocalEnquiries();
  const next = [record, ...current];
  writeLocalEnquiries(next);
  return { enquiry: record, storage: 'local-preview' };
}

export async function listEnquiries(): Promise<{
  enquiries: ContactEnquiry[];
  storage: 'github-issues' | 'local-preview';
}> {
  if (isGitHubConfigured()) {
    const issues = await ghListEnquiryIssues();
    return { enquiries: issues, storage: 'github-issues' };
  }

  const local = readLocalEnquiries();
  return {
    enquiries: [...local].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    storage: 'local-preview'
  };
}

export async function updateEnquiry(
  idOrIssueNumber: string,
  updates: { status?: EnquiryStatus; internalNotes?: string }
): Promise<ContactEnquiry> {
  if (isGitHubConfigured()) {
    const issueNum = Number(idOrIssueNumber);
    if (!Number.isFinite(issueNum) || issueNum <= 0) {
      throw new Error('Invalid GitHub Issue enquiry reference.');
    }
    return ghUpdateEnquiryIssue(issueNum, updates);
  }

  const current = readLocalEnquiries();
  const idx = current.findIndex((e) => e.id === idOrIssueNumber || String(e.issueNumber) === idOrIssueNumber);
  if (idx === -1) {
    throw new Error('Enquiry not found.');
  }
  const updated: ContactEnquiry = {
    ...current[idx],
    status: updates.status ?? current[idx].status,
    internalNotes: updates.internalNotes !== undefined ? updates.internalNotes : current[idx].internalNotes,
    updatedAt: new Date().toISOString()
  };
  current[idx] = updated;
  writeLocalEnquiries(current);
  return updated;
}

export async function deleteEnquiry(idOrIssueNumber: string): Promise<void> {
  if (isGitHubConfigured()) {
    const issueNum = Number(idOrIssueNumber);
    if (!Number.isFinite(issueNum) || issueNum <= 0) {
      throw new Error('Invalid GitHub Issue enquiry reference.');
    }
    await ghDeleteEnquiryIssue(issueNum);
    return;
  }

  const current = readLocalEnquiries();
  const filtered = current.filter((e) => e.id !== idOrIssueNumber && String(e.issueNumber) !== idOrIssueNumber);
  writeLocalEnquiries(filtered);
}
