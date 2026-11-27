import React, { useCallback, useRef, useState } from 'react';
import { Download, FileText, FolderOpen, Loader, Package, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import {
  DEFAULT_DETECTOR_TOGGLES,
  createPseudonymSession,
  sanitizeText,
  type RedactionMode,
} from '../engine/redactor';

interface BatchFile {
  id: string;
  name: string;
  size: number;
  rawContent: string;
  piiCount: number;
  sanitizedContent: string;
  status: 'ready' | 'processing' | 'done';
}

interface BatchProcessorProps {
  mode: RedactionMode;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ mode }) => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = (name: string, content: string): BatchFile => {
    const session = createPseudonymSession();
    const result = sanitizeText(content, mode, DEFAULT_DETECTOR_TOGGLES, session);
    return {
      id: `${name}-${Date.now()}-${Math.random()}`,
      name,
      size: new TextEncoder().encode(content).byteLength,
      rawContent: content,
      piiCount: result.totalRedacted,
      sanitizedContent: result.sanitizedText,
      status: 'done',
    };
  };

  const ingestFileList = useCallback((fileList: FileList | File[]) => {
    const supported: File[] = [];
    for (const f of Array.from(fileList)) {
      if (f.name.endsWith('.txt') || f.name.endsWith('.csv')) {
        supported.push(f);
      }
    }
    if (supported.length === 0) return;

    supported.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = typeof e.target?.result === 'string' ? e.target.result : '';
        const processed = processFile(file.name, content);
        setFiles((prev) => [...prev, processed]);
      };
      reader.readAsText(file);
    });
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    ingestFileList(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) ingestFileList(e.target.files);
    e.target.value = '';
  };

  const downloadSingle = (file: BatchFile) => {
    const blob = new Blob([file.sanitizedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    if (files.length === 0) return;
    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder('velvet_vault_sanitized');
    for (const f of files) {
      folder?.file(`sanitized_${f.name}`, f.sanitizedContent);
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velvet_vault_batch_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsZipping(false);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const clearAll = () => setFiles([]);

  return (
    <div className="flex flex-col gap-5">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-14 transition-all ${
          isDragging
            ? 'border-[#D4AF37] bg-[rgba(74,14,23,0.3)] shadow-[0_0_30px_rgba(212,175,55,0.15)]'
            : 'border-[rgba(212,175,55,0.2)] bg-[#111114] hover:border-[rgba(212,175,55,0.4)] hover:bg-[rgba(17,17,20,0.8)]'
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.5)]">
          <FolderOpen className="h-7 w-7 text-[#D4AF37]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#F3E5AB]">
            {isDragging ? 'Drop files to ingest into volatile RAM' : 'Drag & Drop multiple .TXT or .CSV files'}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            All processing is 100% local — no uploads, no network calls
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Controls Bar */}
      {files.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-stone-400">
            {files.length} file{files.length !== 1 ? 's' : ''} loaded ·{' '}
            {files.reduce((s, f) => s + f.piiCount, 0)} total PII entities
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearAll}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-700 bg-[#09090B] px-3 py-1.5 text-xs text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </button>
            <button
              type="button"
              onClick={downloadAll}
              disabled={isZipping}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(212,175,55,0.4)] bg-[#721422] px-3 py-1.5 text-xs font-semibold text-[#F3E5AB] transition hover:bg-[#9B1B30] disabled:opacity-50"
            >
              {isZipping ? (
                <Loader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Package className="h-3.5 w-3.5 text-[#D4AF37]" />
              )}
              {isZipping ? 'Packing ZIP…' : 'Download All as .ZIP'}
            </button>
          </div>
        </div>
      )}

      {/* File Table */}
      {files.length > 0 && (
        <div className="vault-glass overflow-hidden rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-[rgba(212,175,55,0.2)] bg-[#111114] font-mono text-[11px] text-[#D4AF37] uppercase">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3 text-right">Size</th>
                <th className="px-4 py-3 text-right">PII Found</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(212,175,55,0.08)]">
              {files.map((f) => (
                <tr key={f.id} className="transition hover:bg-[rgba(74,14,23,0.2)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-[#D4AF37]/60" />
                      <span className="font-mono text-stone-200">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-stone-400">
                    {formatBytes(f.size)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-bold ${
                        f.piiCount > 0 ? 'text-[#D4AF37]' : 'text-stone-500'
                      }`}
                    >
                      {f.piiCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full border border-emerald-800 bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                      ✓ Sanitized
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => downloadSingle(f)}
                        className="cursor-pointer rounded-md border border-[rgba(212,175,55,0.3)] bg-[#111114] px-2.5 py-1 font-mono text-[10px] text-[#F3E5AB] transition hover:border-[#D4AF37] hover:bg-[rgba(74,14,23,0.5)]"
                      >
                        <Download className="inline h-3 w-3 mr-1" />
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="cursor-pointer rounded-md border border-stone-800 p-1 text-stone-600 transition hover:border-stone-600 hover:text-stone-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {files.length === 0 && (
        <div className="text-center py-6 font-mono text-xs text-stone-600">
          No files loaded yet. Drag files above or click to browse.
        </div>
      )}
    </div>
  );
};
