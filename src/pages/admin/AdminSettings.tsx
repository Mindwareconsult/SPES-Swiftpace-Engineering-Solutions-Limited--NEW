import React, { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import { prepareAndUploadImage } from '../../utils/imageUpload';
import type { CmsBootstrapPayload, WebsiteSettings } from '../../types';

export const AdminSettings: React.FC = () => {
  const { adminFetch } = useAuth();
  const { refreshCms } = useCms();

  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('Unable to load website settings.');
      const data = (await res.json()) as CmsBootstrapPayload;
      setSettings(data.settings);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Load failed.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUploadBranding = async (
    field: 'logoUrl' | 'faviconUrl' | 'heroImage',
    file: File | undefined
  ) => {
    if (!file || !settings) return;
    setUploadingField(field);
    try {
      const up = await prepareAndUploadImage(file, 'branding', adminFetch);
      setSettings({ ...settings, [field]: up.url });
      setFeedback({ type: 'ok', text: 'Image uploaded. Click "Save Website Settings" to apply.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Upload failed.' });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; persistedTo?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to update settings.');
      setFeedback({
        type: 'ok',
        text: `Website settings saved (${data.persistedTo === 'github' ? 'committed to GitHub' : 'saved locally'}).`
      });
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="text-sm text-slate-400">Loading website settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">Website Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Control contact lines, Ado Ekiti address, homepage hero text/photo, logo, favicon, social links, and SEO defaults.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Website Settings'}
        </button>
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

      {/* Company & Contact Details */}
      <div className="rounded-xl border border-white/10 bg-[#0B1E3D] p-6 space-y-4">
        <h2 className="text-base font-semibold text-white border-b border-white/10 pb-3">
          Contact &amp; Location Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Company Display Name
            </label>
            <input
              type="text"
              required
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Official Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Primary Phone
            </label>
            <input
              type="text"
              value={settings.phonePrimary}
              onChange={(e) => setSettings({ ...settings, phonePrimary: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-mono-tech text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Secondary Phone
            </label>
            <input
              type="text"
              value={settings.phoneSecondary}
              onChange={(e) => setSettings({ ...settings, phoneSecondary: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-mono-tech text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              WhatsApp Number (digits only)
            </label>
            <input
              type="text"
              value={settings.whatsappPrimary}
              onChange={(e) => setSettings({ ...settings, whatsappPrimary: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-mono-tech text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              RC Number
            </label>
            <input
              type="text"
              value={settings.rcNumber}
              onChange={(e) => setSettings({ ...settings, rcNumber: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-mono-tech text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Street Address</label>
            <input
              type="text"
              value={settings.addressLine1}
              onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">City</label>
            <input
              type="text"
              value={settings.addressCity}
              onChange={(e) => setSettings({ ...settings, addressCity: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">State</label>
            <input
              type="text"
              value={settings.addressState}
              onChange={(e) => setSettings({ ...settings, addressState: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* Homepage Hero & Branding */}
      <div className="rounded-xl border border-white/10 bg-[#0B1E3D] p-6 space-y-4">
        <h2 className="text-base font-semibold text-white border-b border-white/10 pb-3">
          Homepage Hero, Logo &amp; Favicon
        </h2>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Hero Headline</label>
          <input
            type="text"
            value={settings.heroHeadline}
            onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Hero Subtitle</label>
          <textarea
            rows={2}
            value={settings.heroSubtitle}
            onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg border border-white/10 bg-[#06142B] space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">Corporate Logo</div>
            <img
              src={settings.logoUrl || '/assets/spes_logo.jpeg'}
              alt="Logo"
              className="w-16 h-16 object-cover rounded border border-white/15"
            />
            <label className="inline-flex items-center gap-1.5 rounded border border-[#12BCEB]/40 px-3 py-1.5 text-xs text-[#12BCEB] cursor-pointer">
              <ImagePlus className="w-3.5 h-3.5" />
              {uploadingField === 'logoUrl' ? 'Uploading...' : 'Replace Logo'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadBranding('logoUrl', e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-[#06142B] space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">Browser Favicon</div>
            <img
              src={settings.faviconUrl || '/logo.peg'}
              alt="Favicon"
              className="w-16 h-16 object-cover rounded border border-white/15"
            />
            <label className="inline-flex items-center gap-1.5 rounded border border-[#12BCEB]/40 px-3 py-1.5 text-xs text-[#12BCEB] cursor-pointer">
              <ImagePlus className="w-3.5 h-3.5" />
              {uploadingField === 'faviconUrl' ? 'Uploading...' : 'Replace Favicon'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadBranding('faviconUrl', e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-[#06142B] space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">Hero Background Photo</div>
            <img
              src={settings.heroImage}
              alt="Hero"
              className="w-full h-16 object-cover rounded border border-white/15"
            />
            <label className="inline-flex items-center gap-1.5 rounded border border-[#12BCEB]/40 px-3 py-1.5 text-xs text-[#12BCEB] cursor-pointer">
              <ImagePlus className="w-3.5 h-3.5" />
              {uploadingField === 'heroImage' ? 'Uploading...' : 'Replace Hero Image'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadBranding('heroImage', e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Footer, Contact Notice, Social Links & SEO Defaults */}
      <div className="rounded-xl border border-white/10 bg-[#0B1E3D] p-6 space-y-4">
        <h2 className="text-base font-semibold text-white border-b border-white/10 pb-3">
          Footer, Social Links &amp; SEO Defaults
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Footer Tagline</label>
            <textarea
              rows={2}
              value={settings.footerTagline}
              onChange={(e) => setSettings({ ...settings, footerTagline: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Contact Page Notice</label>
            <textarea
              rows={2}
              value={settings.contactNotice}
              onChange={(e) => setSettings({ ...settings, contactNotice: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['linkedin', 'facebook', 'instagram', 'x'] as const).map((net) => (
            <div key={net} className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-slate-400">{net} URL</label>
              <input
                type="url"
                value={settings.socialLinks?.[net] || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, [net]: e.target.value }
                  })
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3 py-2 text-xs text-white"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Default SEO Title</label>
            <input
              type="text"
              value={settings.seoDefaults?.siteTitle || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  seoDefaults: { ...settings.seoDefaults, siteTitle: e.target.value }
                })
              }
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Default Meta Description
            </label>
            <input
              type="text"
              value={settings.seoDefaults?.metaDescription || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  seoDefaults: { ...settings.seoDefaults, metaDescription: e.target.value }
                })
              }
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2 text-sm text-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
