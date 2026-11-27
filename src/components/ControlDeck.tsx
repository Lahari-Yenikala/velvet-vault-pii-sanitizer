import React, { useRef, useState } from 'react';
import {
  Database,
  FileText,
  KeyRound,
  Layers,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { RedactionMode } from '../engine/redactor';
import type { DetectorToggles, PIIEntityType } from '../engine/validators';

interface ControlDeckProps {
  rawInput: string;
  onRawInputChange: (val: string) => void;
  mode: RedactionMode;
  onModeChange: (mode: RedactionMode) => void;
  toggles: DetectorToggles;
  onToggleDetector: (type: PIIEntityType) => void;
  onLoadSample: () => void;
  onFileLoaded: (content: string, fileName: string) => void;
  sourceFileName: string | null;
  onClearFileBadge: () => void;
  isPseudoDrawerOpen: boolean;
  onTogglePseudoDrawer: () => void;
  pseudoCount: number;
}

const DETECTOR_META: { type: PIIEntityType; label: string; hint: string }[] = [
  { type: 'EMAIL', label: 'Emails', hint: 'RFC-5322' },
  { type: 'PHONE', label: 'Phones', hint: '+91 / Intl' },
  { type: 'CARD', label: 'Credit Cards', hint: 'Luhn Mod-10' },
  { type: 'PAN', label: 'Indian PAN', hint: 'Entity Code' },
  { type: 'AADHAAR', label: 'Aadhaar', hint: 'Verhoeff' },
  { type: 'IP', label: 'IP Addresses', hint: 'IPv4 & IPv6' },
];

const MODE_OPTIONS: { value: RedactionMode; label: string; desc: string }[] = [
  { value: 'FULL', label: 'Full Mask', desc: '[REDACTED_*]' },
  { value: 'PARTIAL', label: 'Partial Mask', desc: 'Verification Context' },
  { value: 'PSEUDO', label: 'Consistent Pseudonymization', desc: 'Session Map' },
];

export const ControlDeck: React.FC<ControlDeckProps> = ({
  rawInput,
  onRawInputChange,
  mode,
  onModeChange,
  toggles,
  onToggleDetector,
  onLoadSample,
  onFileLoaded,
  sourceFileName,
  onClearFileBadge,
  isPseudoDrawerOpen,
  onTogglePseudoDrawer,
  pseudoCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const lineCount = rawInput ? rawInput.split(/\r\n|\r|\n/).length : 0;
  const charCount = rawInput.length;

  const readSelectedFile = (file: File) => {
    setUploadError(null);
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.txt') && !lowerName.endsWith('.csv')) {
      setUploadError('Only .txt and .csv files are supported for client-side ingestion.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = typeof event.target?.result === 'string' ? event.target.result : '';
      onFileLoaded(content, file.name);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file into volatile RAM.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readSelectedFile(file);
    }
  };

  return (
    <section className="vault-glass rounded-xl p-4 sm:p-5">
      {/* Top Toolbar: Redaction Modes + Actions */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#D4AF37]/20 pb-4 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-[#D4AF37] uppercase">
            <Layers className="h-3.5 w-3.5" />
            <span>Redaction Strategy</span>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Redaction Mode">
            {MODE_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-testid={`mode-${opt.value}`}
                  onClick={() => onModeChange(opt.value)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                    active
                      ? 'border-[#D4AF37] bg-[#721422] text-[#F3E5AB] shadow-[0_0_16px_rgba(114,20,34,0.65)]'
                      : 'border-[#D4AF37]/20 bg-[#09090B]/70 text-stone-300 hover:border-[#D4AF37]/45 hover:bg-[#4A0E17]/40 hover:text-[#F3E5AB]'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline-block ${
                      active
                        ? 'bg-[#4A0E17] text-[#F3E5AB]'
                        : 'bg-[#18181B] text-stone-400'
                    }`}
                  >
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePseudoDrawer}
            data-testid="toggle-session-map-btn"
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
              isPseudoDrawerOpen
                ? 'border-[#D4AF37] bg-[#4A0E17] text-[#F3E5AB]'
                : 'border-[#D4AF37]/30 bg-[#111114] text-[#D4AF37] hover:border-[#D4AF37]/60 hover:bg-[#4A0E17]/40'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Session Map</span>
            <span className="rounded-full bg-[#09090B] px-1.5 py-0.5 font-mono text-[10px] text-[#F3E5AB]">
              {pseudoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-file-btn"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#111114] px-3.5 py-2 text-xs font-medium text-stone-200 transition hover:border-[#D4AF37] hover:bg-[#4A0E17]/40 hover:text-[#F3E5AB]"
          >
            <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Upload .TXT / .CSV</span>
          </button>

          <button
            type="button"
            onClick={onLoadSample}
            data-testid="load-sample-btn"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-[#721422] px-3.5 py-2 text-xs font-semibold text-[#F3E5AB] shadow-[0_0_16px_rgba(114,20,34,0.45)] transition hover:border-[#D4AF37] hover:bg-[#9B1B30]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Load Sample Noisy Data</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            onChange={handleFileChange}
            className="hidden"
            data-testid="file-upload-input"
          />
        </div>
      </div>

      {/* Detector Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
            <Database className="h-3.5 w-3.5 text-[#D4AF37]" />
            Active Detectors:
          </span>
          {DETECTOR_META.map(({ type, label, hint }) => {
            const enabled = toggles[type];
            return (
              <button
                key={type}
                type="button"
                aria-pressed={enabled}
                data-testid={`detector-toggle-${type}`}
                onClick={() => onToggleDetector(type)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition ${
                  enabled
                    ? 'border-[#D4AF37]/50 bg-[#4A0E17]/75 text-[#F3E5AB]'
                    : 'border-stone-700/70 bg-[#09090B]/70 text-stone-500 hover:border-stone-500 hover:text-stone-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    enabled ? 'bg-[#D4AF37]' : 'bg-stone-600'
                  }`}
                />
                <span className="font-medium">{label}</span>
                <span className="font-mono text-[10px] opacity-75">{hint}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-stone-400">
          {sourceFileName && (
            <span className="flex items-center gap-1.5 rounded border border-[#D4AF37]/30 bg-[#4A0E17]/50 px-2 py-0.5 text-[#F3E5AB]">
              <FileText className="h-3 w-3 text-[#D4AF37]" />
              <span>{sourceFileName}</span>
              <button
                type="button"
                onClick={onClearFileBadge}
                aria-label="Clear file tag"
                className="cursor-pointer text-stone-400 hover:text-[#F3E5AB]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <span data-testid="input-line-count">{lineCount} lines</span>
          <span className="text-stone-600">|</span>
          <span data-testid="input-char-count">{charCount} chars</span>
        </div>
      </div>

      {/* Raw Input Textarea + Drag-and-Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border transition-all ${
          isDragging
            ? 'border-[#D4AF37] bg-[#4A0E17]/30 shadow-[0_0_24px_rgba(212,175,55,0.2)]'
            : 'border-[#D4AF37]/20 bg-[#09090B]/90'
        }`}
      >
        <textarea
          value={rawInput}
          onChange={(e) => onRawInputChange(e.target.value)}
          data-testid="raw-input-textarea"
          spellCheck={false}
          placeholder="Paste raw support tickets, KYC logs, CSV rows, or drag & drop a .txt / .csv file here. Processing executes strictly inside volatile browser RAM..."
          className="h-44 w-full resize-y rounded-xl bg-transparent p-4 font-mono text-xs leading-relaxed text-stone-200 placeholder-stone-500 focus:outline-none"
        />

        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[#09090B]/80 backdrop-blur-xs">
            <div className="flex items-center gap-2 rounded-lg border border-[#D4AF37] bg-[#4A0E17] px-4 py-2 text-xs font-semibold text-[#F3E5AB]">
              <Upload className="h-4 w-4 text-[#D4AF37]" />
              <span>Drop .TXT or .CSV to ingest into volatile RAM</span>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="mt-2 font-mono text-xs text-rose-400" role="alert">
          {uploadError}
        </p>
      )}
    </section>
  );
};
