import React, { useMemo, useRef } from 'react';
import { Eye, ShieldCheck } from 'lucide-react';
import type { DetectedEntity } from '../engine/redactor';

interface DiffViewerProps {
  rawInput: string;
  sanitizedText: string;
  entities: DetectedEntity[];
}

interface Segment {
  kind: 'text' | 'entity';
  content: string;
  entity?: DetectedEntity;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  rawInput,
  sanitizedText,
  entities,
}) => {
  const leftPaneRef = useRef<HTMLDivElement | null>(null);
  const rightPaneRef = useRef<HTMLDivElement | null>(null);
  const syncLockRef = useRef<'left' | 'right' | null>(null);

  const handleSyncScroll = (source: 'left' | 'right') => {
    if (syncLockRef.current && syncLockRef.current !== source) {
      return;
    }
    const sourceEl = source === 'left' ? leftPaneRef.current : rightPaneRef.current;
    const targetEl = source === 'left' ? rightPaneRef.current : leftPaneRef.current;
    if (!sourceEl || !targetEl) return;

    syncLockRef.current = source;

    const maxSourceScroll = Math.max(1, sourceEl.scrollHeight - sourceEl.clientHeight);
    const maxTargetScroll = Math.max(0, targetEl.scrollHeight - targetEl.clientHeight);
    const ratio = sourceEl.scrollTop / maxSourceScroll;
    targetEl.scrollTop = ratio * maxTargetScroll;
    targetEl.scrollLeft = sourceEl.scrollLeft;

    window.requestAnimationFrame(() => {
      syncLockRef.current = null;
    });
  };

  const { annotatedSegments, sanitizedSegments } = useMemo(() => {
    if (!rawInput) {
      return { annotatedSegments: [] as Segment[], sanitizedSegments: [] as Segment[] };
    }

    const left: Segment[] = [];
    const right: Segment[] = [];
    let cursor = 0;

    for (const entity of entities) {
      if (entity.start > cursor) {
        const plain = rawInput.slice(cursor, entity.start);
        left.push({ kind: 'text', content: plain });
        right.push({ kind: 'text', content: plain });
      }
      left.push({ kind: 'entity', content: entity.value, entity });
      right.push({ kind: 'entity', content: entity.replacement, entity });
      cursor = entity.end;
    }

    if (cursor < rawInput.length) {
      const tail = rawInput.slice(cursor);
      left.push({ kind: 'text', content: tail });
      right.push({ kind: 'text', content: tail });
    }

    return { annotatedSegments: left, sanitizedSegments: right };
  }, [rawInput, entities]);

  return (
    <section aria-label="Side-by-Side Diff Viewer" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Left Pane: Annotated Source */}
      <div className="vault-glass flex flex-col overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/20 bg-[#111114] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#D4AF37]" />
            <h2 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
              Annotated Source
            </h2>
          </div>
          <span className="font-mono text-[11px] text-stone-400">
            {entities.length} PII highlights
          </span>
        </div>

        <div
          ref={leftPaneRef}
          onScroll={() => handleSyncScroll('left')}
          data-testid="annotated-source-pane"
          className="h-[420px] overflow-auto bg-[#09090B]/95 p-4 font-mono text-xs leading-6 whitespace-pre-wrap break-words text-stone-300"
        >
          {rawInput.length === 0 ? (
            <span className="text-stone-500">
              Awaiting input stream. Paste text, upload a .txt/.csv file, or click &ldquo;Load Sample Noisy Data&rdquo;.
            </span>
          ) : (
            annotatedSegments.map((seg, idx) =>
              seg.kind === 'entity' && seg.entity ? (
                <span
                  key={`${seg.entity.id}-${idx}`}
                  data-entity-type={seg.entity.type}
                  title={`${seg.entity.type}${seg.entity.subType ? ` (${seg.entity.subType})` : ''}${seg.entity.metadata ? ` — ${seg.entity.metadata}` : ''}`}
                  className="group relative inline-block cursor-help rounded border border-[#D4AF37]/45 bg-[#4A0E17] px-1.5 py-0.5 font-medium text-[#F3E5AB] shadow-[0_0_10px_rgba(74,14,23,0.75)] transition hover:border-[#D4AF37] hover:bg-[#721422]"
                >
                  {seg.content}
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 rounded-md border border-[#D4AF37]/50 bg-[#111114] px-2.5 py-1 text-[10px] whitespace-nowrap text-[#F3E5AB] shadow-xl group-hover:block">
                    <span className="font-bold text-[#D4AF37]">{seg.entity.type}</span>
                    {seg.entity.subType ? ` • ${seg.entity.subType}` : ''}
                    {seg.entity.metadata ? ` (${seg.entity.metadata})` : ''}
                  </span>
                </span>
              ) : (
                <React.Fragment key={`txt-${idx}`}>{seg.content}</React.Fragment>
              )
            )
          )}
        </div>
      </div>

      {/* Right Pane: Sanitized Output */}
      <div className="vault-glass flex flex-col overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/20 bg-[#111114] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            <h2 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
              Sanitized Output
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#D4AF37]">
            Synchronized Preview
          </span>
        </div>

        <div
          ref={rightPaneRef}
          onScroll={() => handleSyncScroll('right')}
          data-testid="sanitized-output-pane"
          className="h-[420px] overflow-auto bg-[#09090B]/95 p-4 font-mono text-xs leading-6 whitespace-pre-wrap break-words text-stone-200"
        >
          {sanitizedText.length === 0 ? (
            <span className="text-stone-500">
              Sanitized output will appear here instantaneously.
            </span>
          ) : (
            sanitizedSegments.map((seg, idx) =>
              seg.kind === 'entity' && seg.entity ? (
                <span
                  key={`out-${seg.entity.id}-${idx}`}
                  data-sanitized-type={seg.entity.type}
                  className="inline-block rounded border border-[#D4AF37]/35 bg-[#18181B] px-1.5 py-0.5 font-semibold text-[#D4AF37]"
                >
                  {seg.content}
                </span>
              ) : (
                <React.Fragment key={`out-txt-${idx}`}>{seg.content}</React.Fragment>
              )
            )
          )}
        </div>
      </div>
    </section>
  );
};
