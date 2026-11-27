import React, { useState } from 'react';
import { Check, Copy, Download, FileJson, ShieldCheck } from 'lucide-react';
import type { AuditCounts, RedactionMode } from '../engine/redactor';
import type { DetectorToggles } from '../engine/validators';

interface AuditExportFooterProps {
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

export const AuditExportFooter: React.FC<AuditExportFooterProps> = ({
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
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for restricted clipboard environments
      const temp = document.createElement('textarea');
      temp.value = sanitizedText;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSanitized = () => {
    if (!hasOutput) return;
    const isCsv = sourceFileName?.toLowerCase().endsWith('.csv');
    const filename = isCsv
      ? `sanitized_${sourceFileName}`
      : sourceFileName
        ? `sanitized_${sourceFileName.replace(/\.[^.]+$/, '')}.txt`
        : 'sanitized_output.txt';
    const mime = isCsv ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
    triggerDownload(sanitizedText, filename, mime);
  };

  const handleDownloadAuditLog = () => {
    if (!hasOutput) return;
    const auditPayload = {
      application: 'VELVET VAULT',
      version: '1.0.0',
      securityPosture: {
        executionEnvironment: '100% Client-Side Volatile Browser RAM',
        networkPolicy: "connect-src 'none'",
        persistentStorageUsed: false,
        rawPiiIncluded: false,
      },
      timestamp: new Date().toISOString(),
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

    const json = JSON.stringify(auditPayload, null, 2);
    triggerDownload(json, `velvet_vault_audit_${Date.now()}.json`, 'application/json;charset=utf-8');
  };

  return (
    <footer className="vault-glass flex flex-col items-start justify-between gap-4 rounded-xl px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
      <div className="flex items-center gap-2.5 text-xs text-stone-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        <span>
          Zero-PII Compliance Export — Audit JSON records counts &amp; metadata only; raw PII is never serialized.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasOutput}
          data-testid="copy-sanitized-btn"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#111114] px-3.5 py-2 text-xs font-medium text-[#F3E5AB] transition hover:border-[#D4AF37] hover:bg-[#4A0E17]/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Copy Sanitized Text</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadSanitized}
          disabled={!hasOutput}
          data-testid="download-sanitized-btn"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#D4AF37]/40 bg-[#721422] px-3.5 py-2 text-xs font-semibold text-[#F3E5AB] transition hover:border-[#D4AF37] hover:bg-[#9B1B30] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span>
            Download {sourceFileName?.toLowerCase().endsWith('.csv') ? 'Sanitized .CSV' : 'Sanitized .TXT'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleDownloadAuditLog}
          disabled={!hasOutput}
          data-testid="download-audit-btn"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#D4AF37]/35 bg-[#18181B] px-3.5 py-2 text-xs font-medium text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#4A0E17]/50 hover:text-[#F3E5AB] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileJson className="h-3.5 w-3.5" />
          <span>Compliance Audit (.JSON)</span>
        </button>
      </div>
    </footer>
  );
};
