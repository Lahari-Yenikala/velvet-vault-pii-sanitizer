import React from 'react';
import { CheckCircle, Shield, WifiOff, Zap } from 'lucide-react';
import type { SamplePreset } from '../data/sampleLogs';

interface HeroSectionProps {
  presets: SamplePreset[];
  onLoadPreset: (preset: SamplePreset) => void;
  onSwitchTab: (tab: 'studio') => void;
}

const SEC_CHECKS = [
  { icon: WifiOff, label: '0 Network Calls', desc: 'CSP connect-src: none', accent: 'text-emerald-400', iconBg: 'bg-emerald-500/15 border-emerald-400/40' },
  { icon: Shield, label: 'CSP Active', desc: 'Enforced at browser level', accent: 'text-amber-300', iconBg: 'bg-amber-400/15 border-amber-300/40' },
  { icon: Zap, label: 'Volatile RAM Mode', desc: 'No localStorage / IndexedDB', accent: 'text-rose-300', iconBg: 'bg-rose-500/20 border-rose-400/40' },
  { icon: CheckCircle, label: 'Air-Gapped Engine', desc: '100% client-side processing', accent: 'text-emerald-300', iconBg: 'bg-emerald-500/15 border-emerald-400/40' },
];

const BADGE_COLORS: Record<string, string> = {
  LOG: 'bg-amber-400/20 text-amber-200 border-amber-300/50',
  CSV: 'bg-rose-500/25 text-rose-200 border-rose-400/50',
  HIPAA: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
  DUMP: 'bg-sky-500/20 text-sky-200 border-sky-400/50',
};

export const HeroSection: React.FC<HeroSectionProps> = ({ presets, onLoadPreset, onSwitchTab }) => {
  return (
    <section className="border-b border-[rgba(245,197,66,0.22)] bg-gradient-to-b from-[rgba(24,14,26,0.45)] via-[rgba(15,12,20,0.35)] to-transparent px-4 py-10 backdrop-blur-[2px] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-[1600px]">
        {/* Hero Title */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/55 px-4 py-1.5 shadow-[0_0_24px_rgba(16,185,129,0.22)]">
            <span className="vault-pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-semibold tracking-wider text-emerald-200">
              ENTERPRISE ZERO-TRUST PII SANITIZATION ENGINE
            </span>
          </div>
          <h1 className="bg-gradient-to-r from-[#FEF08A] via-[#F5C542] to-[#FDA4AF] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-[0_4px_24px_rgba(245,197,66,0.28)] sm:text-5xl lg:text-6xl">
            VELVET VAULT
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-200 sm:text-base">
            Military-grade PII detection and redaction running exclusively in your browser&apos;s volatile RAM.{' '}
            <span className="font-semibold text-[#FEF08A]">No data leaves your device. Ever.</span>
          </p>
        </div>

        {/* Client-Side Security Verification Meter */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SEC_CHECKS.map(({ icon: Icon, label, desc, accent, iconBg }) => (
            <div
              key={label}
              className="vault-glass flex items-center gap-3 rounded-xl p-3.5 transition hover:border-[#F5C542]/60"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconBg}`}>
                <Icon className={`h-4 w-4 ${accent}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#FEF08A]">{label}</p>
                <p className="text-[11px] text-stone-300">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick-Start Presets */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <span className="font-mono text-xs font-semibold tracking-wider text-amber-200/80 uppercase">
            Quick Load:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onLoadPreset(preset);
                  onSwitchTab('studio');
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[rgba(245,197,66,0.35)] bg-[rgba(24,20,30,0.8)] px-3.5 py-2 text-xs font-medium text-stone-100 shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#F5C542] hover:bg-[#881337]/75 hover:text-[#FEF08A]"
              >
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${BADGE_COLORS[preset.badge] ?? 'bg-stone-800 text-stone-300 border-stone-600'}`}
                >
                  {preset.badge}
                </span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
