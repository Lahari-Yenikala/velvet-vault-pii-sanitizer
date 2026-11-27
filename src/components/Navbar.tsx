import React from 'react';
import { Flame, Lock, ShieldCheck, LogOut } from 'lucide-react';
import type { AuthUser } from '../auth/authStore';

export type TabId = 'studio' | 'batch' | 'regex' | 'audit';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onPanicPurge: () => void;
  purgeFlash: boolean;
  hasContent: boolean;
  user?: AuthUser;
  onLogout?: () => void;
}

const TABS: { id: TabId; label: string; shortLabel: string }[] = [
  { id: 'studio', label: 'Sanitizer Studio', shortLabel: 'Studio' },
  { id: 'batch', label: 'Batch Processor', shortLabel: 'Batch' },
  { id: 'regex', label: 'Custom Regex Rules', shortLabel: 'Regex' },
  { id: 'audit', label: 'Compliance Audit', shortLabel: 'Audit' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onPanicPurge,
  purgeFlash,
  hasContent,
  user,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(245,197,66,0.28)] bg-[rgba(15,13,22,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.4)] bg-gradient-to-br from-[#4A0E17] to-[#111114] shadow-[0_0_20px_rgba(114,20,34,0.4)]">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-[0.2em] text-[#F3E5AB] sm:text-lg">
                VELVET VAULT
              </span>
              <span className="hidden rounded border border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.6)] px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-[#D4AF37] sm:inline">
                v2.0 // ENTERPRISE
              </span>
            </div>
            <p className="hidden text-[10px] tracking-wide text-stone-500 sm:block">
              Zero-Trust Client-Side PII Sanitization Platform
            </p>
          </div>
        </div>

        {/* Tab Nav */}
        <nav className="hidden items-center gap-1 md:flex" role="tablist" aria-label="Workspace tabs">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(tab.id)}
                className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-medium tracking-wide transition-all duration-150 ${
                  active
                    ? 'bg-[#721422] text-[#F3E5AB] shadow-[0_0_14px_rgba(114,20,34,0.55)]'
                    : 'text-stone-400 hover:bg-[rgba(74,14,23,0.4)] hover:text-[#F3E5AB]'
                }`}
              >
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div
            title="Content-Security-Policy connect-src 'none' — Zero outbound network calls"
            className="hidden items-center gap-1.5 rounded-full border border-[rgba(212,175,55,0.3)] bg-[#111114] px-3 py-1.5 sm:flex"
          >
            <span className="vault-pulse-dot h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            <Lock className="h-3 w-3 text-[#D4AF37]" />
            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#F3E5AB]">
              AIR-GAPPED // RAM
            </span>
          </div>

          <button
            type="button"
            onClick={onPanicPurge}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 ${
              purgeFlash
                ? 'border-[#F3E5AB] bg-[#9B1B30] text-[#F3E5AB] shadow-[0_0_22px_rgba(155,27,48,0.9)]'
                : hasContent
                  ? 'border-[rgba(212,175,55,0.5)] bg-[#721422] text-[#F3E5AB] shadow-[0_0_14px_rgba(114,20,34,0.5)] hover:bg-[#9B1B30]'
                  : 'border-[rgba(212,175,55,0.2)] bg-[rgba(74,14,23,0.5)] text-[#D4AF37] hover:bg-[#721422] hover:text-[#F3E5AB]'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">{purgeFlash ? 'Purged' : 'Panic Purge'}</span>
          </button>

          {/* User + Logout */}
          {user && onLogout && (
            <div className="flex items-center gap-2 ml-1">
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9B1B30] to-[#4A0E17] flex items-center justify-center text-[9px] font-bold text-[#D4AF37] uppercase">
                  {user.fullName.charAt(0)}
                </div>
                <span className="text-[10px] text-[#F3E5AB] font-medium max-w-[90px] truncate">{user.fullName}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-2 text-[10px] font-medium text-stone-400 hover:text-[#F3E5AB] hover:border-[#D4AF37]/30 hover:bg-[rgba(74,14,23,0.4)] transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Row */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-[rgba(212,175,55,0.1)] px-4 py-1.5 md:hidden">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-medium transition-all ${
                active
                  ? 'bg-[#721422] text-[#F3E5AB]'
                  : 'text-stone-400 hover:bg-[rgba(74,14,23,0.4)] hover:text-[#F3E5AB]'
              }`}
            >
              {tab.shortLabel}
            </button>
          );
        })}
      </div>
    </header>
  );
};
