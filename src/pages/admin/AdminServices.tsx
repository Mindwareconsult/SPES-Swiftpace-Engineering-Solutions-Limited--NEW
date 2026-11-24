import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, EyeOff, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import { prepareAndUploadImage } from '../../utils/imageUpload';
import { AVAILABLE_SERVICE_ICONS, ServiceIcon } from '../../utils/serviceIcons';
import type { CmsBootstrapPayload, ServiceItem } from '../../types';

const EMPTY_SERVICE: ServiceItem = {
  id: '',
  title: '',
  slug: '',
  iconName: 'Compass',
  shortDescription: '',
  heroImage: '',
  relatedCategory: '',
  galleryImages: [],
  detailedOverview: '',
  capabilities: [],
  clientBenefits: [],
  processStages: [],
  faqs: [],
  order: 1,
  published: true,
  seoTitle: '',
  metaDescription: '',
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

export const AdminServices: React.FC = () => {
  const { adminFetch } = useAuth();
  const { refreshCms } = useCms();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('Unable to load services.');
      const data = (await res.json()) as CmsBootstrapPayload;
      setServices(data.services || []);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Load failed.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFeedback(null);
    try {
      const slug = slugify(editing.slug || editing.title);
      if (!slug) throw new Error('Please enter a valid service title.');
      const payload: ServiceItem = { ...editing, id: slug, slug };
      const url = originalSlug ? `/api/admin/services/${originalSlug}` : '/api/admin/services';
      const method = originalSlug ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; persistedTo?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to save service.');

      setFeedback({
        type: 'ok',
        text: `Service saved (${data.persistedTo === 'github' ? 'committed to GitHub' : 'saved locally'}).`
      });
      setEditing(null);
      setOriginalSlug(null);
      await loadServices();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= services.length) return;
    const copy = [...services];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    setServices(copy);
    try {
      const res = await adminFetch('/api/admin/services/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedSlugs: copy.map((s) => s.slug) })
      });
      if (!res.ok) throw new Error('Reorder failed.');
      await loadServices();
      await refreshCms();
    } catch {
      await loadServices();
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      const res = await adminFetch(`/api/admin/services/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      setConfirmDeleteSlug(null);
      setFeedback({ type: 'ok', text: 'Service deleted.' });
      await loadServices();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Delete failed.' });
    }
  };

  const handleUploadHero = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploading(true);
    try {
      const up = await prepareAndUploadImage(file, 'services', adminFetch);
      setEditing({ ...editing, heroImage: up.url });
      setFeedback({ type: 'ok', text: 'Service image uploaded.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">Services &amp; Disciplines</h1>
          <p className="text-sm text-slate-400 mt-1">
            Add, edit, reorder, publish/hide engineering disciplines, capabilities, and process stages.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setOriginalSlug(null);
              setEditing({ ...EMPTY_SERVICE, order: services.length + 1 });
              setFeedback(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Add Service
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
              {originalSlug ? `Editing: ${editing.title}` : 'New Service Discipline'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setOriginalSlug(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs text-slate-300"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Service Title *
              </label>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditing({
                    ...editing,
                    title: val,
                    slug: originalSlug ? editing.slug : slugify(val)
                  });
                }}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                URL Slug
              </label>
              <input
                type="text"
                required
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-mono-tech text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Icon
              </label>
              <select
                value={editing.iconName}
                onChange={(e) => setEditing({ ...editing, iconName: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
              >
                {AVAILABLE_SERVICE_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Related Project Category
              </label>
              <input
                type="text"
                value={editing.relatedCategory}
                onChange={(e) => setEditing({ ...editing, relatedCategory: e.target.value })}
                placeholder="e.g. Architecture"
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Hero Image Upload */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border border-white/10 bg-[#06142B]">
            <div className="md:col-span-4 aspect-[16/10] rounded-lg overflow-hidden bg-[#040E20] border border-white/10">
              {editing.heroImage ? (
                <img src={editing.heroImage} alt={editing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  No hero image
                </div>
              )}
            </div>
            <div className="md:col-span-8 space-y-3">
              <input
                type="text"
                value={editing.heroImage}
                onChange={(e) => setEditing({ ...editing, heroImage: e.target.value })}
                placeholder="/uploads/services/..."
                className="w-full rounded-lg border border-white/15 bg-[#0B1E3D] px-3 py-2 text-xs font-mono-tech text-slate-200"
              />
              <label className="inline-flex items-center gap-2 rounded-lg border border-[#12BCEB]/40 bg-[#12BCEB]/10 text-[#12BCEB] px-4 py-2 text-xs font-semibold cursor-pointer">
                <ImagePlus className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Service Image'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    handleUploadHero(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Short Summary
            </label>
            <textarea
              rows={2}
              value={editing.shortDescription}
              onChange={(e) => setEditing({ ...editing, shortDescription: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Detailed Technical Overview
            </label>
            <textarea
              rows={4}
              value={editing.detailedOverview}
              onChange={(e) => setEditing({ ...editing, detailedOverview: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Core Capabilities (one per line)
            </label>
            <textarea
              rows={6}
              value={(editing.capabilities || []).join('\n')}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  capabilities: e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                })
              }
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                SEO Title
              </label>
              <input
                type="text"
                value={editing.seoTitle}
                onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Meta Description
              </label>
              <input
                type="text"
                value={editing.metaDescription}
                onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                className="rounded accent-[#12BCEB]"
              />
              Published on Website
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-6 py-3 text-xs font-bold uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      ) : loading ? (
        <div className="text-sm text-slate-400">Loading services...</div>
      ) : (
        <div className="space-y-3">
          {services.map((svc, idx) => (
            <div
              key={svc.slug}
              className="p-4 rounded-xl border border-white/10 bg-[#0B1E3D] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-[#12BCEB]/10 border border-[#12BCEB]/25 text-[#12BCEB] flex items-center justify-center shrink-0">
                  <ServiceIcon name={svc.iconName} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{svc.title}</div>
                  <div className="text-xs text-slate-400 truncate">{svc.shortDescription}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleReorder(idx, -1)}
                  disabled={idx === 0}
                  className="p-2 rounded-lg border border-white/15 text-slate-300 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(idx, 1)}
                  disabled={idx === services.length - 1}
                  className="p-2 rounded-lg border border-white/15 text-slate-300 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    svc.published ? 'bg-[#078A43]/20 text-emerald-300' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {svc.published ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {svc.published ? 'Published' : 'Hidden'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOriginalSlug(svc.slug);
                    setEditing(JSON.parse(JSON.stringify(svc)) as ServiceItem);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#12BCEB]/15 border border-[#12BCEB]/30 text-xs font-semibold text-[#12BCEB]"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSlug(svc.slug)}
                  className="p-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/15"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDeleteSlug && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteSlug(null)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-white/15 bg-[#0B1E3D] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Delete Service?</h3>
            <p className="text-sm text-slate-300">
              Permanently remove <code className="font-mono-tech text-[#12BCEB]">{confirmDeleteSlug}</code>?
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
