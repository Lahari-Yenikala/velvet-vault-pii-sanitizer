import React, { useMemo, useRef, useState } from 'react';
import { Eye, Filter, Hash, ShieldCheck } from 'lucide-react';
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
  lineIdx?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ rawInput, sanitizedText, entities }) => {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const syncLock = useRef<'left' | 'right' | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const entityTypes = useMemo(
    () => ['ALL', ...Array.from(new Set(entities.map((e) => e.type)))],
    [entities]
  );

  const filteredEntities = useMemo(() => {
    return entities.filter((e) => {
      if (filterType !== 'ALL' && e.type !== filterType) return false;
      if (searchTerm && !e.value.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [entities, filterType, searchTerm]);

  const { annotated, sanitized } = useMemo(() => {
    if (!rawInput) return { annotated: [] as Segment[], sanitized: [] as Segment[] };
    const left: Segment[] = [];
    const right: Segment[] = [];
    let cursor = 0;

    const ents = filteredEntities.length < entities.length ? entities : filteredEntities;

    for (const entity of ents) {
      if (entity.start > cursor) {
        const plain = rawInput.slice(cursor, entity.start);
        left.push({ kind: 'text', content: plain });
        right.push({ kind: 'text', content: plain });
      }
      const show = filteredEntities.includes(entity);
      if (show) {
        left.push({ kind: 'entity', content: entity.value, entity });
        right.push({ kind: 'entity', content: entity.replacement, entity });
      } else {
        left.push({ kind: 'text', content: entity.value });
        right.push({ kind: 'text', content: entity.replacement });
      }
      cursor = entity.end;
    }

    if (cursor < rawInput.length) {
      const tail = rawInput.slice(cursor);
      left.push({ kind: 'text', content: tail });
      right.push({ kind: 'text', content: tail });
    }

    return { annotated: left, sanitized: right };
  }, [rawInput, filteredEntities, entities]);

  const lineNumbers = useMemo(() => {
    if (!rawInput) return 1;
    return rawInput.split(/\r\n|\r|\n/).length;
  }, [rawInput]);

  const handleScroll = (source: 'left' | 'right') => {
    if (syncLock.current && syncLock.current !== source) return;
    const src = source === 'left' ? leftRef.current : rightRef.current;
    const tgt = source === 'left' ? rightRef.current : leftRef.current;
    if (!src || !tgt) return;
    syncLock.current = source;
    const maxSrc = Math.max(1, src.scrollHeight - src.clientHeight);
    const maxTgt = Math.max(0, tgt.scrollHeight - tgt.clientHeight);
    tgt.scrollTop = (src.scrollTop / maxSrc) * maxTgt;
    tgt.scrollLeft = src.scrollLeft;
    requestAnimationFrame(() => { syncLock.current = null; });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter Bar */}
      <div className="vault-glass flex flex-wrap items-center gap-3 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
          <Filter className="h-3.5 w-3.5 text-[#D4AF37]" />
          <span>Filter Highlights</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {entityTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium transition ${
                filterType === t
                  ? 'border-[#D4AF37] bg-[#4A0E17] text-[#F3E5AB]'
                  : 'border-stone-700 bg-transparent text-stone-500 hover:border-stone-500 hover:text-stone-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in diff…"
            className="rounded-md border border-stone-700 bg-[#09090B] px-2.5 py-1 font-mono text-[11px] text-stone-200 placeholder-stone-600 focus:border-[rgba(212,175,55,0.5)] focus:outline-none"
          />
        </div>
      </div>

      {/* Side-by-Side Panes */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: Annotated Source */}
        <div className="vault-glass flex flex-col overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-[rgba(212,175,55,0.2)] bg-[#111114] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#D4AF37]" />
              <h2 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
                Annotated Source
              </h2>
            </div>
            <span className="font-mono text-[11px] text-stone-400">
              {entities.length} PII entities
            </span>
          </div>
          <div className="flex h-[480px] overflow-hidden">
            {/* Line numbers */}
            <div
              className="select-none overflow-hidden border-r border-[rgba(212,175,55,0.1)] bg-[rgba(17,17,20,0.6)] px-2 py-4 text-right font-mono text-[11px] leading-6 text-stone-700"
              style={{ minWidth: '3rem' }}
            >
              {Array.from({ length: lineNumbers }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div
              ref={leftRef}
              onScroll={() => handleScroll('left')}
              data-testid="annotated-source-pane"
              className="flex-1 overflow-auto bg-[#09090B]/95 p-4 font-mono text-xs leading-6 whitespace-pre-wrap break-words text-stone-300"
            >
              {rawInput.length === 0 ? (
                <span className="text-stone-500">
                  Awaiting input stream — paste text, upload a file, or choose a sample preset above.
                </span>
              ) : (
                annotated.map((seg, idx) =>
                  seg.kind === 'entity' && seg.entity ? (
                    <span
                      key={`a-${seg.entity.id}-${idx}`}
                      data-entity-type={seg.entity.type}
                      title={`${seg.entity.type}${seg.entity.subType ? ` (${seg.entity.subType})` : ''}${seg.entity.metadata ? ` — ${seg.entity.metadata}` : ''}`}
                      className="group relative inline-block cursor-help rounded border border-[rgba(212,175,55,0.5)] bg-[#4A0E17] px-1.5 py-0.5 font-medium text-[#F3E5AB] shadow-[0_0_8px_rgba(74,14,23,0.7)] transition hover:border-[#D4AF37] hover:bg-[#721422]"
                    >
                      {seg.content}
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden min-w-max -translate-x-1/2 rounded-md border border-[rgba(212,175,55,0.4)] bg-[#111114] px-2.5 py-1.5 text-[10px] leading-5 text-[#F3E5AB] shadow-2xl group-hover:block">
                        <span className="font-bold text-[#D4AF37]">{seg.entity.type}</span>
                        {seg.entity.subType ? ` • ${seg.entity.subType}` : ''}
                        {'\n'}
                        {seg.entity.metadata ?? ''}
                      </span>
                    </span>
                  ) : (
                    <React.Fragment key={`a-txt-${idx}`}>{seg.content}</React.Fragment>
                  )
                )
              )}
            </div>
          </div>
        </div>

        {/* Right: Sanitized Output */}
        <div className="vault-glass flex flex-col overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-[rgba(212,175,55,0.2)] bg-[#111114] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
              <h2 className="text-xs font-semibold tracking-wider text-[#F3E5AB] uppercase">
                Sanitized Output
              </h2>
            </div>
            <span className="flex items-center gap-1 font-mono text-[11px] text-[#D4AF37]">
              <Hash className="h-3 w-3" />
              Synchronized
            </span>
          </div>
          <div className="flex h-[480px] overflow-hidden">
            <div
              className="select-none overflow-hidden border-r border-[rgba(212,175,55,0.1)] bg-[rgba(17,17,20,0.6)] px-2 py-4 text-right font-mono text-[11px] leading-6 text-stone-700"
              style={{ minWidth: '3rem' }}
            >
              {Array.from({ length: lineNumbers }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div
              ref={rightRef}
              onScroll={() => handleScroll('right')}
              data-testid="sanitized-output-pane"
              className="flex-1 overflow-auto bg-[#09090B]/95 p-4 font-mono text-xs leading-6 whitespace-pre-wrap break-words text-stone-200"
            >
              {sanitizedText.length === 0 ? (
                <span className="text-stone-500">Sanitized output appears here instantaneously.</span>
              ) : (
                sanitized.map((seg, idx) =>
                  seg.kind === 'entity' && seg.entity ? (
                    <span
                      key={`s-${seg.entity.id}-${idx}`}
                      data-sanitized-type={seg.entity.type}
                      className="inline-block rounded border border-[rgba(212,175,55,0.3)] bg-[#18181B] px-1.5 py-0.5 font-semibold text-[#D4AF37]"
                    >
                      {seg.content}
                    </span>
                  ) : (
                    <React.Fragment key={`s-txt-${idx}`}>{seg.content}</React.Fragment>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
