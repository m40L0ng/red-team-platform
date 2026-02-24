import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, ChevronRight, Bug, Search, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import EngagementModal from '../components/Engagements/EngagementModal';
import Pagination from '../components/Pagination';

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'archived'];

const STATUS_STYLE = {
  planning:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active:    'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  archived:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const LIMIT = 15;

export default function Engagements() {
  const { user } = useAuth();
  const canWrite = user?.role === 'manager' || user?.role === 'lead';
  const canDelete = user?.role === 'manager';

  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null);
  const [deleteId, setDeleteId]       = useState(null);
  const [deleting, setDeleting]       = useState(false);

  // Filters + pagination
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/engagements?${params}`);
      setEngagements(res.data.engagements);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    if (modal === 'create') {
      await api.post('/engagements', form);
    } else {
      await api.patch(`/engagements/${modal.id}`, form);
    }
    load();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/engagements/${deleteId}`);
      setDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setPage(1);
  }

  const hasFilters = search || statusFilter;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or client…"
            className="bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 w-56"
          />
        </div>

        {/* Status toggles */}
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter((prev) => prev === s ? '' : s)}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${
                statusFilter === s
                  ? STATUS_STYLE[s]
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : engagements.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm">
            {hasFilters
              ? 'No engagements match the current filters.'
              : `No engagements yet.${canWrite ? ' Create your first authorized engagement.' : ''}`}
          </p>
        </div>
      ) : (
        <>
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

          <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
        </>
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
