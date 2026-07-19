import { Download, LoaderCircle, RotateCcw, Shuffle } from 'lucide-react';
import type { ExportFormat } from './types';

type Props = {
  format: ExportFormat;
  pattern: string;
  questionCount: number;
  isExporting: boolean;
  onFormatChange: (format: ExportFormat) => void;
  onPatternChange: (pattern: string) => void;
  onApplyPattern: () => void;
  onShuffleAll: () => void;
  onReset: () => void;
  onExport: () => void;
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: 'CSV Spreadsheet',
  pdf: 'PDF / Print',
  latex: 'LaTeX',
  docx: 'DOCX',
};

export default function ExportControls({
  format,
  pattern,
  questionCount,
  isExporting,
  onFormatChange,
  onPatternChange,
  onApplyPattern,
  onShuffleAll,
  onReset,
  onExport,
}: Props) {
  return (
    <aside className="space-y-5 rounded-lg border border-lumina-border bg-lumina-container-low p-5 lg:sticky lg:top-6">
      <div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-lumina-primary">Export setup</span>
        <h2 className="mt-1 text-lg font-semibold text-lumina-text">Arrange your question paper</h2>
        <p className="mt-1 text-xs leading-relaxed text-lumina-text-muted">
          Drag cards into question order, then set where each question's correct option should appear.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-lumina-text">Export format</span>
        <select
          value={format}
          onChange={(event) => onFormatChange(event.target.value as ExportFormat)}
          disabled={isExporting}
          className="w-full rounded border border-lumina-border bg-lumina-container-lowest px-3 py-2.5 text-sm text-lumina-text outline-none focus:border-lumina-primary focus:ring-1 focus:ring-lumina-primary disabled:opacity-60"
        >
          {Object.entries(FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <div className="border-t border-lumina-border pt-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-lumina-text">Answer pattern</span>
          <input
            type="text"
            value={pattern}
            onChange={(event) => onPatternChange(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onApplyPattern();
            }}
            placeholder="Example: ABCDAB"
            disabled={isExporting}
            className="w-full rounded border border-lumina-border bg-lumina-container-lowest px-3 py-2.5 font-mono text-sm uppercase tracking-widest text-lumina-text placeholder:normal-case placeholder:tracking-normal placeholder:text-lumina-text-muted outline-none focus:border-lumina-primary focus:ring-1 focus:ring-lumina-primary disabled:opacity-60"
          />
        </label>
        <p className="mt-2 text-[11px] leading-relaxed text-lumina-text-muted">
          BAB places Question 1's correct option at B, Question 2's at A, and Question 3's at B. Remaining questions and their options are shuffled.
        </p>
        <button
          type="button"
          onClick={onApplyPattern}
          disabled={isExporting}
          className="mt-3 w-full rounded bg-lumina-primary px-3 py-2.5 text-sm font-semibold text-lumina-on-primary transition-colors hover:bg-lumina-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Apply Answer Pattern
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-lumina-border pt-5">
        <button
          type="button"
          onClick={onShuffleAll}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 rounded border border-lumina-border bg-lumina-container-lowest px-3 py-2 text-xs font-semibold text-lumina-secondary hover:text-lumina-primary disabled:opacity-60"
        >
          <Shuffle size={14} />
          Shuffle All
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 rounded border border-lumina-border bg-lumina-container-lowest px-3 py-2 text-xs font-semibold text-lumina-secondary hover:text-lumina-primary disabled:opacity-60"
        >
          <RotateCcw size={14} />
          Reset Order
        </button>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={isExporting || questionCount === 0}
        className="flex w-full items-center justify-center gap-2 rounded bg-lumina-primary px-4 py-3 text-sm font-semibold text-lumina-on-primary transition-colors hover:bg-lumina-primary-hover disabled:cursor-wait disabled:opacity-60"
      >
        {isExporting ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
        {isExporting ? 'Preparing export…' : `Export ${FORMAT_LABELS[format]} (${questionCount})`}
      </button>
    </aside>
  );
}
