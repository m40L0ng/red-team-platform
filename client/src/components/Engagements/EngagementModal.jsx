import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../../utils/api';

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'archived'];

const ROLE_STYLE = {
  operator: 'text-blue-400',
  lead:     'text-purple-400',
  manager:  'text-red-400',
};

const EMPTY = {
  name: '', client: '', scope: '', status: 'planning', startDate: '', endDate: '',
};

function initials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function EngagementModal({ engagement, onClose, onSave }) {
  const [form, setForm]           = useState(EMPTY);
  const [selectedIds, setSelected] = useState([]);
  const [members, setMembers]     = useState([]);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  // Load team members
  useEffect(() => {
    api.get('/team').then((r) => setMembers(r.data.members));
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (engagement) {
      setForm({
        name:      engagement.name,
        client:    engagement.client,
        scope:     engagement.scope,
        status:    engagement.status,
        startDate: engagement.startDate?.slice(0, 10),
        endDate:   engagement.endDate?.slice(0, 10),
      });
      setSelected(engagement.operators?.map((o) => o.id) ?? []);
    }
  }, [engagement]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleOperator(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave({ ...form, operatorIds: selectedIds });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save engagement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0">
          <h2 className="font-semibold text-gray-100">
            {engagement ? 'Edit Engagement' : 'New Engagement'}
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

          {/* Operator selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Operators
              {selectedIds.length > 0 && (
                <span className="ml-2 text-xs text-red-400">{selectedIds.length} selected</span>
              )}
            </label>
            {members.length === 0 ? (
              <p className="text-xs text-gray-600 py-2">No team members available.</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {members.map((m) => {
                  const checked = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleOperator(m.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                        checked
                          ? 'border-red-500/40 bg-red-500/5'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked ? 'bg-red-500 border-red-500' : 'border-gray-600'
                      }`}>
                        {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>

                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-200 shrink-0">
                        {initials(m.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white">{m.name}</span>
                        <span className={`ml-2 text-xs capitalize ${ROLE_STYLE[m.role]}`}>{m.role}</span>
                      </div>

                      {/* Current workload */}
                      <span className="text-xs text-gray-500 shrink-0">
                        {m.engagements.length} eng{m.engagements.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
