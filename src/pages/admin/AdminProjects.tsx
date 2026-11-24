import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import { prepareAndUploadImage } from '../../utils/imageUpload';
import type { CmsBootstrapPayload, ProjectImageItem, ProjectItem } from '../../types';

const EMPTY_PROJECT: ProjectItem = {
  id: '',
  title: '',
  slug: '',
  category: 'Civil & Structural Engineering',
  location: '',
  client: '',
  projectStatus: 'Ongoing Construction',
  completionDate: '',
  shortDescription: '',
  overview: '',
  objectives: '',
  scopeOfWork: '',
  technicalApproach: '',
  projectOutcome: '',
  coverImage: '',
  featured: false,
  published: true,
  order: 1,
  seoTitle: '',
  metaDescription: '',
  images: [],
  updatedAt: ''
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const AdminProjects: React.FC = () => {
  const { adminFetch } = useAuth();
  const { refreshCms } = useCms();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('Failed to load projects.');
      const data = (await res.json()) as CmsBootstrapPayload;
      setProjects(data.projects || []);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Unable to load projects.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const startNew = () => {
    setOriginalSlug(null);
    setEditing({ ...EMPTY_PROJECT, order: projects.length + 1 });
    setFeedback(null);
  };

  const startEdit = (p: ProjectItem) => {
    setOriginalSlug(p.slug);
    setEditing(JSON.parse(JSON.stringify(p)) as ProjectItem);
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFeedback(null);

    try {
      const computedSlug = slugify(editing.slug || editing.title);
      if (!computedSlug) throw new Error('Please enter a valid project title.');

      const payload: ProjectItem = {
        ...editing,
        id: computedSlug,
        slug: computedSlug,
        coverImage: editing.coverImage || editing.images[0]?.url || ''
      };

      const url = originalSlug ? `/api/admin/projects/${originalSlug}` : '/api/admin/projects';
      const method = originalSlug ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; persistedTo?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to save project.');

      setFeedback({
        type: 'ok',
        text: `Project saved (${data.persistedTo === 'github' ? 'committed to GitHub' : 'saved locally'}).`
      });
      setEditing(null);
      setOriginalSlug(null);
      await loadProjects();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not save project.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (p: ProjectItem) => {
    try {
      const res = await adminFetch(`/api/admin/projects/${p.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, published: !p.published })
      });
      if (!res.ok) throw new Error('Unable to update visibility.');
      await loadProjects();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Update failed.' });
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const copy = [...projects];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setProjects(copy);

    try {
      const res = await adminFetch('/api/admin/projects/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedSlugs: copy.map((p) => p.slug) })
      });
      if (!res.ok) throw new Error('Reorder failed.');
      await loadProjects();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Reorder failed.' });
      await loadProjects();
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      const res = await adminFetch(`/api/admin/projects/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      setConfirmDeleteSlug(null);
      setFeedback({ type: 'ok', text: 'Project deleted.' });
      await loadProjects();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Could not delete project.' });
    }
  };

  const handleUploadProjectImages = async (files: FileList | null) => {
    if (!files || !editing) return;
    setUploading(true);
    setFeedback(null);
    try {
      const folderSlug = slugify(editing.slug || editing.title) || 'project';
      const added: ProjectImageItem[] = [];
      for (const file of Array.from(files)) {
        const uploaded = await prepareAndUploadImage(file, 'projects', adminFetch, folderSlug);
        added.push({
          id: `${folderSlug}-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: uploaded.url,
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          order: editing.images.length + added.length + 1
        });
      }
      const nextImages = [...editing.images, ...added];
      setEditing({
        ...editing,
        coverImage: editing.coverImage || nextImages[0]?.url || '',
        images: nextImages
      });
      setFeedback({ type: 'ok', text: `Uploaded ${added.length} photograph(s). Click Save Project to publish.` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Photo upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const movePhoto = (idx: number, dir: -1 | 1) => {
    if (!editing) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= editing.images.length) return;
    const arr = [...editing.images];
    const [item] = arr.splice(idx, 1);
    arr.splice(nextIdx, 0, item);
    setEditing({
      ...editing,
      images: arr.map((img, i) => ({ ...img, order: i + 1 }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">Projects Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Add, edit, reorder, preview, publish/unpublish projects and manage project photographs.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            feedback.type === 'ok'
              ? 'border-[#078A43]/50 bg-[#078A43]/15 text-emerald-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-white/10 bg-[#0B1E3D] p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-semibold text-white">
              {originalSlug ? `Editing: ${editing.title}` : 'Create New Project'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewProject(editing)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setOriginalSlug(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Title *</label>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setEditing({
                    ...editing,
                    title: nextTitle,
                    slug: originalSlug ? editing.slug : slugify(nextTitle)
                  });
                }}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">URL Slug</label>
              <input
                type="text"
                required
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-mono-tech text-slate-200 focus:outline-none focus:border-[#12BCEB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Category *</label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              >
                <option value="Civil & Structural Engineering">Civil &amp; Structural Engineering</option>
                <option value="Architecture">Architecture</option>
                <option value="Building Construction">Building Construction</option>
                <option value="Interior Architecture">Interior Architecture</option>
                <option value="Construction Management">Construction Management</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Location *</label>
              <input
                type="text"
                required
                value={editing.location}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Client</label>
              <input
                type="text"
                value={editing.client}
                onChange={(e) => setEditing({ ...editing, client: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Status</label>
                <input
                  type="text"
                  value={editing.projectStatus}
                  onChange={(e) => setEditing({ ...editing, projectStatus: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Date / Period</label>
                <input
                  type="text"
                  value={editing.completionDate}
                  onChange={(e) => setEditing({ ...editing, completionDate: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Short Card Summary
            </label>
            <textarea
              rows={2}
              value={editing.shortDescription}
              onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Overview</label>
              <textarea
                rows={4}
                value={editing.overview}
                onChange={(e) => setEditing({ ...editing, overview: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Objectives</label>
              <textarea
                rows={4}
                value={editing.objectives}
                onChange={(e) => setEditing({ ...editing, objectives: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Scope of Work</label>
              <textarea
                rows={3}
                value={editing.scopeOfWork}
                onChange={(e) => setEditing({ ...editing, scopeOfWork: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Technical Approach</label>
              <textarea
                rows={3}
                value={editing.technicalApproach}
                onChange={(e) => setEditing({ ...editing, technicalApproach: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Project Outcome</label>
            <textarea
              rows={2}
              value={editing.projectOutcome}
              onChange={(e) => setEditing({ ...editing, projectOutcome: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
            />
          </div>

          {/* Photo Management */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Project Photographs ({editing.images.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Upload photos directly, set the primary cover image, reorder, or edit captions.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 rounded-lg border border-[#12BCEB]/40 bg-[#12BCEB]/10 hover:bg-[#12BCEB]/20 text-[#12BCEB] px-4 py-2 text-xs font-semibold cursor-pointer">
                <ImagePlus className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Project Photos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={(e) => {
                    handleUploadProjectImages(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {editing.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {editing.images.map((img, idx) => {
                  const isCover = editing.coverImage === img.url;
                  return (
                    <div
                      key={img.id || idx}
                      className={`rounded-lg border p-3 bg-[#06142B] space-y-2.5 ${
                        isCover ? 'border-[#12BCEB]' : 'border-white/10'
                      }`}
                    >
                      <div className="aspect-[16/10] overflow-hidden rounded bg-[#040E20]">
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="text"
                        value={img.caption}
                        onChange={(e) => {
                          const next = [...editing.images];
                          next[idx] = { ...next[idx], caption: e.target.value };
                          setEditing({ ...editing, images: next });
                        }}
                        placeholder="Photo caption"
                        className="w-full rounded border border-white/15 bg-[#0B1E3D] px-2.5 py-1.5 text-xs text-white"
                      />
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditing({ ...editing, coverImage: img.url })}
                          className={`px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                            isCover
                              ? 'bg-[#12BCEB] text-[#06142B]'
                              : 'bg-white/5 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Star className="w-3 h-3" /> {isCover ? 'Cover' : 'Set Cover'}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePhoto(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded bg-white/5 text-slate-300 disabled:opacity-30"
                            title="Move earlier"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePhoto(idx, 1)}
                            disabled={idx === editing.images.length - 1}
                            className="p-1 rounded bg-white/5 text-slate-300 disabled:opacity-30"
                            title="Move later"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = editing.images.filter((_, i) => i !== idx);
                              setEditing({
                                ...editing,
                                images: next,
                                coverImage:
                                  editing.coverImage === img.url
                                    ? next[0]?.url || ''
                                    : editing.coverImage
                              });
                            }}
                            className="p-1 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEO & Visibility */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">SEO Title</label>
              <input
                type="text"
                value={editing.seoTitle}
                onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Meta Description</label>
              <input
                type="text"
                value={editing.metaDescription}
                onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                  className="rounded accent-[#12BCEB]"
                />
                Published on Website
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                  className="rounded accent-[#12BCEB]"
                />
                Featured on Homepage
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] disabled:opacity-60 text-[#06142B] px-6 py-3 text-xs font-bold uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      ) : loading ? (
        <div className="text-sm text-slate-400">Loading projects...</div>
      ) : (
        <div className="space-y-3">
          {projects.map((p, idx) => (
            <div
              key={p.slug}
              className="p-4 rounded-xl border border-white/10 bg-[#0B1E3D] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#06142B] border border-white/10 shrink-0">
                  {p.coverImage && (
                    <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">{p.title}</span>
                    {p.featured && (
                      <span className="text-[11px] font-mono-tech text-[#12BCEB]">Featured</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {p.category} · {p.location} · {p.images?.length || 0} photos
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReorder(idx, -1)}
                  disabled={idx === 0}
                  className="p-2 rounded-lg border border-white/15 text-slate-300 disabled:opacity-30 hover:text-white"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(idx, 1)}
                  disabled={idx === projects.length - 1}
                  className="p-2 rounded-lg border border-white/15 text-slate-300 disabled:opacity-30 hover:text-white"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePublished(p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium ${
                    p.published
                      ? 'border-[#078A43]/40 bg-[#078A43]/15 text-emerald-300'
                      : 'border-white/15 bg-white/5 text-slate-400'
                  }`}
                >
                  {p.published ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {p.published ? 'Published' : 'Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewProject(p)}
                  className="p-2 rounded-lg border border-white/15 text-slate-300 hover:text-white"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#12BCEB]/15 border border-[#12BCEB]/30 text-xs font-semibold text-[#12BCEB] hover:bg-[#12BCEB]/25"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSlug(p.slug)}
                  className="p-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/15"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewProject && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewProject(null)}
        >
          <div
            className="max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-xl border border-white/15 bg-[#06142B] p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono-tech text-xs text-[#12BCEB]">PROJECT PREVIEW</span>
              <button
                type="button"
                onClick={() => setPreviewProject(null)}
                className="p-1.5 rounded-lg bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewProject.coverImage && (
              <img
                src={previewProject.coverImage}
                alt={previewProject.title}
                className="w-full h-64 object-cover rounded-lg border border-white/10"
              />
            )}
            <div>
              <div className="text-xs text-[#12BCEB]">
                {previewProject.category} · {previewProject.projectStatus} · {previewProject.location}
              </div>
              <h3 className="font-editorial text-3xl font-semibold text-white mt-1">
                {previewProject.title}
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{previewProject.overview}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-lg bg-[#0B1E3D] border border-white/10">
                <div className="font-semibold text-[#12BCEB] mb-1">Scope of Work</div>
                {previewProject.scopeOfWork}
              </div>
              <div className="p-4 rounded-lg bg-[#0B1E3D] border border-white/10">
                <div className="font-semibold text-[#12BCEB] mb-1">Outcome</div>
                {previewProject.projectOutcome}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteSlug && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteSlug(null)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-white/15 bg-[#0B1E3D] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Delete Project?</h3>
            <p className="text-sm text-slate-300">
              This will permanently remove <code className="font-mono-tech text-[#12BCEB]">{confirmDeleteSlug}</code> from the CMS repository.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteSlug(null)}
                className="px-4 py-2 rounded-lg border border-white/20 text-xs font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteSlug)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
