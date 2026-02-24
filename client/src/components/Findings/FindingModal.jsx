import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational'];
const STATUSES   = ['open', 'in_remediation', 'remediated', 'accepted'];

const EMPTY = {
  engagementId: '', title: '', severity: 'high',
  cvss: '', description: '', evidence: '', status: 'open',
};

export default function FindingModal({ finding, engagements, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (finding) {
      setForm({
        engagementId: finding.engagementId,
        title:        finding.title,
        severity:     finding.severity,
        cvss:         finding.cvss ?? '',
        description:  finding.description,
        evidence:     finding.evidence ?? '',
        status:       finding.status,
      });
    }
  }, [finding]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave({ ...form, cvss: form.cvss !== '' ? Number(form.cvss) : null });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save finding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0">
          <h2 className="font-semibold text-gray-100">
            {finding ? 'Edit Finding' : 'Log Finding'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Engagement</label>
            <select
              name="engagementId" value={form.engagementId} onChange={handleChange} required
              disabled={!!finding}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
            >
              <option value="">Select engagement...</option>
              {engagements.map((e) => (
                <option key={e.id} value={e.id}>{e.name} — {e.client}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              name="title" value={form.title} onChange={handleChange} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              placeholder="SQL Injection in /api/users"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Severity</label>
              <select
                name="severity" value={form.severity} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">CVSS score</label>
              <input
                name="cvss" type="number" min="0" max="10" step="0.1"
                value={form.cvss} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                placeholder="9.8"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                name="status" value={form.status} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange} required rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none"
              placeholder="Describe the vulnerability, impact and attack vector..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Evidence <span className="text-gray-600">(optional)</span></label>
            <textarea
              name="evidence" value={form.evidence} onChange={handleChange} rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none"
              placeholder="PoC, screenshots, request/response, CVE references..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : finding ? 'Save changes' : 'Log finding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
