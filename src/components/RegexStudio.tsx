import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  PlusCircle,
  TestTube,
  ToggleLeft,
  ToggleRight,
  Trash2,
  XCircle,
} from 'lucide-react';
import { type CustomRule, compileSafeRegex } from '../engine/redactor';

interface RegexStudioProps {
  rules: CustomRule[];
  onRulesChange: (rules: CustomRule[]) => void;
}

const LABEL_SUGGESTIONS = [
  '[REDACTED_UPI]',
  '[REDACTED_EMP_ID]',
  '[REDACTED_API_KEY]',
  '[REDACTED_PASSPORT]',
  '[REDACTED_GSTIN]',
  '[REDACTED_SSN]',
  '[REDACTED_CUSTOM]',
];

export const RegexStudio: React.FC<RegexStudioProps> = ({ rules, onRulesChange }) => {
  const [newName, setNewName] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newFlags, setNewFlags] = useState('g');
  const [newLabel, setNewLabel] = useState('[REDACTED_CUSTOM]');
  const [newDesc, setNewDesc] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testRuleId, setTestRuleId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const toggleRule = (id: string) => {
    onRulesChange(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (id: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  const handleAdd = () => {
    setAddError(null);
    if (!newName.trim()) { setAddError('Rule name is required.'); return; }
    if (!newPattern.trim()) { setAddError('Regex pattern is required.'); return; }
    const { regex, error } = compileSafeRegex(newPattern, newFlags);
    if (!regex || error) { setAddError(error ?? 'Invalid regex.'); return; }

    const rule: CustomRule = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      pattern: newPattern.trim(),
      flags: newFlags.trim() || 'g',
      maskLabel: newLabel.trim() || '[REDACTED_CUSTOM]',
      enabled: true,
      description: newDesc.trim() || undefined,
    };
    onRulesChange([...rules, rule]);
    setNewName('');
    setNewPattern('');
    setNewFlags('g');
    setNewLabel('[REDACTED_CUSTOM]');
    setNewDesc('');
  };

  const getTestMatches = (rule: CustomRule): string[] => {
    if (!testInput) return [];
    const { regex } = compileSafeRegex(rule.pattern, rule.flags);
    if (!regex) return [];
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(testInput)) !== null && matches.length < 20) {
      if (m[0].length === 0) { regex.lastIndex++; continue; }
      matches.push(m[0]);
    }
    return matches;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Active Rules Table */}
      <div className="vault-glass overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-[rgba(212,175,55,0.2)] bg-[#111114] px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#D4AF37]" />
            <h2 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
              Active Redaction Rules
            </h2>
            <span className="rounded border border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.5)] px-1.5 py-0.5 font-mono text-[10px] text-[#D4AF37]">
              {rules.filter((r) => r.enabled).length}/{rules.length} enabled
            </span>
          </div>
        </div>

        <div className="divide-y divide-[rgba(212,175,55,0.08)]">
          {rules.map((rule) => {
            const isTesting = testRuleId === rule.id;
            const { error: regexError } = compileSafeRegex(rule.pattern, rule.flags);
            const matches = isTesting ? getTestMatches(rule) : [];

            return (
              <div key={rule.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#F3E5AB] text-sm">{rule.name}</span>
                      {rule.id.startsWith('builtin-') && (
                        <span className="rounded border border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.4)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#D4AF37] uppercase">
                          Built-in
                        </span>
                      )}
                      {!rule.enabled && (
                        <span className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[9px] text-stone-500">
                          Disabled
                        </span>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-[11px] text-stone-500">{rule.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <code className="rounded bg-[#09090B] border border-stone-800 px-2 py-0.5 font-mono text-[11px] text-stone-300">
                        /{rule.pattern}/{rule.flags}
                      </code>
                      <span className="rounded border border-[rgba(212,175,55,0.2)] bg-[rgba(74,14,23,0.3)] px-2 py-0.5 font-mono text-[11px] text-[#F3E5AB]">
                        {rule.maskLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTestRuleId(isTesting ? null : rule.id)}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${
                        isTesting
                          ? 'border-[#D4AF37] bg-[rgba(74,14,23,0.6)] text-[#F3E5AB]'
                          : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
                      }`}
                    >
                      <TestTube className="h-3.5 w-3.5" />
                      Test
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className="cursor-pointer text-[#D4AF37] transition hover:opacity-70"
                      title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                      {rule.enabled
                        ? <ToggleRight className="h-5 w-5" />
                        : <ToggleLeft className="h-5 w-5 text-stone-600" />}
                    </button>
                    {!rule.id.startsWith('builtin-') && (
                      <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        className="cursor-pointer text-stone-700 transition hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Test Panel */}
                {isTesting && (
                  <div className="mt-3 rounded-lg border border-[rgba(212,175,55,0.2)] bg-[#09090B] p-3">
                    <p className="mb-2 font-mono text-[11px] text-[#D4AF37]">Live Test Simulator</p>
                    <textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder={`Paste test text to match against /${rule.pattern}/${rule.flags}…`}
                      className="h-20 w-full resize-y rounded-md border border-stone-800 bg-[#111114] p-2 font-mono text-xs text-stone-200 placeholder-stone-600 focus:border-[rgba(212,175,55,0.4)] focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap items-start gap-2">
                      {regexError ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-rose-400">
                          <XCircle className="h-3.5 w-3.5" /> Invalid regex: {regexError}
                        </div>
                      ) : matches.length > 0 ? (
                        <>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" /> {matches.length} match{matches.length !== 1 ? 'es' : ''} found
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {matches.map((m, i) => (
                              <span
                                key={i}
                                className="rounded border border-[rgba(212,175,55,0.3)] bg-[rgba(74,14,23,0.5)] px-2 py-0.5 font-mono text-[11px] text-[#F3E5AB]"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : testInput ? (
                        <div className="font-mono text-[11px] text-stone-500">No matches in test input.</div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Rule Form */}
      <div className="vault-glass rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-[#D4AF37]" />
          <h2 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
            Add Custom Regex Rule
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-stone-500 uppercase">Rule Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Indian GSTIN"
              className="rounded-md border border-stone-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-stone-200 placeholder-stone-600 focus:border-[rgba(212,175,55,0.4)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-stone-500 uppercase">Regex Pattern *</label>
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              placeholder={`e.g. \\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\\b`}
              className="rounded-md border border-stone-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-stone-200 placeholder-stone-600 focus:border-[rgba(212,175,55,0.4)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-stone-500 uppercase">Flags</label>
            <input
              type="text"
              value={newFlags}
              onChange={(e) => setNewFlags(e.target.value)}
              placeholder="gi"
              className="rounded-md border border-stone-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-stone-200 placeholder-stone-600 focus:border-[rgba(212,175,55,0.4)] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-stone-500 uppercase">Mask Label</label>
            <select
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="rounded-md border border-stone-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-stone-200 focus:border-[rgba(212,175,55,0.4)] focus:outline-none"
            >
              {LABEL_SUGGESTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="font-mono text-[11px] text-stone-500 uppercase">Description (optional)</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description of what this pattern detects"
              className="rounded-md border border-stone-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-stone-200 placeholder-stone-600 focus:border-[rgba(212,175,55,0.4)] focus:outline-none"
            />
          </div>
        </div>

        {addError && (
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-rose-400">
            <XCircle className="h-3.5 w-3.5" /> {addError}
          </p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-[rgba(212,175,55,0.4)] bg-[#721422] px-4 py-2 text-xs font-semibold text-[#F3E5AB] transition hover:bg-[#9B1B30]"
        >
          <PlusCircle className="h-4 w-4 text-[#D4AF37]" />
          Add Rule to Engine
        </button>
      </div>
    </div>
  );
};
