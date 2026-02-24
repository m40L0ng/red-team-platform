import { useState, useEffect } from 'react';
import { FileText, FileCode, Download, ChevronRight, Bug } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  planning:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active:    'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  archived:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const SEVERITY_COLOR = {
  critical:      'bg-red-500',
  high:          'bg-orange-500',
  medium:        'bg-yellow-500',
  low:           'bg-blue-500',
  informational: 'bg-gray-500',
};

function fmt(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SeverityDots({ counts }) {
  return (
    <div className="flex items-center gap-1.5">
      {Object.entries(counts).map(([sev, n]) =>
        n > 0 ? (
          <span key={sev} className={`text-xs px-1.5 py-0.5 rounded text-white font-medium ${SEVERITY_COLOR[sev]}`}>
            {n}
          </span>
        ) : null
      )}
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const canGenerate = user?.role === 'manager' || user?.role === 'lead';

  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [format, setFormat]           = useState('pdf');
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    api.get('/reports/engagements')
      .then((r) => setEngagements(r.data.engagements))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    if (!selected) return;
    setGenerating(true);
    setError('');
    try {
      const res = await api.post('/reports/generate', {
        engagementId: selected.id,
        format,
      }, { responseType: 'blob' });

      const ext      = format === 'pdf' ? 'pdf' : 'md';
      const mime     = format === 'pdf' ? 'application/pdf' : 'text/markdown';
      const slug     = selected.name.toLowerCase().replace(/\s+/g, '-');
      const filename = `report-${slug}.${ext}`;

      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate report. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  // Group findings count by severity from the selected engagement detail
  // (we only have _count.findings total here, severity breakdown needs detail)
  const sel = selected;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — engagement list */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Select Engagement
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : engagements.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">No engagements yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {engagements.map((eng) => {
                const isSelected = sel?.id === eng.id;
                return (
                  <button
                    key={eng.id}
                    onClick={() => setSelected(isSelected ? null : eng)}
                    className={`w-full text-left bg-gray-900 border rounded-xl p-4 transition-all ${
                      isSelected
                        ? 'border-red-500/50 ring-1 ring-red-500/20'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm">{eng.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[eng.status]}`}>
                            {eng.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{eng.client}</span>
                          <span>·</span>
                          <span>{fmt(eng.startDate)} – {fmt(eng.endDate)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Bug size={11} /> {eng._count.findings} finding{eng._count.findings !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`text-gray-600 transition-transform ${isSelected ? 'rotate-90 text-red-400' : ''}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — generate panel */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Generate Report
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5 sticky top-6">
            {sel ? (
              <div className="pb-4 border-b border-gray-800">
                <div className="text-sm font-medium text-white mb-1">{sel.name}</div>
                <div className="text-xs text-gray-500">{sel.client}</div>
                <div className="text-xs text-gray-500 mt-1">
                  <Bug size={11} className="inline mr-1" />
                  {sel._count.findings} finding{sel._count.findings !== 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 pb-4 border-b border-gray-800">
                Select an engagement on the left to continue.
              </p>
            )}

            {/* Format selector */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'pdf', label: 'PDF', icon: FileText, desc: 'Formatted report' },
                  { value: 'markdown', label: 'Markdown', icon: FileCode, desc: 'Raw .md file' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    onClick={() => setFormat(value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all ${
                      format === value
                        ? 'border-red-500/50 bg-red-500/5 text-red-400'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-gray-500">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={!sel || !canGenerate || generating}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generating ? 'Generating...' : `Download ${format.toUpperCase()}`}
            </button>

            {!canGenerate && (
              <p className="text-xs text-gray-600 text-center">
                Only leads and managers can generate reports.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
