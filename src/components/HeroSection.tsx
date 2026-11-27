import React from 'react';
import { CheckCircle, Shield, WifiOff, Zap } from 'lucide-react';
import type { SamplePreset } from '../data/sampleLogs';

interface HeroSectionProps {
  presets: SamplePreset[];
  onLoadPreset: (preset: SamplePreset) => void;
  onSwitchTab: (tab: 'studio') => void;
}

const SEC_CHECKS = [
  { icon: WifiOff, label: '0 Network Calls', desc: 'CSP connect-src: none' },
  { icon: Shield, label: 'CSP Active', desc: 'Enforced at browser level' },
  { icon: Zap, label: 'Volatile RAM Mode', desc: 'No localStorage / IndexedDB' },
  { icon: CheckCircle, label: 'Air-Gapped Engine', desc: '100% client-side processing' },
];

const BADGE_COLORS: Record<string, string> = {
  LOG: 'bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border-[rgba(212,175,55,0.35)]',
  CSV: 'bg-[rgba(74,14,23,0.6)] text-[#F3E5AB] border-[rgba(243,229,171,0.3)]',
  HIPAA: 'bg-[rgba(114,20,34,0.5)] text-[#F3E5AB] border-[rgba(155,27,48,0.5)]',
  DUMP: 'bg-[rgba(17,17,20,0.8)] text-stone-300 border-stone-600',
};

export const HeroSection: React.FC<HeroSectionProps> = ({ presets, onLoadPreset, onSwitchTab }) => {
  return (
    <section className="border-b border-[rgba(212,175,55,0.15)] bg-gradient-to-b from-[#0d0d10] to-[#09090B] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-[1600px]">
        {/* Hero Title */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.4)] px-4 py-1.5">
            <span className="vault-pulse-dot h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            <span className="font-mono text-xs tracking-wider text-[#D4AF37]">
              ENTERPRISE ZERO-TRUST PII SANITIZATION ENGINE
            </span>
          </div>
          <h1 className="bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#b8942e] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            VELVET VAULT
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-400 sm:text-base">
            Military-grade PII detection and redaction running exclusively in your browser's volatile RAM.{' '}
            <span className="text-[#D4AF37]">No data leaves your device. Ever.</span>
          </p>
        </div>

        {/* Client-Side Security Verification Meter */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SEC_CHECKS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-[rgba(212,175,55,0.2)] bg-[#111114] p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(212,175,55,0.25)] bg-[rgba(74,14,23,0.5)]">
                <Icon className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F3E5AB]">{label}</p>
                <p className="text-[10px] text-stone-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick-Start Presets */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <span className="font-mono text-xs tracking-wider text-stone-500 uppercase">
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
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[rgba(212,175,55,0.25)] bg-[#111114] px-3.5 py-2 text-xs font-medium text-stone-200 transition hover:border-[#D4AF37] hover:bg-[rgba(74,14,23,0.5)] hover:text-[#F3E5AB]"
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
