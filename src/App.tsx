import React, { useMemo, useRef, useState } from 'react';
import { AuditExportFooter } from './components/AuditExportFooter';
import { ControlDeck } from './components/ControlDeck';
import { DiffViewer } from './components/DiffViewer';
import { Header } from './components/Header';
import { PseudonymDrawer } from './components/PseudonymDrawer';
import { TelemetryBar } from './components/TelemetryBar';
import { SAMPLE_NOISY_LOGS } from './data/sampleLogs';
import {
  type RedactionMode,
  clearPseudonymSession,
  createPseudonymSession,
  sanitizeText,
} from './engine/redactor';
import { DEFAULT_DETECTOR_TOGGLES } from './engine/redactor';
import type { DetectorToggles, PIIEntityType } from './engine/validators';

export const App: React.FC = () => {
  const [rawInput, setRawInput] = useState<string>('');
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<RedactionMode>('FULL');
  const [toggles, setToggles] = useState<DetectorToggles>({ ...DEFAULT_DETECTOR_TOGGLES });
  const [isPseudoDrawerOpen, setIsPseudoDrawerOpen] = useState<boolean>(false);
  const [purgeFlash, setPurgeFlash] = useState<boolean>(false);
  const [purgeEpoch, setPurgeEpoch] = useState<number>(0);

  // Volatile in-memory pseudonymization Map (never persisted to browser storage)
  const pseudonymSessionRef = useRef(createPseudonymSession());

  const sanitizationResult = useMemo(
    () => sanitizeText(rawInput, mode, toggles, pseudonymSessionRef.current),
    [rawInput, mode, toggles]
  );

  const lineCount = rawInput ? rawInput.split(/\r\n|\r|\n/).length : 0;
  const charCount = rawInput.length;

  const handleToggleDetector = (type: PIIEntityType) => {
    setToggles((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleLoadSample = () => {
    setSourceFileName(null);
    setRawInput(SAMPLE_NOISY_LOGS);
  };

  const handleFileLoaded = (content: string, fileName: string) => {
    setSourceFileName(fileName);
    setRawInput(content);
  };

  const handlePanicPurge = () => {
    clearPseudonymSession(pseudonymSessionRef.current);
    pseudonymSessionRef.current = createPseudonymSession();
    setRawInput('');
    setSourceFileName(null);
    setMode('FULL');
    setToggles({ ...DEFAULT_DETECTOR_TOGGLES });
    setIsPseudoDrawerOpen(false);
    setPurgeEpoch((prev) => prev + 1);
    setPurgeFlash(true);
    window.setTimeout(() => setPurgeFlash(false), 1600);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F5F4]">
      <Header
        onPanicPurge={handlePanicPurge}
        purgeFlash={purgeFlash}
        hasContent={rawInput.length > 0}
      />

      <main
        key={purgeEpoch}
        className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6"
      >
        <TelemetryBar
          totalRedacted={sanitizationResult.totalRedacted}
          counts={sanitizationResult.counts}
          luhnFalsePositivesIgnored={sanitizationResult.luhnFalsePositivesIgnored}
        />

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
          isPseudoDrawerOpen={isPseudoDrawerOpen}
          onTogglePseudoDrawer={() => setIsPseudoDrawerOpen((open) => !open)}
          pseudoCount={sanitizationResult.sessionMappings.length}
        />

        <PseudonymDrawer
          isOpen={isPseudoDrawerOpen}
          onClose={() => setIsPseudoDrawerOpen(false)}
          mappings={sanitizationResult.sessionMappings}
        />

        <DiffViewer
          rawInput={rawInput}
          sanitizedText={sanitizationResult.sanitizedText}
          entities={sanitizationResult.entities}
        />

        <AuditExportFooter
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
      </main>
    </div>
  );
};

export default App;
