import React from 'react';
import { KeyRound, Shield, X } from 'lucide-react';
import type { PseudonymEntry } from '../engine/redactor';

interface PseudonymDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: PseudonymEntry[];
}

export const PseudonymDrawer: React.FC<PseudonymDrawerProps> = ({
  isOpen,
  onClose,
  mappings,
}) => {
  if (!isOpen) return null;

  return (
    <section
      aria-label="Ephemeral Session Pseudonymization Map"
      data-testid="pseudonym-drawer"
      className="vault-glass rounded-xl p-4 sm:p-5"
    >
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <KeyRound className="h-4 w-4 text-[#D4AF37]" />
          <h2 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
            Ephemeral Session Pseudonym Map (In-Memory RAM)
          </h2>
          <span className="rounded border border-[#D4AF37]/30 bg-[#4A0E17]/60 px-2 py-0.5 font-mono text-[10px] text-[#D4AF37]">
            {mappings.length} unique entries
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close session map drawer"
          className="cursor-pointer rounded-md p-1 text-stone-400 transition hover:bg-[#4A0E17]/60 hover:text-[#F3E5AB]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mappings.length === 0 ? (
        <div className="flex items-center gap-2 py-6 text-xs text-stone-400">
          <Shield className="h-4 w-4 text-[#D4AF37]/60" />
          <span>
            No active entities in the volatile session Map. Load sample data or paste logs to populate deterministic tokens.
          </span>
        </div>
      ) : (
        <div className="mt-3 max-h-60 overflow-auto rounded-lg border border-[#D4AF37]/20 bg-[#09090B]">
          <table className="w-full border-collapse text-left font-mono text-xs">
            <thead className="sticky top-0 bg-[#111114] text-[11px] text-[#D4AF37] uppercase">
              <tr className="border-b border-[#D4AF37]/20">
                <th className="px-3 py-2 font-semibold">Placeholder</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Detected Raw Value (RAM Only)</th>
                <th className="px-3 py-2 text-right font-semibold">Hits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {mappings.map((entry) => (
                <tr key={entry.canonicalKey} className="hover:bg-[#4A0E17]/25">
                  <td className="px-3 py-2 font-semibold text-[#F3E5AB]">
                    <span className="rounded border border-[#D4AF37]/30 bg-[#4A0E17]/60 px-1.5 py-0.5">
                      {entry.placeholder}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-stone-300">{entry.type}</td>
                  <td className="px-3 py-2 text-stone-200">{entry.originalSample}</td>
                  <td className="px-3 py-2 text-right text-[#D4AF37]">{entry.occurrences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
