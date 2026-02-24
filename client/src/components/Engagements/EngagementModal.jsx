import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'archived'];

const EMPTY = {
  name: '', client: '', scope: '', status: 'planning', startDate: '', endDate: '',
};

export default function EngagementModal({ engagement, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (engagement) {
      setForm({
        name: engagement.name,
        client: engagement.client,
        scope: engagement.scope,
        status: engagement.status,
        startDate: engagement.startDate?.slice(0, 10),
        endDate: engagement.endDate?.slice(0, 10),
      });
    }
  }, [engagement]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save engagement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="font-semibold text-gray-100">
            {engagement ? 'Edit Engagement' : 'New Engagement'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Engagement name</label>
              <input
                name="name" value={form.name} onChange={handleChange} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                placeholder="Internal Network Pentest Q1"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Client</label>
              <input
                name="client" value={form.client} onChange={handleChange} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                placeholder="Acme Corp"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Scope</label>
              <textarea
                name="scope" value={form.scope} onChange={handleChange} required rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none"
                placeholder="192.168.1.0/24, *.acme.corp, VPN infrastructure..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Start date</label>
              <input
                name="startDate" type="date" value={form.startDate} onChange={handleChange} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">End date</label>
              <input
                name="endDate" type="date" value={form.endDate} onChange={handleChange} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                name="status" value={form.status} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
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
              {loading ? 'Saving...' : engagement ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
