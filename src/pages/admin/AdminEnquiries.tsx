import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Mail, Phone, Save, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ContactEnquiry, EnquiryStatus } from '../../types';

const STATUS_OPTIONS: EnquiryStatus[] = ['New', 'Reviewed', 'Responded', 'Archived'];

export const AdminEnquiries: React.FC = () => {
  const { adminFetch } = useAuth();

  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [storage, setStorage] = useState<'github-issues' | 'local-preview'>('local-preview');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ContactEnquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<EnquiryStatus>('New');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/enquiries');
      if (!res.ok) throw new Error('Unable to load enquiries.');
      const data = (await res.json()) as {
        enquiries: ContactEnquiry[];
        storage: 'github-issues' | 'local-preview';
      };
      setEnquiries(data.enquiries || []);
      setStorage(data.storage);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to load enquiries.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const openDetail = (item: ContactEnquiry) => {
    setSelected(item);
    setStatusDraft(item.status);
    setNotesDraft(item.internalNotes || '');
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      const refId = selected.issueNumber ? String(selected.issueNumber) : selected.id;
      const res = await adminFetch(`/api/admin/enquiries/${refId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft, internalNotes: notesDraft })
      });
      const data = (await res.json().catch(() => ({}))) as { enquiry?: ContactEnquiry; error?: string };
      if (!res.ok || !data.enquiry) throw new Error(data.error || 'Update failed.');

      setSelected(data.enquiry);
      setEnquiries((prev) =>
        prev.map((e) => (e.id === data.enquiry!.id ? data.enquiry! : e))
      );
      setFeedback({ type: 'ok', text: 'Enquiry status & notes updated.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ContactEnquiry) => {
    try {
      const refId = item.issueNumber ? String(item.issueNumber) : item.id;
      const res = await adminFetch(`/api/admin/enquiries/${refId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      setConfirmDeleteId(null);
      if (selected?.id === item.id) setSelected(null);
      setEnquiries((prev) => prev.filter((e) => e.id !== item.id));
      setFeedback({ type: 'ok', text: 'Enquiry removed.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Unable to delete enquiry.' });
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await adminFetch('/api/admin/enquiries/export.csv');
      if (!res.ok) throw new Error('CSV export failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spes-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Unable to export CSV.' });
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries.filter((item) => {
      const statusOk = statusFilter === 'All' || item.status === statusFilter;
      const qOk =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.serviceRequired.toLowerCase().includes(q) ||
        item.projectLocation.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q);
      return statusOk && qOk;
    });
  }, [enquiries, statusFilter, query]);

  const targetToDelete = enquiries.find((e) => e.id === confirmDeleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">
            Private Enquiries Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Storage:{' '}
            <span className="text-slate-200">
              {storage === 'github-issues' ? 'GitHub Issues API (Private)' : 'Local Preview File'}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 hover:border-[#12BCEB] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
        >
          <Download className="w-4 h-4 text-[#12BCEB]" /> Export CSV
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {['All', ...STATUS_OPTIONS].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
                statusFilter === st
                  ? 'bg-[#12BCEB] text-[#06142B]'
                  : 'border border-white/15 bg-[#0B1E3D] text-slate-300 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search enquiries..."
            className="w-full rounded-lg border border-white/15 bg-[#0B1E3D] pl-10 pr-4 py-2 text-sm text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading enquiries...</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-xl border border-white/10 bg-[#0B1E3D] text-center text-sm text-slate-400">
          No enquiries found matching the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-2.5">
            {filtered.map((item) => {
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openDetail(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    active
                      ? 'border-[#12BCEB] bg-[#10274D]'
                      : 'border-white/10 bg-[#0B1E3D] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {item.fullName}
                    </span>
                    <span className="font-mono-tech text-[11px] text-[#12BCEB] shrink-0">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {item.serviceRequired} · {item.projectLocation}
                  </div>
                  <div className="font-mono-tech text-[11px] text-slate-500 mt-1.5">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-6">
            {selected ? (
              <div className="p-6 rounded-xl border border-white/15 bg-[#0B1E3D] space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="font-mono-tech text-xs text-[#12BCEB]">
                      {selected.issueNumber ? `Issue #${selected.issueNumber}` : selected.id.slice(0, 8)}
                    </div>
                    <h2 className="text-xl font-semibold text-white mt-0.5">
                      {selected.fullName}
                    </h2>
                    {selected.companyName && (
                      <div className="text-xs text-slate-400">{selected.companyName}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || selected.serviceRequired}`)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#12BCEB]/15 text-[#12BCEB] border border-[#12BCEB]/30 font-semibold"
                  >
                    <Mail className="w-3.5 h-3.5" /> {selected.email}
                  </a>
                  <a
                    href={`tel:${selected.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-slate-200 border border-white/15 font-mono-tech"
                  >
                    <Phone className="w-3.5 h-3.5" /> {selected.phone}
                  </a>
                  {selected.issueUrl && (
                    <a
                      href={selected.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-slate-300 border border-white/15"
                    >
                      GitHub Issue <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs border-y border-white/10 py-4">
                  <div>
                    <dt className="text-slate-500">Service Required</dt>
                    <dd className="text-slate-200 mt-0.5">{selected.serviceRequired}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Project Type</dt>
                    <dd className="text-slate-200 mt-0.5">{selected.projectType}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Location</dt>
                    <dd className="text-slate-200 mt-0.5">{selected.projectLocation}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Budget / Contact Pref</dt>
                    <dd className="text-slate-200 mt-0.5">
                      {selected.estimatedBudget} · {selected.preferredContactMethod}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Client Message
                  </div>
                  <div className="p-4 rounded-lg bg-[#06142B] border border-white/10 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Status
                    </label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value as EnquiryStatus)}
                      className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3 py-2 text-sm text-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Internal Engineering Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Add internal review notes, follow-up dates, or proposal status..."
                      className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selected.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-red-500/35 text-xs font-semibold text-red-300 hover:bg-red-500/15"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleUpdate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] text-[#06142B] text-xs font-bold uppercase tracking-wider"
                    >
                      <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Notes & Status'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 rounded-xl border border-white/10 bg-[#0B1E3D] text-center text-sm text-slate-400">
                Select an enquiry on the left to inspect details, update status, or log notes.
              </div>
            )}
          </div>
        </div>
      )}

      {targetToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-white/15 bg-[#0B1E3D] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Remove Enquiry?</h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to remove the enquiry from{' '}
              <strong className="text-white">{targetToDelete.fullName}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-white/20 text-xs font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(targetToDelete)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white"
              >
                Remove Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
