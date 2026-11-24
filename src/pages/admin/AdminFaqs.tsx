import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import type { CmsBootstrapPayload, FaqItem } from '../../types';

const FAQ_CATEGORIES = [
  'Company Information',
  'Services',
  'Projects & Consultation',
  'Working with SPES'
];

export const AdminFaqs: React.FC = () => {
  const { adminFetch } = useAuth();
  const { refreshCms } = useCms();

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/bootstrap');
      if (!res.ok) throw new Error('Unable to load FAQs.');
      const data = (await res.json()) as CmsBootstrapPayload;
      setFaqs(data.faqs || []);
      setDirty(false);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Load failed.' });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleAdd = () => {
    setFaqs((prev) => [
      {
        id: `faq-${Date.now()}`,
        category: FAQ_CATEGORIES[0],
        question: '',
        answer: '',
        order: 1,
        published: true
      },
      ...prev
    ]);
    setDirty(true);
  };

  const moveFaq = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= faqs.length) return;
    const copy = [...faqs];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    setFaqs(copy);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const clean = faqs
        .filter((f) => f.question.trim() && f.answer.trim())
        .map((f, i) => ({ ...f, order: i + 1 }));
      const res = await adminFetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: clean })
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; persistedTo?: string };
      if (!res.ok) throw new Error(data.error || 'Save failed.');
      setFaqs(clean);
      setDirty(false);
      setFeedback({
        type: 'ok',
        text: `FAQs saved (${data.persistedTo === 'github' ? 'committed to GitHub' : 'saved locally'}).`
      });
      await refreshCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-white">FAQs Manager</h1>
          <p className="text-sm text-slate-400 mt-1">
            Add, edit, reorder, publish/hide, or delete client FAQ entries.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 hover:border-white/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] disabled:opacity-45 text-[#06142B] px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : dirty ? 'Save All FAQs' : 'Saved'}
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

      {loading ? (
        <div className="text-sm text-slate-400">Loading FAQs...</div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={faq.id}
              className="p-5 rounded-xl border border-white/10 bg-[#0B1E3D] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <select
                  value={faq.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFaqs((prev) =>
                      prev.map((item) => (item.id === faq.id ? { ...item, category: val } : item))
                    );
                    setDirty(true);
                  }}
                  className="rounded-lg border border-white/15 bg-[#06142B] px-3 py-1.5 text-xs text-[#12BCEB] font-semibold"
                >
                  {FAQ_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveFaq(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded border border-white/15 text-slate-300 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFaq(idx, 1)}
                    disabled={idx === faqs.length - 1}
                    className="p-1.5 rounded border border-white/15 text-slate-300 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFaqs((prev) =>
                        prev.map((item) =>
                          item.id === faq.id ? { ...item, published: !item.published } : item
                        )
                      );
                      setDirty(true);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium ${
                      faq.published ? 'bg-[#078A43]/20 text-emerald-300' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {faq.published ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {faq.published ? 'Published' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFaqs((prev) => prev.filter((item) => item.id !== faq.id));
                      setDirty(true);
                    }}
                    className="p-1.5 rounded border border-red-500/30 text-red-300 hover:bg-red-500/15"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={faq.question}
                onChange={(e) => {
                  const val = e.target.value;
                  setFaqs((prev) =>
                    prev.map((item) => (item.id === faq.id ? { ...item, question: val } : item))
                  );
                  setDirty(true);
                }}
                placeholder="Question"
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm font-medium text-white"
              />

              <textarea
                rows={3}
                value={faq.answer}
                onChange={(e) => {
                  const val = e.target.value;
                  setFaqs((prev) =>
                    prev.map((item) => (item.id === faq.id ? { ...item, answer: val } : item))
                  );
                  setDirty(true);
                }}
                placeholder="Answer"
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-slate-300"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
