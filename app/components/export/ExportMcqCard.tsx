import type { DragEvent } from 'react';
import { ArrowDown, ArrowUp, Check, GripVertical } from 'lucide-react';
import { formatLaTeX } from '../../../src/utils';
import type { ExportMcq } from './types';

type Props = {
  mcq: ExportMcq;
  index: number;
  total: number;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
};

export default function ExportMcqCard({
  mcq,
  index,
  total,
  isDragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onMove,
}: Props) {
  const options = [
    { label: 'A', text: mcq.optionA },
    { label: 'B', text: mcq.optionB },
    { label: 'C', text: mcq.optionC },
    { label: 'D', text: mcq.optionD },
  ];

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', mcq.id);
    onDragStart(mcq.id);
  };

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(mcq.id);
      }}
      className={`rounded-lg border bg-lumina-container-low p-5 transition-all ${
        isDragging
          ? 'scale-[0.99] border-lumina-primary opacity-50'
          : 'border-lumina-border hover:border-lumina-primary/40'
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <GripVertical size={18} className="shrink-0 cursor-grab text-lumina-text-muted active:cursor-grabbing" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-lumina-primary">
          Question {index + 1}
        </span>
        <span className="rounded bg-lumina-container-highest px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-lumina-text-variant">
          {mcq.categoryName}
        </span>
        <span className="ml-auto rounded border border-lumina-primary/30 bg-lumina-primary/10 px-2 py-1 font-mono text-[10px] font-bold text-lumina-primary">
          {mcq.answer.toUpperCase()}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            className="rounded border border-lumina-border p-1 text-lumina-secondary hover:text-lumina-primary disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Move question ${index + 1} up`}
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={index === total - 1}
            className="rounded border border-lumina-border p-1 text-lumina-secondary hover:text-lumina-primary disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Move question ${index + 1} down`}
          >
            <ArrowDown size={13} />
          </button>
        </div>
      </div>

      <div
        className="mb-4 text-sm font-medium leading-relaxed text-lumina-text"
        dangerouslySetInnerHTML={{ __html: formatLaTeX(mcq.questionStem) }}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {options.map((option) => {
          const isCorrect = mcq.answer.toUpperCase() === option.label;
          return (
            <div
              key={option.label}
              className={`flex items-start gap-2 rounded border p-2.5 text-xs ${
                isCorrect
                  ? 'border-lumina-primary bg-lumina-primary/5 text-lumina-primary'
                  : 'border-lumina-border bg-lumina-container-lowest text-lumina-secondary'
              }`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[10px] font-bold ${
                isCorrect
                  ? 'border-lumina-primary bg-lumina-primary text-lumina-on-primary'
                  : 'border-lumina-border text-lumina-text-muted'
              }`}>
                {option.label}
              </span>
              <span dangerouslySetInnerHTML={{ __html: formatLaTeX(option.text) }} />
              {isCorrect && <Check size={13} className="ml-auto shrink-0" />}
            </div>
          );
        })}
      </div>
    </article>
  );
}
