import React, { useEffect, useState } from 'react';
import { X, Loader, FileText } from 'lucide-react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import { api } from '../services/api';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

interface DiffFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
}

export const DiffModal: React.FC<DiffModalProps> = ({ isOpen, onClose, eventId }) => {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<DiffFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventId) {
      loadDiff();
    }
  }, [isOpen, eventId]);

  const loadDiff = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.events.getDiff(eventId);
      setFiles(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load changes. GitHub API might be rate limited or token missing.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <style>{`
        .diff-line-delete { background-color: rgba(220, 38, 38, 0.2) !important; }
        .diff-code-delete { background-color: rgba(220, 38, 38, 0.15) !important; color: #fca5a5 !important; }
        .diff-gutter-delete { background-color: rgba(220, 38, 38, 0.2) !important; }
        .diff-line-insert { background-color: rgba(22, 163, 74, 0.2) !important; }
        .diff-code-insert { background-color: rgba(22, 163, 74, 0.15) !important; color: #86efac !important; }
        .diff-gutter-insert { background-color: rgba(22, 163, 74, 0.2) !important; }
        .diff-gutter-col { background-color: #0d1117 !important; border-right: 1px solid #30363d; color: #8b949e; }
        .diff-code { color: #e6edf3; }
      `}</style>
      <div className="bg-[#0d1117] w-full max-w-5xl h-[90vh] rounded-lg border border-[#30363d] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d] bg-[#161b22]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={20} />
            Changes View
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0 bg-[#0d1117]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Loader className="animate-spin mb-4" size={32} />
              <p>Loading diff from GitHub...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              <p>{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No changes found or file too large to display.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#30363d]">
              {files.map((file, index) => (
                <FileDiffView key={index} file={file} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FileDiffView: React.FC<{ file: DiffFile }> = ({ file }) => {
  // Construct a git-like diff string so react-diff-view can parse it
  // GitHub API 'patch' is usually just the hunks, so we prepend header
  const diffText = `diff --git a/${file.filename} b/${file.filename}
--- a/${file.filename}
+++ b/${file.filename}
${file.patch || ''}`;

  const [diff] = parseDiff(diffText);

  if (!file.patch) {
     return (
        <div className="p-4">
             <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(file.status)}`}>
                    {file.status}
                </span>
                <span className="font-mono text-white">{file.filename}</span>
             </div>
             <div className="text-gray-500 italic pl-4">Binary file or no changes shown (e.g. rename only)</div>
        </div>
     );
  }

  return (
    <div className="flex flex-col bg-[#0d1117]">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(file.status)}`}>
            {file.status}
          </span>
          <span className="font-mono text-white">{file.filename}</span>
        </div>
        <div className="text-xs text-gray-500">
            <span className="text-green-400">+{file.additions}</span> / <span className="text-red-400">-{file.deletions}</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Diff viewType="unified" diffType={diff.type} hunks={diff.hunks}>
            {(hunks: any[]) => hunks.map((hunk) => (
                // @ts-ignore - key is required by React but type definition might be missing it in HunkProps
                <Hunk key={hunk.content} hunk={hunk} />
            ))}
        </Diff>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'added': return 'border-green-800 bg-green-900/30 text-green-400';
        case 'removed': return 'border-red-800 bg-red-900/30 text-red-400';
        case 'modified': return 'border-blue-800 bg-blue-900/30 text-blue-400';
        case 'renamed': return 'border-yellow-800 bg-yellow-900/30 text-yellow-400';
        default: return 'border-gray-700 bg-gray-800 text-gray-300';
    }
};
