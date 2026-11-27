import React from 'react';
import {
  CheckCircle,
  CreditCard,
  FileJson,
  Fingerprint,
  Globe,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { AuditCounts, RedactionMode, SanitizationResult } from '../engine/redactor';
import type { DetectorToggles } from '../engine/validators';

interface AuditLogProps {
  result: SanitizationResult;
  mode: RedactionMode;
  toggles: DetectorToggles;
  lineCount: number;
  charCount: number;
  sourceFileName: string | null;
}

const COMPLIANCE_FRAMEWORKS = [
  {
    id: 'dpdp',
    name: 'India DPDP Act 2023',
    badge: 'IN',
    desc: 'Data Protection & Privacy — Velvet Vault automatically redacts Aadhaar UIDs and Indian PANs governed under the Digital Personal Data Protection Act, 2023.',
    covered: ['AADHAAR', 'PAN', 'EMAIL', 'PHONE'],
    color: 'border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.3)]',
  },
  {
    id: 'pcidss',
    name: 'PCI-DSS v4.0',
    badge: 'PCI',
    desc: 'Payment Card Industry — Luhn-validated credit card PANs are detected and redacted, ensuring cardholder data never appears in logs, tickets, or reports.',
    covered: ['CARD'],
    color: 'border-[rgba(155,27,48,0.4)] bg-[rgba(74,14,23,0.3)]',
  },
  {
    id: 'gdpr',
    name: 'GDPR (EU) 2016/679',
    badge: 'EU',
    desc: 'General Data Protection Regulation — Email addresses, international phone numbers, and IP addresses are detected and redacted per Article 4(1) personal data definitions.',
    covered: ['EMAIL', 'PHONE', 'IP'],
    color: 'border-[rgba(212,175,55,0.2)] bg-[rgba(17,17,20,0.6)]',
  },
  {
    id: 'hipaa',
    name: 'HIPAA PHI',
    badge: 'US',
    desc: 'Health Insurance Portability & Accountability Act — 18 PHI identifiers including patient emails, phones, and national ID numbers are covered by the detection engine.',
    covered: ['EMAIL', 'PHONE', 'PAN', 'AADHAAR', 'IP'],
    color: 'border-[rgba(212,175,55,0.2)] bg-[rgba(17,17,20,0.6)]',
  },
];

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  PHONE: Phone,
  CARD: CreditCard,
  PAN: IdCard,
  AADHAAR: Fingerprint,
  IP: Globe,
  CUSTOM: ShieldAlert,
};

const SEVERITY_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  NONE: { text: 'text-stone-500', bg: 'bg-stone-900', border: 'border-stone-800' },
  LOW: { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-800' },
  MEDIUM: { text: 'text-amber-400', bg: 'bg-amber-950/50', border: 'border-amber-800' },
  CRITICAL: { text: 'text-[#F3E5AB]', bg: 'bg-[rgba(74,14,23,0.6)]', border: 'border-[rgba(155,27,48,0.5)]' },
};

export const ComplianceAuditLog: React.FC<AuditLogProps> = ({
  result,
  mode,
  toggles,
  lineCount,
  charCount,
  sourceFileName,
}) => {
  const { counts, totalRedacted, luhnFalsePositivesIgnored, risk, sessionMappings } = result;
  const ss = SEVERITY_STYLES[risk.severity];

  return (
    <div className="flex flex-col gap-6">
      {/* Zero-PII Telemetry Header */}
      <div className="vault-glass rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="text-sm font-semibold tracking-wider text-[#F3E5AB] uppercase">
            Session Telemetry — Zero Raw PII
          </h2>
          <span className="ml-auto font-mono text-[11px] text-stone-500">
            {new Date().toISOString()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Risk Severity */}
          <div className={`flex flex-col gap-1.5 rounded-lg border p-3 ${ss.border} ${ss.bg}`}>
            <span className="font-mono text-[10px] text-stone-500 uppercase">Risk Level</span>
            <span className={`font-mono text-lg font-bold ${ss.text}`}>{risk.severity}</span>
            <span className="font-mono text-[10px] text-stone-600">Score: {risk.score}/100</span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-[rgba(212,175,55,0.2)] bg-[#111114] p-3">
            <span className="font-mono text-[10px] text-stone-500 uppercase">Total Redacted</span>
            <span className="font-mono text-lg font-bold text-[#D4AF37]">{totalRedacted}</span>
            <span className="font-mono text-[10px] text-stone-600">PII entities</span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-[rgba(212,175,55,0.2)] bg-[#111114] p-3">
            <span className="font-mono text-[10px] text-stone-500 uppercase">Luhn Ignored</span>
            <span className="font-mono text-lg font-bold text-[#F3E5AB]">{luhnFalsePositivesIgnored}</span>
            <span className="font-mono text-[10px] text-stone-600">false positives</span>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-[rgba(212,175,55,0.2)] bg-[#111114] p-3">
            <span className="font-mono text-[10px] text-stone-500 uppercase">Session Map</span>
            <span className="font-mono text-lg font-bold text-[#D4AF37]">{sessionMappings.length}</span>
            <span className="font-mono text-[10px] text-stone-600">unique tokens</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-7">
          {(Object.entries(counts) as [string, number][]).map(([cat, count]) => {
            const Icon = CATEGORY_ICONS[cat] ?? ShieldAlert;
            return (
              <div key={cat} className="flex flex-col items-center gap-1 rounded-lg border border-[rgba(212,175,55,0.1)] bg-[#09090B] p-2">
                <Icon className={`h-3.5 w-3.5 ${count > 0 ? 'text-[#D4AF37]' : 'text-stone-700'}`} />
                <span className={`font-mono text-base font-bold ${count > 0 ? 'text-[#D4AF37]' : 'text-stone-700'}`}>{count}</span>
                <span className="font-mono text-[9px] text-stone-600 uppercase">{cat}</span>
              </div>
            );
          })}
        </div>

        {/* Session metadata */}
        <div className="mt-4 rounded-lg border border-stone-800 bg-[#09090B] p-3 font-mono text-[11px] leading-6 text-stone-500">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
            <div><span className="text-stone-700">mode</span> <span className="text-stone-300">{mode}</span></div>
            <div><span className="text-stone-700">source</span> <span className="text-stone-300">{sourceFileName ?? '(paste)'}</span></div>
            <div><span className="text-stone-700">lines</span> <span className="text-stone-300">{lineCount}</span></div>
            <div><span className="text-stone-700">chars</span> <span className="text-stone-300">{charCount}</span></div>
            <div><span className="text-stone-700">density</span> <span className="text-stone-300">{risk.densityPer100Words} PII/100w</span></div>
            <div><span className="text-stone-700">high-risk</span> <span className="text-stone-300">{risk.highRiskCount} tokens</span></div>
            <div><span className="text-stone-700">storage</span> <span className="text-emerald-500">volatile RAM only</span></div>
            <div><span className="text-stone-700">network</span> <span className="text-emerald-500">0 calls (CSP)</span></div>
          </div>
        </div>
      </div>

      {/* Enabled Detectors */}
      <div className="vault-glass rounded-xl p-5">
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
          Active Detector Configuration
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(toggles) as [string, boolean][]).map(([det, on]) => (
            <div
              key={det}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] ${
                on
                  ? 'border-[rgba(212,175,55,0.4)] bg-[rgba(74,14,23,0.5)] text-[#F3E5AB]'
                  : 'border-stone-800 bg-transparent text-stone-600'
              }`}
            >
              {on ? <CheckCircle className="h-3 w-3 text-[#D4AF37]" /> : <ShieldAlert className="h-3 w-3" />}
              {det}
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Grid */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
          <Lock className="h-4 w-4" /> Regulatory Compliance Coverage
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COMPLIANCE_FRAMEWORKS.map((fw) => (
            <div
              key={fw.id}
              className={`vault-glass rounded-xl border p-4 ${fw.color}`}
            >
              <div className="mb-2 flex items-center gap-2.5">
                <span className="rounded border border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.6)] px-2 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
                  {fw.badge}
                </span>
                <h4 className="text-sm font-semibold text-[#F3E5AB]">{fw.name}</h4>
              </div>
              <p className="mb-3 text-[11px] leading-5 text-stone-400">{fw.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {fw.covered.map((cat) => {
                  const catCount = counts[cat as keyof AuditCounts] ?? 0;
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-1 rounded-md border border-[rgba(212,175,55,0.2)] bg-[#09090B] px-2 py-0.5 font-mono text-[10px]"
                    >
                      <span className={catCount > 0 ? 'text-[#D4AF37]' : 'text-stone-600'}>{cat}</span>
                      {catCount > 0 && (
                        <span className="ml-1 rounded-full bg-[rgba(74,14,23,0.6)] px-1.5 font-bold text-[#F3E5AB]">
                          {catCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit JSON Preview */}
      {totalRedacted > 0 && (
        <div className="vault-glass rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
              Sample Compliance Audit JSON (Zero-PII)
            </h3>
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg border border-stone-800 bg-[#09090B] p-3 font-mono text-[10px] leading-5 text-stone-400">
            {JSON.stringify(
              {
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
                sanitizationSummary: {
                  totalRedactedEntities: totalRedacted,
                  luhnFalsePositivesIgnored,
                  riskSeverity: risk.severity,
                  riskScore: risk.score,
                  entityCountsByCategory: counts,
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
