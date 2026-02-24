import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Crosshair, Bug, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import MemberModal from '../components/Team/MemberModal';

const ROLE_STYLE = {
  operator: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  lead:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  manager:  'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_STYLE = {
  planning: 'text-blue-400',
  active:   'text-green-400',
};

function initials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function CapacityBar({ count }) {
  const max = 3;
  const pct = Math.min((count / max) * 100, 100);
  const color = count === 0 ? 'bg-gray-700' : count >= max ? 'bg-red-500' : count === 2 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">
        {count === 0 ? 'Free' : count >= max ? 'Full' : `${count}/${max}`}
      </span>
    </div>
  );
}

export default function TeamCapacity() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/team');
      setMembers(res.data.members);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    if (modal === 'create') {
      const res = await api.post('/team', form);
      setMembers((prev) => [...prev, { ...res.data.member, _count: { findings: 0 }, engagements: [] }]);
    } else {
      const res = await api.patch(`/team/${modal.id}`, form);
      setMembers((prev) => prev.map((m) => m.id === modal.id ? { ...m, ...res.data.member } : m));
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/team/${deleteId}`);
      setMembers((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const totalActive   = members.reduce((n, m) => n + m.engagements.filter((e) => e.status === 'active').length, 0);
  const totalFindings = members.reduce((n, m) => n + m._count.findings, 0);
  const freeMembers   = members.filter((m) => m.engagements.length === 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Team Capacity</h1>
        {isManager && (
          <button onClick={() => setModal('create')}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Invite Member
          </button>
        )}
      </div>

      {/* Summary row */}
      {!loading && members.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Members', value: members.length, icon: ShieldCheck, color: 'text-blue-400' },
            { label: 'Active Engagements', value: totalActive, icon: Crosshair, color: 'text-red-400' },
            { label: 'Findings Logged', value: totalFindings, icon: Bug, color: 'text-orange-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
              <div className={`${color}`}><Icon size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-sm">No team members yet.{isManager && ' Invite your first operator.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => {
            const activeEngs = m.engagements.filter((e) => e.status === 'active');
            const isSelf = m.id === user?.id;
            return (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-200 shrink-0">
                    {initials(m.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{m.name}</span>
                      {isSelf && <span className="text-xs text-gray-500">(you)</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${ROLE_STYLE[m.role]}`}>
                        {m.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">{m.email}</div>

                    {/* Capacity bar */}
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">
                        Workload — {m.engagements.length} engagement{m.engagements.length !== 1 ? 's' : ''}
                      </div>
                      <CapacityBar count={m.engagements.length} />
                    </div>

                    {/* Active engagements */}
                    {activeEngs.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activeEngs.map((e) => (
                          <span key={e.id} className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-gray-300">
                            <span className={`mr-1 ${STATUS_STYLE[e.status] || 'text-gray-500'}`}>●</span>
                            {e.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats + actions */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="text-xs text-gray-500">{m._count.findings} finding{m._count.findings !== 1 ? 's' : ''}</div>
                    {isManager && (
                      <div className="flex gap-2">
                        <button onClick={() => setModal(m)}
                          className="text-gray-400 hover:text-white transition-colors p-1" title="Edit">
                          <Pencil size={15} />
                        </button>
                        {!isSelf && (
                          <button onClick={() => setDeleteId(m.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1" title="Remove">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <MemberModal
          member={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-2">Remove member?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Their findings will remain but they will be removed from all engagements.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
