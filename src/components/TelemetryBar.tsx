import React from 'react';
import {
  CreditCard,
  Fingerprint,
  Globe,
  IdCard,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { AuditCounts } from '../engine/redactor';

interface TelemetryBarProps {
  totalRedacted: number;
  counts: AuditCounts;
  luhnFalsePositivesIgnored: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  totalRedacted,
  counts,
  luhnFalsePositivesIgnored,
}) => {
  const categories = [
    { key: 'EMAIL', label: 'Emails', count: counts.EMAIL, icon: Mail },
    { key: 'PHONE', label: 'Phones', count: counts.PHONE, icon: Phone },
    { key: 'CARD', label: 'Cards (Luhn)', count: counts.CARD, icon: CreditCard },
    { key: 'PAN', label: 'Indian PAN', count: counts.PAN, icon: IdCard },
    { key: 'AADHAAR', label: 'Aadhaar', count: counts.AADHAAR, icon: Fingerprint },
    { key: 'IP', label: 'IP Addresses', count: counts.IP, icon: Globe },
  ] as const;

  return (
    <section aria-label="Sanitization Telemetry" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {/* Total Redacted Entities */}
      <div className="vault-glass col-span-2 flex flex-col justify-between rounded-xl p-3.5 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase">
            Total Redacted
          </span>
          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            data-testid="telemetry-total-redacted"
            className="font-mono text-2xl font-bold text-[#F3E5AB]"
          >
            {totalRedacted}
          </span>
          <span className="text-[11px] text-stone-500">entities</span>
        </div>
      </div>

      {/* Per-Category Counts */}
      {categories.map(({ key, label, count, icon: Icon }) => (
        <div
          key={key}
          className="vault-glass flex flex-col justify-between rounded-xl p-3.5 transition-colors hover:border-[#D4AF37]/45"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[11px] font-medium tracking-wider text-stone-400 uppercase">
              {label}
            </span>
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]/80" />
          </div>
          <div className="mt-2">
            <span
              data-testid={`telemetry-count-${key}`}
              className={`font-mono text-2xl font-semibold ${
                count > 0 ? 'text-[#D4AF37]' : 'text-stone-500'
              }`}
            >
              {count}
            </span>
          </div>
        </div>
      ))}

      {/* Luhn False Positives Ignored */}
      <div
        className="col-span-2 flex flex-col justify-between rounded-xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#4A0E17]/55 to-[#111114] p-3.5 shadow-[inset_0_1px_0_rgba(243,229,171,0.08)] sm:col-span-2 lg:col-span-1"
        title="13-19 digit candidates (such as tracking or order IDs) that failed the Luhn mod-10 checksum and were left untouched."
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-medium tracking-wider text-[#F3E5AB] uppercase">
            Luhn Ignored
          </span>
          <ShieldAlert className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            data-testid="telemetry-luhn-ignored"
            className="font-mono text-2xl font-bold text-[#F3E5AB]"
          >
            {luhnFalsePositivesIgnored}
          </span>
          <span className="text-[10px] text-stone-300/80">false positives</span>
        </div>
      </div>
    </section>
  );
};
