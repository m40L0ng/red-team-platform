import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, ChevronRight, Bug } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import EngagementModal from '../components/Engagements/EngagementModal';

const STATUS_STYLE = {
  planning:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active:    'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  archived:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Engagements() {
  const { user } = useAuth();
  const canWrite = user?.role === 'manager' || user?.role === 'lead';
  const canDelete = user?.role === 'manager';

  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | engagement object
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/engagements');
      setEngagements(res.data.engagements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    if (modal === 'create') {
      const res = await api.post('/engagements', form);
      setEngagements((prev) => [res.data.engagement, ...prev]);
    } else {
      const res = await api.patch(`/engagements/${modal.id}`, form);
      setEngagements((prev) => prev.map((e) => e.id === modal.id ? res.data.engagement : e));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/engagements/${deleteId}`);
      setEngagements((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Engagements</h1>
        {canWrite && (
          <button
            onClick={() => setModal('create')}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Engagement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : engagements.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm">No engagements yet.{canWrite && ' Create your first authorized engagement.'}</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3">Name / Client</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Dates</th>
                <th className="text-left px-6 py-3">Findings</th>
                <th className="text-left px-6 py-3">Operators</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {engagements.map((eng) => (
                <tr key={eng.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{eng.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{eng.client}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${STATUS_STYLE[eng.status]}`}>
                      {eng.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                    {fmt(eng.startDate)} <ChevronRight size={12} className="inline" /> {fmt(eng.endDate)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Bug size={13} />
                      {eng._count.findings}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {eng.operators.length > 0
                      ? eng.operators.map((o) => o.name).join(', ')
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {canWrite && (
                        <button
                          onClick={() => setModal(eng)}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(eng.id)}
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

      {/* Create / Edit modal */}
      {modal && (
        <EngagementModal
          engagement={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-2">Delete engagement?</h3>
            <p className="text-sm text-gray-400 mb-6">
              All findings linked to this engagement will also be deleted. This action cannot be undone.
            </p>
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
