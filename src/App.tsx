import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Engine
import {
  DEFAULT_CUSTOM_RULES,
  DEFAULT_DETECTOR_TOGGLES,
  type CustomRule,
  type RedactionMode,
  clearPseudonymSession,
  createPseudonymSession,
  sanitizeText,
} from './engine/redactor';
import type { DetectorToggles, PIIEntityType } from './engine/validators';

// Data
import { SAMPLE_NOISY_LOGS, SAMPLE_PRESETS, type SamplePreset } from './data/sampleLogs';

// Components
import { type TabId, Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RiskGauge } from './components/RiskGauge';
import { DiffViewer } from './components/DiffViewer';
import { BatchProcessor } from './components/BatchProcessor';
import { RegexStudio } from './components/RegexStudio';
import { ComplianceAuditLog } from './components/ComplianceAuditLog';
import { TelemetryBar } from './components/TelemetryBar';
import { PseudonymDrawer } from './components/PseudonymDrawer';
import { ArchitecturePipeline } from './components/ArchitecturePipeline';
import { EnterpriseFooter } from './components/EnterpriseFooter';

// Legacy inline control deck for Studio tab
import { ControlDeck } from './components/ControlDeck';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('studio');
  const [rawInput, setRawInput] = useState('');
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<RedactionMode>('FULL');
  const [toggles, setToggles] = useState<DetectorToggles>({ ...DEFAULT_DETECTOR_TOGGLES });
  const [customRules, setCustomRules] = useState<CustomRule[]>([...DEFAULT_CUSTOM_RULES]);
  const [isPseudoOpen, setIsPseudoOpen] = useState(false);
  const [purgeFlash, setPurgeFlash] = useState(false);
  const [purgeEpoch, setPurgeEpoch] = useState(0);

  const sessionRef = useRef(createPseudonymSession());

  const sanitizationResult = useMemo(
    () => sanitizeText(rawInput, mode, toggles, sessionRef.current, customRules),
    [rawInput, mode, toggles, customRules]
  );

  const lineCount = rawInput ? rawInput.split(/\r\n|\r|\n/).length : 0;
  const charCount = rawInput.length;

  const handlePanicPurge = useCallback(() => {
    clearPseudonymSession(sessionRef.current);
    sessionRef.current = createPseudonymSession();
    setRawInput('');
    setSourceFileName(null);
    setMode('FULL');
    setToggles({ ...DEFAULT_DETECTOR_TOGGLES });
    setCustomRules([...DEFAULT_CUSTOM_RULES]);
    setIsPseudoOpen(false);
    setPurgeEpoch((p) => p + 1);
    setPurgeFlash(true);
    setTimeout(() => setPurgeFlash(false), 1600);
  }, []);

  const handleLoadPreset = useCallback((preset: SamplePreset) => {
    setRawInput(preset.content);
    setSourceFileName(preset.fileName);
  }, []);

  const handleLoadSample = useCallback(() => {
    setRawInput(SAMPLE_NOISY_LOGS);
    setSourceFileName(null);
  }, []);

  const handleFileLoaded = useCallback((content: string, name: string) => {
    setRawInput(content);
    setSourceFileName(name);
  }, []);

  const handleToggleDetector = useCallback((type: PIIEntityType) => {
    if (type === 'CUSTOM') return;
    setToggles((prev) => ({ ...prev, [type]: !prev[type as keyof DetectorToggles] }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlePanicPurge();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePanicPurge]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F4]" key={purgeEpoch}>
      {/* Sticky Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPanicPurge={handlePanicPurge}
        purgeFlash={purgeFlash}
        hasContent={rawInput.length > 0}
      />

      {/* Hero Section */}
      <HeroSection
        presets={SAMPLE_PRESETS}
        onLoadPreset={handleLoadPreset}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Workspace */}
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        {/* Telemetry Strip (always visible) */}
        <TelemetryBar
          totalRedacted={sanitizationResult.totalRedacted}
          counts={sanitizationResult.counts}
          luhnFalsePositivesIgnored={sanitizationResult.luhnFalsePositivesIgnored}
        />

        {/* Tab 1: Sanitizer Studio */}
        {activeTab === 'studio' && (
          <div className="mt-5 flex flex-col gap-5">
            {/* Control Deck */}
            <ControlDeck
              rawInput={rawInput}
              onRawInputChange={setRawInput}
              mode={mode}
              onModeChange={setMode}
              toggles={toggles}
              onToggleDetector={handleToggleDetector}
              onLoadSample={handleLoadSample}
              onFileLoaded={handleFileLoaded}
              sourceFileName={sourceFileName}
              onClearFileBadge={() => setSourceFileName(null)}
              isPseudoDrawerOpen={isPseudoOpen}
              onTogglePseudoDrawer={() => setIsPseudoOpen((o) => !o)}
              pseudoCount={sanitizationResult.sessionMappings.length}
            />

            {/* PII Risk Gauge */}
            <RiskGauge risk={sanitizationResult.risk} />

            {/* Pseudonym Drawer */}
            <PseudonymDrawer
              isOpen={isPseudoOpen}
              onClose={() => setIsPseudoOpen(false)}
              mappings={sanitizationResult.sessionMappings}
            />

            {/* Side-by-Side Diff Viewer */}
            <DiffViewer
              rawInput={rawInput}
              sanitizedText={sanitizationResult.sanitizedText}
              entities={sanitizationResult.entities}
            />
          </div>
        )}

        {/* Tab 2: Batch Processor */}
        {activeTab === 'batch' && (
          <div className="mt-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#F3E5AB]">Batch Multi-File Processor</h2>
              <p className="text-xs text-stone-500 mt-1">
                Sanitize multiple files simultaneously — all processing is in volatile browser RAM. Active redaction mode: <span className="text-[#D4AF37] font-mono">{mode}</span>
              </p>
            </div>
            <BatchProcessor mode={mode} />
          </div>
        )}

        {/* Tab 3: Custom Regex Studio */}
        {activeTab === 'regex' && (
          <div className="mt-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#F3E5AB]">Custom Pattern & Regex Studio</h2>
              <p className="text-xs text-stone-500 mt-1">
                Add custom detection rules. Active rules are applied alongside built-in PII detectors in the Sanitizer Studio.
              </p>
            </div>
            <RegexStudio rules={customRules} onRulesChange={setCustomRules} />
          </div>
        )}

        {/* Tab 4: Compliance Audit Log */}
        {activeTab === 'audit' && (
          <div className="mt-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#F3E5AB]">Security & Compliance Audit Log</h2>
              <p className="text-xs text-stone-500 mt-1">
                Full zero-PII telemetry, risk assessment, and regulatory compliance coverage — no raw sensitive data is ever stored or exported.
              </p>
            </div>
            <ComplianceAuditLog
              result={sanitizationResult}
              mode={mode}
              toggles={toggles}
              lineCount={lineCount}
              charCount={charCount}
              sourceFileName={sourceFileName}
            />
          </div>
        )}
      </main>

      {/* Architecture Pipeline Section */}
      <ArchitecturePipeline />

      {/* Enterprise Footer */}
      <EnterpriseFooter
        sanitizedText={sanitizationResult.sanitizedText}
        sourceFileName={sourceFileName}
        mode={mode}
        toggles={toggles}
        totalRedacted={sanitizationResult.totalRedacted}
        counts={sanitizationResult.counts}
        luhnFalsePositivesIgnored={sanitizationResult.luhnFalsePositivesIgnored}
        lineCount={lineCount}
        charCount={charCount}
      />
    </div>
  );
};

export default App;
