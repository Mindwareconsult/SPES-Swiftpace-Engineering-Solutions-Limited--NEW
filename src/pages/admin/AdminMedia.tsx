import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, EyeOff, ImagePlus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import { prepareAndUploadImage } from '../../utils/imageUpload';
import type { CmsBootstrapPayload, GalleryItem, ProjectItem } from '../../types';

const GALLERY_CATEGORIES = [
  'Civil Engineering',
  'Architecture',
  'Building Construction',
  'Interior Architecture',
  'Company'
];

export const AdminMedia: React.FC = () => {
  const { adminFetch } = useAuth();
  const { refreshCms } = useCms();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [filterCat, setFilterCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('Unable to load gallery items.');
      const data = (await res.json()) as CmsBootstrapPayload;
      setItems(data.gallery || []);
      setProjects(data.projects || []);
      setDirty(false);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Load failed.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleSaveAll = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const ordered = items.map((item, i) => ({ ...item, order: i + 1 }));
      const res = await adminFetch('/api/admin/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ordered })
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; persistedTo?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to save gallery changes.');
      setItems(ordered);
      setDirty(false);
      setFeedback({
        type: 'ok',
        text: `Gallery saved (${data.persistedTo === 'github' ? 'committed to GitHub' : 'saved locally'}).`
      });
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadNew = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setFeedback(null);
    try {
      const added: GalleryItem[] = [];
      for (const file of Array.from(files)) {
        const up = await prepareAndUploadImage(file, 'gallery', adminFetch);
        added.push({
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          filename: up.filename,
          url: up.url,
          caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          category: filterCat !== 'All' ? filterCat : 'Civil Engineering',
          projectSlug: '',
          order: 1,
          published: true,
          uploadedAt: new Date().toISOString()
        });
      }
      setItems((prev) => [...added, ...prev].map((it, idx) => ({ ...it, order: idx + 1 })));
      setDirty(true);
      setFeedback({
        type: 'ok',
        text: `Uploaded ${added.length} photo(s). Click "Save Gallery Changes" to publish them.`
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleReplacePhoto = async (itemId: string, file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const up = await prepareAndUploadImage(file, 'gallery', adminFetch);
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, url: up.url, filename: up.filename } : it))
      );
      setDirty(true);
      setFeedback({ type: 'ok', text: 'Photo replaced. Click "Save Gallery Changes" to apply.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Replace failed.' });
    } finally {
      setUploading(false);
    }
  };

  const moveItem = (itemId: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === itemId);
    const nextIdx = idx + dir;
    if (idx === -1 || nextIdx < 0 || nextIdx >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    setItems(copy.map((it, i) => ({ ...it, order: i + 1 })));
    setDirty(true);
  };

  const displayed =
    filterCat === 'All' ? items : items.filter((item) => item.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">Gallery &amp; Photo Library</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload, replace, caption, categorize, reorder, hide, or delete gallery photographs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-[#12BCEB]/40 bg-[#12BCEB]/10 hover:bg-[#12BCEB]/20 text-[#12BCEB] px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer">
            <ImagePlus className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => {
                handleUploadNew(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>

          <button
            type="button"
            disabled={saving || !dirty}
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] disabled:opacity-45 text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : dirty ? 'Save Gallery Changes' : 'All Changes Saved'}
          </button>
        </div>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['All', ...GALLERY_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCat(cat)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
              filterCat === cat
                ? 'bg-[#12BCEB] text-[#06142B]'
                : 'border border-white/15 bg-[#0B1E3D] text-slate-300 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading gallery items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-[#0B1E3D] overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#06142B] relative overflow-hidden">
                <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItems((prev) =>
                        prev.map((it) => (it.id === item.id ? { ...it, caption: val } : it))
                      );
                      setDirty(true);
                    }}
                    placeholder="Photo caption"
                    className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3 py-2 text-xs text-white"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={item.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, category: val } : it))
                        );
                        setDirty(true);
                      }}
                      className="rounded-lg border border-white/15 bg-[#06142B] px-2.5 py-2 text-xs text-white"
                    >
                      {GALLERY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <select
                      value={item.projectSlug || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems((prev) =>
                          prev.map((it) => (it.id === item.id ? { ...it, projectSlug: val } : it))
                        );
                        setDirty(true);
                      }}
                      className="rounded-lg border border-white/15 bg-[#06142B] px-2.5 py-2 text-xs text-white"
                    >
                      <option value="">No Linked Project</option>
                      {projects.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.title.slice(0, 32)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, -1)}
                      className="p-1.5 rounded border border-white/15 text-slate-300 hover:text-white"
                      title="Move earlier"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, 1)}
                      className="p-1.5 rounded border border-white/15 text-slate-300 hover:text-white"
                      title="Move later"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <label className="px-2.5 py-1.5 rounded border border-white/15 text-[11px] text-slate-200 hover:border-[#12BCEB] cursor-pointer">
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          handleReplacePhoto(item.id, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === item.id ? { ...it, published: !it.published } : it
                          )
                        );
                        setDirty(true);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium ${
                        item.published
                          ? 'bg-[#078A43]/20 text-emerald-300'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {item.published ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                      {item.published ? 'Visible' : 'Hidden'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setItems((prev) => prev.filter((it) => it.id !== item.id));
                        setDirty(true);
                      }}
                      className="p-1.5 rounded border border-red-500/30 text-red-300 hover:bg-red-500/15"
                      title="Remove from gallery"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
