import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { RiskAssessment } from '../engine/redactor';

interface RiskGaugeProps {
  risk: RiskAssessment;
}

const SEVERITY_CONFIG = {
  NONE: {
    label: 'No PII Detected',
    barColor: 'bg-stone-700',
    textColor: 'text-stone-400',
    borderColor: 'border-stone-700',
    bgColor: 'bg-stone-900/60',
    icon: ShieldCheck,
    iconColor: 'text-stone-500',
  },
  LOW: {
    label: 'Low Risk',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-800',
    bgColor: 'bg-emerald-950/40',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
  },
  MEDIUM: {
    label: 'Medium Risk',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-800',
    bgColor: 'bg-amber-950/40',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  CRITICAL: {
    label: 'Critical Risk',
    barColor: 'bg-[#9B1B30]',
    textColor: 'text-[#F3E5AB]',
    borderColor: 'border-[rgba(155,27,48,0.6)]',
    bgColor: 'bg-[rgba(74,14,23,0.5)]',
    icon: ShieldAlert,
    iconColor: 'text-[#D4AF37]',
  },
};

export const RiskGauge: React.FC<RiskGaugeProps> = ({ risk }) => {
  const cfg = SEVERITY_CONFIG[risk.severity];
  const Icon = cfg.icon;
  const pct = Math.min(100, risk.score);

  return (
    <div className={`vault-glass flex flex-col gap-2.5 rounded-xl border p-4 ${cfg.borderColor} ${cfg.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
          <span className="text-xs font-semibold tracking-wider uppercase text-stone-300">
            PII Risk Severity
          </span>
        </div>
        <span className={`font-mono text-xs font-bold tracking-widest uppercase ${cfg.textColor}`}>
          {cfg.label}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-stone-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-stone-500">
        <span>{risk.summary}</span>
        <span className={cfg.textColor}>{risk.score}/100</span>
      </div>
    </div>
  );
};
