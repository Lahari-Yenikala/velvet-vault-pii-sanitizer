import React, { useState } from 'react';
import { Check, Copy, Download, FileJson, Keyboard, ShieldCheck } from 'lucide-react';
import type { AuditCounts, RedactionMode } from '../engine/redactor';
import type { DetectorToggles } from '../engine/validators';

interface EnterpriseFooterProps {
  sanitizedText: string;
  sourceFileName: string | null;
  mode: RedactionMode;
  toggles: DetectorToggles;
  totalRedacted: number;
  counts: AuditCounts;
  luhnFalsePositivesIgnored: number;
  lineCount: number;
  charCount: number;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], label: 'Sanitize / Re-run' },
  { keys: ['Ctrl', 'K'], label: 'Panic Purge Memory' },
  { keys: ['Ctrl', 'D'], label: 'Download Sanitized' },
];

export const EnterpriseFooter: React.FC<EnterpriseFooterProps> = ({
  sanitizedText,
  sourceFileName,
  mode,
  toggles,
  totalRedacted,
  counts,
  luhnFalsePositivesIgnored,
  lineCount,
  charCount,
}) => {
  const [copied, setCopied] = useState(false);
  const hasOutput = sanitizedText.length > 0;

  const handleCopy = async () => {
    if (!hasOutput) return;
    try {
      await navigator.clipboard.writeText(sanitizedText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = sanitizedText;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!hasOutput) return;
    const isCsv = sourceFileName?.toLowerCase().endsWith('.csv');
    const ext = isCsv ? '.csv' : '.txt';
    const filename = sourceFileName
      ? `sanitized_${sourceFileName.replace(/\.[^.]+$/, '')}${ext}`
      : `sanitized_output${ext}`;
    triggerDownload(sanitizedText, filename, isCsv ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8');
  };

  const handleAuditJson = () => {
    if (!hasOutput) return;
    const payload = {
      application: 'VELVET VAULT',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      securityPosture: {
        executionEnvironment: '100% Client-Side Volatile Browser RAM',
        networkPolicy: "connect-src 'none'",
        persistentStorageUsed: false,
        rawPiiIncluded: false,
      },
      activeRedactionMode: mode,
      enabledDetectors: toggles,
      sourceMetrics: {
        inputFormat: sourceFileName?.toLowerCase().endsWith('.csv') ? 'CSV' : 'TEXT',
        lineCount,
        characterCount: charCount,
      },
      sanitizationSummary: {
        totalRedactedEntities: totalRedacted,
        luhnFalsePositivesIgnored,
        entityCountsByCategory: counts,
      },
    };
    triggerDownload(JSON.stringify(payload, null, 2), `velvet_vault_audit_${Date.now()}.json`, 'application/json;charset=utf-8');
  };

  return (
    <footer className="border-t border-[rgba(212,175,55,0.15)] bg-[#09090B]">
      {/* Export Bar */}
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
          <span>
            Audit JSON never contains raw PII — only counts, timestamps, and mode metadata.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasOutput}
            data-testid="copy-sanitized-btn"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(212,175,55,0.3)] bg-[#111114] px-3.5 py-2 text-xs font-medium text-[#F3E5AB] transition hover:border-[#D4AF37] hover:bg-[rgba(74,14,23,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#D4AF37]" /> : <Copy className="h-3.5 w-3.5 text-[#D4AF37]" />}
            {copied ? 'Copied' : 'Copy Sanitized'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!hasOutput}
            data-testid="download-sanitized-btn"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(212,175,55,0.4)] bg-[#721422] px-3.5 py-2 text-xs font-semibold text-[#F3E5AB] transition hover:bg-[#9B1B30] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-[#D4AF37]" />
            Download {sourceFileName?.toLowerCase().endsWith('.csv') ? '.CSV' : '.TXT'}
          </button>

          <button
            type="button"
            onClick={handleAuditJson}
            disabled={!hasOutput}
            data-testid="download-audit-btn"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(212,175,55,0.3)] bg-[#18181B] px-3.5 py-2 text-xs font-medium text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[rgba(74,14,23,0.5)] hover:text-[#F3E5AB] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileJson className="h-3.5 w-3.5" />
            Compliance Audit .JSON
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[rgba(212,175,55,0.08)] bg-[#07070A]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-[10px] text-stone-700 uppercase tracking-wider">
              VELVET VAULT v2.0 · Zero-Trust PII Sanitizer
            </span>
            <span className="rounded border border-[rgba(212,175,55,0.15)] bg-[rgba(74,14,23,0.3)] px-2 py-0.5 font-mono text-[9px] text-[#D4AF37]">
              CSP: connect-src 'none'
            </span>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex items-center gap-3">
            <Keyboard className="h-3.5 w-3.5 shrink-0 text-stone-700" />
            {SHORTCUTS.map(({ keys, label }) => (
              <div key={label} className="hidden items-center gap-1.5 sm:flex">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-stone-800 bg-[#111114] px-1.5 py-0.5 font-mono text-[9px] text-stone-600"
                  >
                    {k}
                  </kbd>
                ))}
                <span className="text-[10px] text-stone-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
