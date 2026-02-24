import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import FindingModal from '../components/Findings/FindingModal';

const SEVERITY_STYLE = {
  critical:      'bg-red-500/10 text-red-400 border-red-500/20',
  high:          'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium:        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:           'bg-blue-500/10 text-blue-400 border-blue-500/20',
  informational: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const STATUS_STYLE = {
  open:            'bg-red-500/10 text-red-400 border-red-500/20',
  in_remediation:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  remediated:      'bg-green-500/10 text-green-400 border-green-500/20',
  accepted:        'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational'];
const STATUSES   = ['open', 'in_remediation', 'remediated', 'accepted'];

export default function Findings() {
  const { user } = useAuth();
  const canDelete = user?.role === 'lead' || user?.role === 'manager';

  const [findings, setFindings]       = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({ severity: '', status: '', engagementId: '' });
  const [modal, setModal]             = useState(null); // null | 'create' | finding object
  const [deleteId, setDeleteId]       = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.severity)    params.set('severity', filters.severity);
    if (filters.status)      params.set('status', filters.status);
    if (filters.engagementId) params.set('engagementId', filters.engagementId);

    const res = await api.get(`/findings?${params}`);
    setFindings(res.data.findings);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/engagements').then((r) => setEngagements(r.data.engagements));
  }, []);

  async function handleSave(form) {
    if (modal === 'create') {
      const res = await api.post('/findings', form);
      setFindings((prev) => [res.data.finding, ...prev]);
    } else {
      const res = await api.patch(`/findings/${modal.id}`, form);
      setFindings((prev) => prev.map((f) => f.id === modal.id ? res.data.finding : f));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/findings/${deleteId}`);
      setFindings((prev) => prev.filter((f) => f.id !== deleteId));
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  function setFilter(key, val) {
    setFilters((f) => ({ ...f, [key]: f[key] === val ? '' : val }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Findings</h1>
        <button
          onClick={() => setModal('create')}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Log Finding
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter('severity', s)}
              className={`text-xs px-3 py-1 rounded-full border capitalize transition-all ${
                filters.severity === s
                  ? SEVERITY_STYLE[s]
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 border-l border-gray-800 pl-4">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter('status', s)}
              className={`text-xs px-3 py-1 rounded-full border capitalize transition-all ${
                filters.status === s
                  ? STATUS_STYLE[s]
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : findings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm">
            {filters.severity || filters.status
              ? 'No findings match the selected filters.'
              : 'No findings logged yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3">Severity</th>
                <th className="text-left px-6 py-3">Title</th>
                <th className="text-left px-6 py-3">Engagement</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">CVSS</th>
                <th className="text-left px-6 py-3">Reporter</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${SEVERITY_STYLE[f.severity]}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white max-w-xs truncate">{f.title}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    <div>{f.engagement.name}</div>
                    <div className="text-xs text-gray-600">{f.engagement.client}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${STATUS_STYLE[f.status]}`}>
                      {f.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {f.cvss != null ? (
                      <span className={f.cvss >= 9 ? 'text-red-400 font-medium' : f.cvss >= 7 ? 'text-orange-400' : ''}>
                        {f.cvss.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{f.reportedBy.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setModal(f)}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(f.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FindingModal
          finding={modal === 'create' ? null : modal}
          engagements={engagements}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-2">Delete finding?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
