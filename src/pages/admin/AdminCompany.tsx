import React, { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import type { CmsBootstrapPayload, CompanyInfo } from '../../types';

export const AdminCompany: React.FC = () => {
  const { adminFetch } = useAuth();
  const { refreshCms } = useCms();

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadCompany = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('Unable to load company profile.');
      const data = (await res.json()) as CmsBootstrapPayload;
      setCompany(data.company);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Load failed.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await adminFetch('/api/admin/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company)
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; persistedTo?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to update company profile.');
      setFeedback({
        type: 'ok',
        text: `Company profile saved (${data.persistedTo === 'github' ? 'committed to GitHub' : 'saved locally'}).`
      });
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !company) {
    return <div className="text-sm text-slate-400">Loading company profile...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">Company Profile Editor</h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain official corporate overview, vision, mission, verification policy, and sister enterprise note.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Company Profile'}
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

      <div className="rounded-xl border border-white/10 bg-[#0B1E3D] p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Legal Name</label>
            <input
              type="text"
              required
              value={company.legalName}
              onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Short Brand Name</label>
            <input
              type="text"
              value={company.shortName}
              onChange={(e) => setCompany({ ...company, shortName: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">CAC RC Number</label>
            <input
              type="text"
              value={company.rcNumber}
              onChange={(e) => setCompany({ ...company, rcNumber: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-mono-tech text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Corporate Headquarters</label>
          <input
            type="text"
            value={company.headquarters}
            onChange={(e) => setCompany({ ...company, headquarters: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Primary Corporate Overview</label>
          <textarea
            rows={3}
            value={company.overview}
            onChange={(e) => setCompany({ ...company, overview: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Extended Overview</label>
          <textarea
            rows={3}
            value={company.extendedOverview}
            onChange={(e) => setCompany({ ...company, extendedOverview: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Vision Statement</label>
            <textarea
              rows={3}
              value={company.vision}
              onChange={(e) => setCompany({ ...company, vision: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Mission Statement</label>
            <textarea
              rows={3}
              value={company.mission}
              onChange={(e) => setCompany({ ...company, mission: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Verification Policy Notice</label>
          <textarea
            rows={2}
            value={company.verificationPolicy}
            onChange={(e) => setCompany({ ...company, verificationPolicy: e.target.value })}
            className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="pt-4 border-t border-white/10 space-y-3">
          <h2 className="text-sm font-semibold text-white">Sister Enterprise Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={company.sisterEnterprise?.name || ''}
              onChange={(e) =>
                setCompany({
                  ...company,
                  sisterEnterprise: { ...company.sisterEnterprise, name: e.target.value }
                })
              }
              placeholder="Enterprise Name"
              className="rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
            <input
              type="url"
              value={company.sisterEnterprise?.url || ''}
              onChange={(e) =>
                setCompany({
                  ...company,
                  sisterEnterprise: { ...company.sisterEnterprise, url: e.target.value }
                })
              }
              placeholder="https://..."
              className="rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <textarea
            rows={2}
            value={company.sisterEnterprise?.description || ''}
            onChange={(e) =>
              setCompany({
                ...company,
                sisterEnterprise: { ...company.sisterEnterprise, description: e.target.value }
              })
            }
            className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
      </div>
    </form>
  );
};
