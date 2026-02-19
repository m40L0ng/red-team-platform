import { Shield, Crosshair, Bug, Users } from 'lucide-react';

const stats = [
  { label: 'Active Engagements', value: '0', icon: Crosshair, color: 'text-red-400' },
  { label: 'Open Findings', value: '0', icon: Bug, color: 'text-orange-400' },
  { label: 'Team Members', value: '0', icon: Users, color: 'text-blue-400' },
  { label: 'Completed This Month', value: '0', icon: Shield, color: 'text-green-400' },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className={`mb-3 ${color}`}>
              <Icon size={22} />
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4 text-gray-300">Recent Activity</h2>
        <p className="text-gray-500 text-sm">No activity yet. Create your first engagement to get started.</p>
      </div>
    </div>
  );
}
