const SEVERITY_COLORS = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  informational: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function Findings() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Findings</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Log Finding
        </button>
      </div>
      <div className="flex gap-3 mb-6">
        {Object.entries(SEVERITY_COLORS).map(([sev, cls]) => (
          <span key={sev} className={`text-xs px-3 py-1 rounded-full border capitalize ${cls}`}>
            {sev}
          </span>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500 text-sm">No findings logged yet.</p>
      </div>
    </div>
  );
}
