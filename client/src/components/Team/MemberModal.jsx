import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ROLES = ['operator', 'lead', 'manager'];

const EMPTY = { name: '', email: '', password: '', role: 'operator' };

export default function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!member;

  useEffect(() => {
    if (member) setForm({ name: member.name, email: member.email, password: '', role: member.role });
  }, [member]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isEdit && form.password.length < 8) return setError('Password must be at least 8 characters');
    if (isEdit && form.password && form.password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    const payload = { name: form.name, email: form.email, role: form.role };
    if (form.password) payload.password = form.password;
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="font-semibold text-gray-100">{isEdit ? 'Edit Member' : 'Invite Member'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full name</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              placeholder="jane@company.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Password {isEdit && <span className="text-gray-600">(leave blank to keep current)</span>}
            </label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              required={!isEdit}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              placeholder={isEdit ? '••••••••' : 'Min. 8 characters'} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Invite member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
