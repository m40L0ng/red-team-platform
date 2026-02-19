export default function Engagements() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Engagements</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Engagement
        </button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500 text-sm">No engagements found. Create your first authorized engagement.</p>
      </div>
    </div>
  );
}
