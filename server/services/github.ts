import type { ContactEnquiry, EnquiryStatus } from '../../shared/cmsTypes.ts';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export function getGitHubConfig(): GitHubConfig | null {
  const token = (process.env.GITHUB_TOKEN || '').trim();
  const owner = (process.env.GITHUB_OWNER || '').trim();
  const repo = (process.env.GITHUB_REPO || '').trim();
  const branch = (process.env.GITHUB_BRANCH || 'main').trim() || 'main';
  if (!token || !owner || !repo) {
    return null;
  }
  return { token, owner, repo, branch };
}

export function isGitHubConfigured(): boolean {
  return getGitHubConfig() !== null;
}

export function sanitizeRepoPath(rawPath: string): string {
  const normalized = rawPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.length > 512) {
    throw new Error('Invalid repository path.');
  }
  if (normalized.includes('\0') || normalized.includes('..') || normalized.startsWith('.')) {
    throw new Error('Disallowed path traversal segment.');
  }
  const segments = normalized.split('/');
  if (segments.some((s) => !s || s === '.' || s === '..')) {
    throw new Error('Invalid repository path segments.');
  }
  if (!/^[a-zA-Z0-9._/-]+$/.test(normalized)) {
    throw new Error('Repository path contains unsupported characters.');
  }
  return normalized;
}

function encodeRepoPath(cleanPath: string): string {
  return cleanPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function githubFetch(
  cfg: GitHubConfig,
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('https://')
    ? endpoint
    : `https://api.github.com${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${cfg.token}`);
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', '2022-11-28');
  headers.set('User-Agent', 'SPES-Swiftpace-CMS/2.0');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...init,
    headers
  });
}

export interface GitHubFileEntry {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
  size?: number;
}

export async function ghGetFile(
  repoPath: string
): Promise<{ content: Buffer; sha: string } | null> {
  const cfg = getGitHubConfig();
  if (!cfg) return null;

  const clean = sanitizeRepoPath(repoPath);
  const encoded = encodeRepoPath(clean);
  const res = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encoded}?ref=${encodeURIComponent(cfg.branch)}`
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`GitHub read failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as { content?: string; encoding?: string; sha: string; download_url?: string };
  if (typeof data.content === 'string') {
    const raw = Buffer.from(data.content.replace(/\n/g, ''), 'base64');
    return { content: raw, sha: data.sha };
  }
  if (data.download_url) {
    const rawRes = await fetch(data.download_url, {
      headers: { Authorization: `Bearer ${cfg.token}`, 'User-Agent': 'SPES-Swiftpace-CMS/2.0' }
    });
    if (!rawRes.ok) {
      throw new Error(`GitHub raw download failed (${rawRes.status})`);
    }
    const arr = await rawRes.arrayBuffer();
    return { content: Buffer.from(arr), sha: data.sha };
  }
  return null;
}

export async function ghListDir(repoPath: string): Promise<GitHubFileEntry[]> {
  const cfg = getGitHubConfig();
  if (!cfg) return [];

  const clean = sanitizeRepoPath(repoPath);
  const encoded = encodeRepoPath(clean);
  const res = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encoded}?ref=${encodeURIComponent(cfg.branch)}`
  );

  if (res.status === 404) return [];
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`GitHub directory listing failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((entry: any) => ({
    name: String(entry.name || ''),
    path: String(entry.path || ''),
    sha: String(entry.sha || ''),
    type: entry.type === 'dir' ? 'dir' : 'file',
    size: typeof entry.size === 'number' ? entry.size : undefined
  }));
}

export async function ghPutFile(
  repoPath: string,
  content: Buffer | string,
  commitMessage: string
): Promise<{ sha: string; commitSha?: string }> {
  const cfg = getGitHubConfig();
  if (!cfg) {
    throw new Error('GitHub CMS is not configured in environment variables.');
  }

  const clean = sanitizeRepoPath(repoPath);
  const encoded = encodeRepoPath(clean);
  const base64Content = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content, 'utf8').toString('base64');

  // Retry once automatically on 409 SHA conflict
  for (let attempt = 0; attempt < 2; attempt++) {
    const existing = await ghGetFile(clean);
    const bodyPayload: Record<string, string> = {
      message: commitMessage,
      content: base64Content,
      branch: cfg.branch
    };
    if (existing?.sha) {
      bodyPayload.sha = existing.sha;
    }

    const res = await githubFetch(
      cfg,
      `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encoded}`,
      {
        method: 'PUT',
        body: JSON.stringify(bodyPayload)
      }
    );

    if (res.status === 409 && attempt === 0) {
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`GitHub commit failed (${res.status}): ${errText.slice(0, 200)}`);
    }

    const result = (await res.json()) as { content?: { sha?: string }; commit?: { sha?: string } };
    return {
      sha: result.content?.sha || '',
      commitSha: result.commit?.sha
    };
  }

  throw new Error('GitHub commit conflicted repeatedly. Please retry.');
}

export async function ghDeleteFile(repoPath: string, commitMessage: string): Promise<boolean> {
  const cfg = getGitHubConfig();
  if (!cfg) {
    throw new Error('GitHub CMS is not configured.');
  }

  const clean = sanitizeRepoPath(repoPath);
  const existing = await ghGetFile(clean);
  if (!existing) return false;

  const encoded = encodeRepoPath(clean);
  const res = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encoded}`,
    {
      method: 'DELETE',
      body: JSON.stringify({
        message: commitMessage,
        sha: existing.sha,
        branch: cfg.branch
      })
    }
  );

  if (res.status === 404) return false;
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`GitHub delete failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  return true;
}

// =========================================================================
// GitHub Issues API for Private Contact Enquiries
// =========================================================================

const STATUS_LABEL_PREFIX = 'status:';
const ENQUIRY_MARKER_START = '<!-- SPES_ENQUIRY_JSON';
const ENQUIRY_MARKER_END = 'SPES_ENQUIRY_JSON -->';

function statusToLabel(status: EnquiryStatus): string {
  return `${STATUS_LABEL_PREFIX}${status.toLowerCase()}`;
}

function formatEnquiryIssueBody(enquiry: ContactEnquiry): string {
  const payload = {
    id: enquiry.id,
    fullName: enquiry.fullName,
    companyName: enquiry.companyName,
    email: enquiry.email,
    phone: enquiry.phone,
    subject: enquiry.subject,
    serviceRequired: enquiry.serviceRequired,
    projectType: enquiry.projectType,
    projectLocation: enquiry.projectLocation,
    estimatedBudget: enquiry.estimatedBudget,
    preferredContactMethod: enquiry.preferredContactMethod,
    message: enquiry.message,
    status: enquiry.status,
    internalNotes: enquiry.internalNotes,
    createdAt: enquiry.createdAt,
    updatedAt: enquiry.updatedAt
  };

  return [
    `### Website Project Enquiry`,
    ``,
    `- **Name:** ${enquiry.fullName}`,
    `- **Company:** ${enquiry.companyName || 'Individual / Not specified'}`,
    `- **Email:** ${enquiry.email}`,
    `- **Phone:** ${enquiry.phone}`,
    `- **Service Required:** ${enquiry.serviceRequired}`,
    `- **Project Type:** ${enquiry.projectType}`,
    `- **Location:** ${enquiry.projectLocation}`,
    `- **Estimated Budget:** ${enquiry.estimatedBudget || 'To be discussed'}`,
    `- **Preferred Contact:** ${enquiry.preferredContactMethod}`,
    `- **Status:** ${enquiry.status}`,
    `- **Submitted:** ${enquiry.createdAt}`,
    ``,
    `#### Message`,
    enquiry.message,
    ``,
    enquiry.internalNotes ? `#### Internal Notes\n${enquiry.internalNotes}\n` : '',
    `${ENQUIRY_MARKER_START}`,
    JSON.stringify(payload),
    `${ENQUIRY_MARKER_END}`
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

function parseIssueToEnquiry(issue: any): ContactEnquiry | null {
  const labels: string[] = Array.isArray(issue?.labels)
    ? issue.labels.map((l: any) => (typeof l === 'string' ? l : String(l?.name || '')))
    : [];

  if (labels.includes('status:deleted')) {
    return null;
  }

  const body = String(issue?.body || '');
  const startIdx = body.indexOf(ENQUIRY_MARKER_START);
  const endIdx = body.indexOf(ENQUIRY_MARKER_END);

  let parsed: Partial<ContactEnquiry> = {};
  if (startIdx !== -1 && endIdx > startIdx) {
    const rawJson = body.slice(startIdx + ENQUIRY_MARKER_START.length, endIdx).trim();
    try {
      parsed = JSON.parse(rawJson) as Partial<ContactEnquiry>;
    } catch {
      parsed = {};
    }
  }

  let status: EnquiryStatus = parsed.status || 'New';
  if (labels.includes('status:archived') || issue.state === 'closed') status = 'Archived';
  else if (labels.includes('status:responded')) status = 'Responded';
  else if (labels.includes('status:reviewed')) status = 'Reviewed';
  else if (labels.includes('status:new')) status = 'New';

  return {
    id: String(parsed.id || `issue-${issue.number}`),
    issueNumber: Number(issue.number),
    issueUrl: String(issue.html_url || ''),
    fullName: String(parsed.fullName || issue.title || 'Unknown'),
    companyName: String(parsed.companyName || ''),
    email: String(parsed.email || ''),
    phone: String(parsed.phone || ''),
    subject: String(parsed.subject || issue.title || 'Project Enquiry'),
    serviceRequired: String(parsed.serviceRequired || 'General'),
    projectType: String(parsed.projectType || 'General'),
    projectLocation: String(parsed.projectLocation || ''),
    estimatedBudget: String(parsed.estimatedBudget || 'To be discussed'),
    preferredContactMethod: String(parsed.preferredContactMethod || 'Email'),
    message: String(parsed.message || ''),
    status,
    internalNotes: String(parsed.internalNotes || ''),
    createdAt: String(parsed.createdAt || issue.created_at || new Date().toISOString()),
    updatedAt: String(issue.updated_at || parsed.updatedAt || new Date().toISOString())
  };
}

export async function ghCreateEnquiryIssue(enquiry: ContactEnquiry): Promise<ContactEnquiry> {
  const cfg = getGitHubConfig();
  if (!cfg) {
    throw new Error('GitHub Issues storage is not configured.');
  }

  const issueTitle = `[Enquiry] ${enquiry.subject || enquiry.serviceRequired} — ${enquiry.fullName}`.slice(0, 220);
  const res = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/issues`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: issueTitle,
        body: formatEnquiryIssueBody(enquiry),
        labels: ['spes-enquiry', statusToLabel(enquiry.status)]
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to record enquiry in GitHub Issues (${res.status}): ${errText.slice(0, 200)}`);
  }

  const created = await res.json();
  return parseIssueToEnquiry(created) || { ...enquiry, issueNumber: created.number, issueUrl: created.html_url };
}

export async function ghListEnquiryIssues(): Promise<ContactEnquiry[]> {
  const cfg = getGitHubConfig();
  if (!cfg) return [];

  const res = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/issues?labels=spes-enquiry&state=all&per_page=100&sort=created&direction=desc`
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to fetch enquiries from GitHub Issues (${res.status}): ${errText.slice(0, 200)}`);
  }

  const issues = (await res.json()) as any[];
  if (!Array.isArray(issues)) return [];
  return issues
    .filter((item) => !item.pull_request)
    .map(parseIssueToEnquiry)
    .filter((e): e is ContactEnquiry => e !== null);
}

export async function ghUpdateEnquiryIssue(
  issueNumber: number,
  updates: { status?: EnquiryStatus; internalNotes?: string }
): Promise<ContactEnquiry> {
  const cfg = getGitHubConfig();
  if (!cfg) {
    throw new Error('GitHub Issues storage is not configured.');
  }

  const getRes = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/issues/${issueNumber}`
  );
  if (!getRes.ok) {
    throw new Error(`Enquiry issue #${issueNumber} not found (${getRes.status}).`);
  }
  const existingIssue = await getRes.json();
  const parsed = parseIssueToEnquiry(existingIssue);
  if (!parsed) {
    throw new Error(`Enquiry issue #${issueNumber} is no longer active.`);
  }

  const nextStatus = updates.status ?? parsed.status;
  const nextNotes = updates.internalNotes !== undefined ? updates.internalNotes : parsed.internalNotes;
  const updatedEnquiry: ContactEnquiry = {
    ...parsed,
    status: nextStatus,
    internalNotes: nextNotes,
    updatedAt: new Date().toISOString()
  };

  const nextState = nextStatus === 'Archived' ? 'closed' : 'open';
  const patchRes = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        state: nextState,
        labels: ['spes-enquiry', statusToLabel(nextStatus)],
        body: formatEnquiryIssueBody(updatedEnquiry)
      })
    }
  );

  if (!patchRes.ok) {
    const errText = await patchRes.text().catch(() => '');
    throw new Error(`Failed to update enquiry #${issueNumber} (${patchRes.status}): ${errText.slice(0, 200)}`);
  }

  const saved = await patchRes.json();
  return parseIssueToEnquiry(saved) || updatedEnquiry;
}

export async function ghDeleteEnquiryIssue(issueNumber: number): Promise<void> {
  const cfg = getGitHubConfig();
  if (!cfg) {
    throw new Error('GitHub Issues storage is not configured.');
  }

  // First try permanent GraphQL deleteIssue (works when token has admin permissions)
  const getRes = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/issues/${issueNumber}`
  );
  if (getRes.ok) {
    const issueData = (await getRes.json()) as { node_id?: string };
    if (issueData.node_id) {
      const gqlRes = await githubFetch(cfg, '/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: `mutation($id: ID!) { deleteIssue(input: { issueId: $id }) { clientMutationId } }`,
          variables: { id: issueData.node_id }
        })
      });
      if (gqlRes.ok) {
        const gqlBody = (await gqlRes.json()) as { errors?: unknown[] };
        if (!gqlBody.errors || gqlBody.errors.length === 0) {
          return;
        }
      }
    }
  }

  // Fallback when repository permissions restrict permanent deletion: close, scrub PII, and mark status:deleted
  const patchRes = await githubFetch(
    cfg,
    `/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        title: `[Deleted Enquiry #${issueNumber}]`,
        state: 'closed',
        labels: ['spes-enquiry', 'status:deleted'],
        body: 'This enquiry was removed by the administrator.'
      })
    }
  );

  if (!patchRes.ok) {
    throw new Error(`Failed to remove enquiry #${issueNumber} (${patchRes.status}).`);
  }
}
