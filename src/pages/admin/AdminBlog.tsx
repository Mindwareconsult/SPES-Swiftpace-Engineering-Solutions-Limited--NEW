import React, { useCallback, useEffect, useState } from 'react';
import { Check, Eye, EyeOff, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import { prepareAndUploadImage } from '../../utils/imageUpload';
import { SafeMarkdown } from '../../components/common/SafeMarkdown';
import type { BlogCategoryItem, BlogPostItem, CmsBootstrapPayload } from '../../types';

const EMPTY_POST: BlogPostItem = {
  id: '',
  title: '',
  slug: '',
  category: 'Structural Engineering',
  excerpt: '',
  content: '',
  featuredImage: '',
  author: 'SPES Technical Editorial Desk',
  published: true,
  publishedAt: new Date().toISOString().slice(0, 10),
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

export const AdminBlog: React.FC = () => {
  const { adminFetch } = useAuth();
  const { refreshCms } = useCms();

  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPostItem | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadBlog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('Failed to load blog posts.');
      const data = (await res.json()) as CmsBootstrapPayload;
      setPosts(data.blogPosts || []);
      setCategories(data.blogCategories || []);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Load failed.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  const startNew = () => {
    setOriginalSlug(null);
    setEditing({
      ...EMPTY_POST,
      category: categories[0]?.name || 'Structural Engineering',
      publishedAt: new Date().toISOString().slice(0, 10)
    });
    setShowPreview(false);
    setFeedback(null);
  };

  const startEdit = (post: BlogPostItem) => {
    setOriginalSlug(post.slug);
    setEditing({
      ...post,
      publishedAt: post.publishedAt ? post.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
    });
    setShowPreview(false);
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFeedback(null);
    try {
      const computedSlug = slugify(editing.slug || editing.title);
      if (!computedSlug) throw new Error('Please enter a valid article title.');

      const payload: BlogPostItem = {
        ...editing,
        id: computedSlug,
        slug: computedSlug
      };

      const url = originalSlug ? `/api/admin/blog/${originalSlug}` : '/api/admin/blog';
      const method = originalSlug ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; persistedTo?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to save article.');

      setFeedback({
        type: 'ok',
        text: `Article saved (${data.persistedTo === 'github' ? 'committed to GitHub' : 'saved locally'}).`
      });
      setEditing(null);
      setOriginalSlug(null);
      await loadBlog();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFeatured = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploading(true);
    try {
      const up = await prepareAndUploadImage(file, 'blog', adminFetch);
      setEditing({ ...editing, featuredImage: up.url });
      setFeedback({ type: 'ok', text: 'Featured image uploaded.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadInline = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploading(true);
    try {
      const up = await prepareAndUploadImage(file, 'blog', adminFetch);
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      setEditing({
        ...editing,
        content: `${editing.content.trimEnd()}\n\n![${alt}](${up.url})\n`
      });
      setFeedback({ type: 'ok', text: 'Inline image uploaded and inserted into article.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async () => {
    const cleanName = newCatName.trim();
    if (!cleanName) return;
    const next = [
      ...categories,
      { name: cleanName, slug: slugify(cleanName), description: `${cleanName} technical articles` }
    ];
    try {
      const res = await adminFetch('/api/admin/blog-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: next })
      });
      if (!res.ok) throw new Error('Unable to save category.');
      setCategories(next);
      setNewCatName('');
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Category update failed.' });
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      const res = await adminFetch(`/api/admin/blog/${slug}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      setConfirmDeleteSlug(null);
      setFeedback({ type: 'ok', text: 'Article deleted.' });
      await loadBlog();
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Delete failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">Blog Articles Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Publish technical articles, upload featured or inline images, manage categories, and control SEO metadata.
          </p>
        </div>

        {!editing && (
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setShowCatModal(true)}
              className="rounded-lg border border-white/20 hover:border-white/40 px-4 py-2.5 text-xs font-semibold text-slate-200"
            >
              Categories ({categories.length})
            </button>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" /> New Article
            </button>
          </div>
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
              {originalSlug ? `Editing: ${editing.title}` : 'Write New Article'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-2 text-xs font-semibold text-slate-200"
              >
                <Eye className="w-4 h-4" /> {showPreview ? 'Back to Editor' : 'Live Preview'}
              </button>
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
          </div>

          {showPreview ? (
            <div className="p-6 rounded-xl border border-white/10 bg-[#06142B] space-y-6">
              <div className="text-xs text-[#12BCEB]">
                {editing.category} · {editing.publishedAt} · {editing.author}
              </div>
              <h3 className="font-editorial text-4xl font-semibold text-white">{editing.title}</h3>
              {editing.featuredImage && (
                <img
                  src={editing.featuredImage}
                  alt={editing.title}
                  className="w-full max-h-80 object-cover rounded-lg border border-white/10"
                />
              )}
              <SafeMarkdown content={editing.content} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Article Title *
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
                    Category
                  </label>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Publish Date
                    </label>
                    <input
                      type="date"
                      value={editing.publishedAt}
                      onChange={(e) => setEditing({ ...editing, publishedAt: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white font-mono-tech"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Author
                    </label>
                    <input
                      type="text"
                      value={editing.author}
                      onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Featured Image Upload */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border border-white/10 bg-[#06142B]">
                <div className="md:col-span-4 aspect-[16/10] rounded-lg overflow-hidden bg-[#040E20] border border-white/10">
                  {editing.featuredImage ? (
                    <img
                      src={editing.featuredImage}
                      alt="Featured preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                      No featured image
                    </div>
                  )}
                </div>
                <div className="md:col-span-8 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Featured Article Image
                  </div>
                  <input
                    type="text"
                    value={editing.featuredImage}
                    onChange={(e) => setEditing({ ...editing, featuredImage: e.target.value })}
                    placeholder="/uploads/blog/..."
                    className="w-full rounded-lg border border-white/15 bg-[#0B1E3D] px-3 py-2 text-xs font-mono-tech text-slate-200"
                  />
                  <label className="inline-flex items-center gap-2 rounded-lg border border-[#12BCEB]/40 bg-[#12BCEB]/10 text-[#12BCEB] px-4 py-2 text-xs font-semibold cursor-pointer">
                    <ImagePlus className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Featured Image'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(e) => {
                        handleUploadFeatured(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Article Excerpt
                </label>
                <textarea
                  rows={2}
                  value={editing.excerpt}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Article Body (Markdown)
                  </label>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-200 hover:border-[#12BCEB] cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5 text-[#12BCEB]" />
                    Insert Image into Body
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(e) => {
                        handleUploadInline(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={14}
                  required
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-[#06142B] px-4 py-3 text-sm font-mono-tech text-slate-200 leading-relaxed"
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
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                className="rounded accent-[#12BCEB]"
              />
              Published (uncheck to save as Draft)
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] disabled:opacity-60 text-[#06142B] px-6 py-3 text-xs font-bold uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </form>
      ) : loading ? (
        <div className="text-sm text-slate-400">Loading articles...</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="p-4 rounded-xl border border-white/10 bg-[#0B1E3D] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#06142B] border border-white/10 shrink-0">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{post.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {post.category} · {post.publishedAt?.slice(0, 10)} · {post.author}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    post.published
                      ? 'bg-[#078A43]/20 text-emerald-300'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {post.published ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {post.published ? 'Published' : 'Draft'}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#12BCEB]/15 border border-[#12BCEB]/30 text-xs font-semibold text-[#12BCEB]"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSlug(post.slug)}
                  className="p-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/15"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories Modal */}
      {showCatModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowCatModal(false)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-white/15 bg-[#0B1E3D] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Blog Categories</h3>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded-lg border border-white/15 bg-[#06142B] px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="rounded-lg bg-[#12BCEB] text-[#06142B] px-4 py-2 text-xs font-bold uppercase"
              >
                Add
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-white/10">
              {categories.map((cat) => (
                <div key={cat.slug} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-slate-200">{cat.name}</span>
                  <span className="font-mono-tech text-xs text-slate-500">{cat.slug}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {confirmDeleteSlug && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteSlug(null)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-white/15 bg-[#0B1E3D] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Delete Article?</h3>
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
