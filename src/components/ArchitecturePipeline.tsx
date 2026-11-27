import React from 'react';
import { ArrowRight, Binary, Lock, Shield, Zap } from 'lucide-react';

const STEPS = [
  {
    num: 1,
    icon: Lock,
    title: 'Local File Ingestion',
    desc: 'Files are read by the browser\'s FileReader API directly into volatile RAM. No bytes are transmitted to any server.',
    badge: 'FileReader API',
  },
  {
    num: 2,
    icon: Binary,
    title: 'In-Memory Regex & Validation Engine',
    desc: 'Luhn mod-10, Verhoeff checksum, PAN entity codes, and strict IPv4 octet bounds run purely in the JS V8 engine inside your browser tab.',
    badge: 'Luhn · Verhoeff · PAN',
  },
  {
    num: 3,
    icon: Shield,
    title: 'Deterministic Masking',
    desc: 'Resolved PII spans are replaced with Full Mask labels, Partial context masks, or Consistent Pseudonyms from an ephemeral in-memory Map.',
    badge: 'Full · Partial · Pseudo',
  },
  {
    num: 4,
    icon: Zap,
    title: 'Volatile RAM Purge',
    desc: 'Clicking "Panic Purge" wipes all React state, file buffers, and pseudonymization Maps — no trace persists after tab close.',
    badge: 'CSP connect-src: none',
  },
];

export const ArchitecturePipeline: React.FC = () => {
  return (
    <section id="architecture" className="border-t border-[rgba(245,197,66,0.2)] bg-[rgba(14,12,20,0.62)] px-4 py-16 backdrop-blur-sm sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-10 text-center">
          <span className="font-mono text-xs tracking-wider text-[#D4AF37] uppercase">
            Zero-Trust Architecture
          </span>
          <h2 className="mt-2 text-2xl font-bold text-[#F3E5AB] sm:text-3xl">
            Your Data Never Leaves Your Device
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            4-step processing pipeline — 100% inside your browser's volatile memory
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-4 lg:flex-row">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.num}>
                <div className="vault-glass flex flex-1 flex-col gap-4 rounded-2xl p-6 transition hover:border-[rgba(212,175,55,0.4)]">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.3)] bg-gradient-to-br from-[#4A0E17] to-[#111114] shadow-[0_0_16px_rgba(114,20,34,0.4)]">
                      <Icon className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <span className="font-mono text-4xl font-black text-[rgba(212,175,55,0.08)]">
                      0{step.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F3E5AB]">{step.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-6 text-stone-400">{step.desc}</p>
                  </div>
                  <div className="mt-auto">
                    <span className="rounded-md border border-[rgba(212,175,55,0.25)] bg-[rgba(74,14,23,0.4)] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#D4AF37]">
                      {step.badge}
                    </span>
                  </div>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className="flex items-center justify-center text-[rgba(212,175,55,0.3)] lg:w-6">
                    <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
