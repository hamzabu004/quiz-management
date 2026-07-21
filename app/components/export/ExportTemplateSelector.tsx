import { Check, FileSpreadsheet, LayoutTemplate } from 'lucide-react';
import { EXPORT_TEMPLATE_LIST } from './export-templates';
import type { ExportFormat, ExportTemplateId } from './types';

type Props = {
  format: ExportFormat;
  selectedTemplateId: ExportTemplateId;
  disabled: boolean;
  onChange: (templateId: ExportTemplateId) => void;
};

export default function ExportTemplateSelector({ format, selectedTemplateId, disabled, onChange }: Props) {
  const isCsv = format === 'csv';

  return (
    <section className="mb-6 rounded-xl border border-lumina-border bg-lumina-container-low p-5 md:p-6" aria-labelledby="template-heading">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-lumina-primary">
            <LayoutTemplate size={14} /> Document template
          </span>
          <h2 id="template-heading" className="mt-1 text-xl font-semibold text-lumina-text">How should the exported paper look?</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-lumina-text-muted">
            Choose a layout by comparing the previews below. The selected layout is applied to PDF/Print, DOCX, and LaTeX exports.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-lumina-border bg-lumina-container-lowest px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-lumina-secondary">
          {EXPORT_TEMPLATE_LIST.length} templates available
        </span>
      </div>

      {isCsv && (
        <div className="mt-4 flex items-start gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <FileSpreadsheet size={15} className="mt-0.5 shrink-0" />
          CSV uses its standard data columns. Your template choice is kept and will apply when you switch to a document format.
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {EXPORT_TEMPLATE_LIST.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(template.id)}
              className={`group overflow-hidden rounded-lg border-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? 'border-lumina-primary bg-lumina-container-lowest shadow-sm'
                  : 'border-lumina-border bg-lumina-container-lowest hover:border-lumina-primary/45'
              }`}
            >
              <div className="relative border-b border-lumina-border bg-slate-200/70 p-4">
                <div className="mx-auto aspect-[1.414/1] max-w-[420px] overflow-hidden bg-white p-4 shadow-sm">
                  <div className="mb-2 border-b border-slate-200 pb-1.5 text-[7px] font-bold uppercase tracking-widest text-slate-500">Sample question paper</div>
                  {template.preview}
                </div>
                <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                  isSelected ? 'border-lumina-primary bg-lumina-primary text-white' : 'border-slate-300 bg-white text-transparent'
                }`}>
                  <Check size={14} strokeWidth={3} />
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-lumina-text">{template.name}</h3>
                  {isSelected && <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-lumina-primary">Selected</span>}
                </div>
                <p className="mt-1 font-mono text-[10px] text-lumina-secondary">{template.summary}</p>
                <p className="mt-2 text-xs leading-relaxed text-lumina-text-muted">{template.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
