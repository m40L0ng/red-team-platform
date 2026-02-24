import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Crosshair, Bug, Users, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../utils/api';

const SEVERITY_COLOR = {
  Critical:      '#ef4444',
  High:          '#f97316',
  Medium:        '#eab308',
  Low:           '#3b82f6',
  Informational: '#6b7280',
};

const STATUS_COLOR = {
  planning:  '#3b82f6',
  active:    '#22c55e',
  completed: '#6b7280',
  archived:  '#eab308',
};

const STATUS_STYLE = {
  planning:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active:    'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  archived:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const FINDING_STATUS_STYLE = {
  open:            'bg-red-500/10 text-red-400 border-red-500/20',
  in_remediation:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  remediated:      'bg-green-500/10 text-green-400 border-green-500/20',
  accepted:        'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const SEVERITY_BADGE = {
  critical:      'bg-red-500/10 text-red-400 border-red-500/20',
  high:          'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium:        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:           'bg-blue-500/10 text-blue-400 border-blue-500/20',
  informational: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className={`mb-3 ${color}`}><Icon size={22} /></div>
      <div className="text-3xl font-bold mb-1">
        {loading ? <span className="w-10 h-7 bg-gray-800 rounded animate-pulse inline-block" /> : value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Active Engagements', value: data?.stats.activeEngagements ?? 0, icon: Crosshair, color: 'text-red-400' },
    { label: 'Open Findings',      value: data?.stats.openFindings ?? 0,      icon: Bug,       color: 'text-orange-400' },
    { label: 'Team Members',       value: data?.stats.teamMembers ?? 0,       icon: Users,     color: 'text-blue-400' },
    { label: 'Completed This Month', value: data?.stats.completedThisMonth ?? 0, icon: Shield, color: 'text-green-400' },
  ];

  const pieData = data
    ? Object.entries(data.statusMap).map(([status, count]) => ({ name: status, value: count }))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Findings by severity — bar chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-gray-300 mb-6">Findings by Severity</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data?.findingsChart.every((d) => d.value === 0) ? (
            <p className="text-sm text-gray-500 py-10 text-center">No findings logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.findingsChart} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: '#f9fafb' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.findingsChart.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLOR[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Engagements by status — pie chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-gray-300 mb-6">Engagements by Status</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pieData.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No engagements yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLOR[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 13 }}
                />
                <Legend
                  formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 12, textTransform: 'capitalize' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent findings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-300">Recent Findings</h2>
            <Link to="/findings" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.recentFindings.length ? (
            <p className="text-sm text-gray-500">No findings logged yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentFindings.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${SEVERITY_BADGE[f.severity]}`}>
                    {f.severity}
                  </span>
                  <span className="text-sm text-white truncate flex-1">{f.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${FINDING_STATUS_STYLE[f.status]}`}>
                    {f.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent engagements */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-300">Recent Engagements</h2>
            <Link to="/engagements" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.recentEngagements.length ? (
            <p className="text-sm text-gray-500">No engagements yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentEngagements.map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_STYLE[e.status]}`}>
                    {e.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{e.name}</div>
                    <div className="text-xs text-gray-500">{e.client}</div>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{fmt(e.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
