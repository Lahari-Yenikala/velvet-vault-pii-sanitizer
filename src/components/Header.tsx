import React from 'react';
import { Flame, Lock, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onPanicPurge: () => void;
  purgeFlash: boolean;
  hasContent: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onPanicPurge, purgeFlash, hasContent }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#D4AF37]/25 bg-[#09090B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#4A0E17] to-[#111114] shadow-[0_0_24px_rgba(114,20,34,0.45)]">
            <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-[0.22em] text-[#F3E5AB] sm:text-xl">
                VELVET VAULT
              </h1>
              <span className="hidden rounded border border-[#D4AF37]/30 bg-[#4A0E17]/60 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-[#D4AF37] sm:inline-block">
                v1.0 // ZERO-TRUST
              </span>
            </div>
            <p className="text-xs tracking-wide text-stone-400">
              Client-Side Volatile RAM PII Sanitization &amp; Compliance Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-2.5 rounded-full border border-[#D4AF37]/30 bg-[#111114] px-3.5 py-1.5"
            title="Content-Security-Policy connect-src 'none' active. Zero network calls or persistent browser storage."
          >
            <span className="vault-pulse-dot h-2 w-2 rounded-full bg-[#D4AF37]" />
            <Lock className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="font-mono text-[11px] font-medium tracking-wider text-[#F3E5AB]">
              AIR-GAPPED // 100% CLIENT-SIDE RAM
            </span>
          </div>

          <button
            type="button"
            onClick={onPanicPurge}
            data-testid="panic-purge-btn"
            className={`group flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
              purgeFlash
                ? 'border-[#F3E5AB] bg-[#9B1B30] text-[#F3E5AB] shadow-[0_0_25px_rgba(155,27,48,0.85)]'
                : hasContent
                  ? 'border-[#D4AF37]/45 bg-[#721422] text-[#F3E5AB] shadow-[0_0_18px_rgba(114,20,34,0.5)] hover:border-[#D4AF37] hover:bg-[#9B1B30]'
                  : 'border-[#D4AF37]/25 bg-[#4A0E17]/70 text-[#D4AF37] hover:border-[#D4AF37]/60 hover:bg-[#721422] hover:text-[#F3E5AB]'
            }`}
          >
            <Flame className="h-4 w-4 text-[#D4AF37] transition-transform duration-200 group-hover:scale-110" />
            <span>{purgeFlash ? 'Memory Purged' : 'Panic Purge Memory'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
