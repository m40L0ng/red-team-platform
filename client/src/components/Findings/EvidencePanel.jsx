import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Download, Eye, Image, FileText, Archive, File, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimetype }) {
  if (mimetype.startsWith('image/'))    return <Image    size={13} className="text-blue-400  shrink-0" />;
  if (mimetype === 'application/pdf')   return <FileText size={13} className="text-red-400   shrink-0" />;
  if (mimetype.includes('zip') || mimetype.includes('7z'))
                                        return <Archive  size={13} className="text-yellow-400 shrink-0" />;
  return                                       <File     size={13} className="text-gray-400  shrink-0" />;
}

export default function EvidencePanel({ findingId }) {
  const { user } = useAuth();
  const canDelete = user?.role === 'lead' || user?.role === 'manager';

  const [files, setFiles]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]       = useState('');
  const inputRef                = useRef(null);

  useEffect(() => {
    api.get(`/evidence/finding/${findingId}`)
      .then((r) => setFiles(r.data.files))
      .catch(() => {});
  }, [findingId]);

  async function uploadFiles(fileList) {
    if (!fileList?.length) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append('files', f));
      const res = await api.post(`/evidence/finding/${findingId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles((prev) => [...prev, ...res.data.files]);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.delete(`/evidence/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError('Failed to delete file');
    }
  }

  async function handleView(file) {
    setError('');
    try {
      const res = await api.get(`/evidence/${file.id}`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([res.data], { type: file.mimetype }));
      const isViewable = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
      if (isViewable) {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setError('Failed to open file');
    }
  }

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Evidence Files
        {files.length > 0 && (
          <span className="ml-2 text-xs text-gray-600">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        )}
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-4 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all select-none ${
          dragOver
            ? 'border-red-500/60 bg-red-500/5 text-red-400'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/30 text-gray-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,.pdf,.txt,.zip,.7z"
          onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }}
        />
        {uploading
          ? <Loader2 size={14} className="animate-spin" />
          : <Upload size={14} />}
        <span className="text-xs">
          {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
        </span>
        <span className="text-xs text-gray-700">PNG, JPG, PDF, TXT, ZIP · max 10 MB</span>
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 group"
            >
              <FileIcon mimetype={f.mimetype} />
              <span className="flex-1 text-xs text-gray-300 truncate min-w-0" title={f.originalName}>
                {f.originalName}
              </span>
              <span className="text-xs text-gray-600 shrink-0">{fmtSize(f.size)}</span>

              {/* View / Download */}
              <button
                type="button"
                onClick={() => handleView(f)}
                title={f.mimetype.startsWith('image/') || f.mimetype === 'application/pdf' ? 'View' : 'Download'}
                className="text-gray-600 hover:text-white transition-colors shrink-0"
              >
                {f.mimetype.startsWith('image/') || f.mimetype === 'application/pdf'
                  ? <Eye size={13} />
                  : <Download size={13} />}
              </button>

              {/* Delete */}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(f.id)}
                  title="Delete"
                  className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
