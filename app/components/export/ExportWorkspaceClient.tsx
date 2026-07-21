"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import ExportControls from './ExportControls';
import ExportMcqCard from './ExportMcqCard';
import ExportPrompt from './ExportPrompt';
import ExportTemplateSelector from './ExportTemplateSelector';
import { applyAnswerPattern, moveMcq, parseAnswerPattern, shuffleMcqs } from './export-utils';
import { EXPORT_TEMPLATES } from './export-templates';
import type { ExportFormat, ExportMcq, ExportSubject, ExportTemplateId } from './types';

type Props = {
  subject: ExportSubject;
  initialMcqs: ExportMcq[];
  initialFormat: ExportFormat;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | null) {
  return `"${(value ?? '').replace(/"/g, '""')}"`;
}

export default function ExportWorkspaceClient({ subject, initialMcqs, initialFormat }: Props) {
  const [orderedMcqs, setOrderedMcqs] = useState(initialMcqs);
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [templateId, setTemplateId] = useState<ExportTemplateId>('standard');
  const [answerPattern, setAnswerPattern] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [promptMessage, setPromptMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleApplyPattern = () => {
    try {
      const pattern = parseAnswerPattern(answerPattern);
      setOrderedMcqs((current) => applyAnswerPattern(current, pattern));
      setMessage({
        type: 'success',
        text: `Applied ${pattern.join('')} to the first ${pattern.length} correct-option positions and randomized the remaining questions.`,
      });
    } catch (error) {
      setPromptMessage(error instanceof Error ? error.message : 'Unable to apply the answer pattern.');
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    setOrderedMcqs((current) => {
      const fromIndex = current.findIndex((mcq) => mcq.id === draggingId);
      const toIndex = current.findIndex((mcq) => mcq.id === targetId);
      return moveMcq(current, fromIndex, toIndex);
    });
    setDraggingId(null);
    setMessage(null);
  };

  const exportCsv = () => {
    const header = ['ID', 'Category', 'Stem', 'Option_A', 'Option_B', 'Option_C', 'Option_D', 'Correct_Answer', 'Explanation'];
    const rows = orderedMcqs.map((mcq) => [
      mcq.id,
      mcq.categoryName,
      mcq.questionStem,
      mcq.optionA,
      mcq.optionB,
      mcq.optionC,
      mcq.optionD,
      mcq.answer,
      mcq.explanation ?? '',
    ].map(escapeCsv).join(','));
    const csv = `\uFEFF${header.join(',')}\n${rows.join('\n')}`;
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'mcqs_export.csv');
  };

  const exportLatex = () => {
    const latex = EXPORT_TEMPLATES[templateId].renderLatexDocument(subject.subjectName, orderedMcqs);
    downloadBlob(new Blob([latex], { type: 'text/plain;charset=utf-8' }), 'mcqs_export.tex');
  };

  const exportPdf = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const documentToPrint = iframe.contentWindow?.document;
    if (!documentToPrint) {
      iframe.remove();
      throw new Error('Unable to open the print document.');
    }

    const questions = EXPORT_TEMPLATES[templateId].renderPrintQuestions(orderedMcqs);

    documentToPrint.open();
    documentToPrint.write(`
      <!doctype html>
      <html>
        <head>
          <title>${subject.subjectName} MCQs</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; line-height: 1.55; color: #111; }
            h1 { font-size: 20px; margin-bottom: 24px; }
            .question { margin-bottom: 26px; padding-left: 6px; page-break-inside: avoid; }
            .options { list-style-type: upper-alpha; margin-top: 10px; }
            .options li { margin-bottom: 7px; padding-left: 4px; }
            .answer-grid { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
            .answer-grid th, .answer-grid td { border: 1px solid #555; padding: 7px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
            .answer-grid th { background: #eee; font-size: 9px; }
            .answer-grid th:first-child, .answer-grid td:first-child { width: 25%; }
            .answer-grid th:last-child, .answer-grid td:last-child { width: 13%; }
            .answer-grid tr { page-break-inside: avoid; }
            .answer-circles { white-space: nowrap; text-align: center !important; font-size: 13px; letter-spacing: 1px; }
            @page { size: ${templateId === 'answer-grid' ? 'A4 landscape' : 'A4 portrait'}; margin: 12mm; }
          </style>
        </head>
        <body><h1>${subject.subjectName}</h1>${questions}</body>
      </html>
    `);
    documentToPrint.close();

    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => iframe.remove(), 1000);
    }, 500);
  };

  const exportDocx = async () => {
    const response = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: subject.id,
        templateId,
        questions: orderedMcqs.map((mcq) => ({
          id: mcq.id,
          optionA: mcq.optionA,
          optionB: mcq.optionB,
          optionC: mcq.optionC,
          optionD: mcq.optionD,
        })),
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'Failed to export DOCX.');
    }
    downloadBlob(await response.blob(), `export_${subject.subjectName.replace(/\s+/g, '_')}.docx`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      if (format === 'csv') exportCsv();
      if (format === 'pdf') exportPdf();
      if (format === 'latex') exportLatex();
      if (format === 'docx') await exportDocx();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to export questions.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-6 md:p-8">
      {promptMessage && <ExportPrompt message={promptMessage} onClose={() => setPromptMessage(null)} />}
      <Link
        href={`/subject/${subject.id}`}
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-lumina-secondary transition-colors hover:text-lumina-primary"
      >
        <ArrowLeft size={14} />
        Back to Question Bank
      </Link>

      <div className="mb-7">
        <div className="font-mono text-[10px] uppercase tracking-widest text-lumina-text-muted">
          {subject.classroomName} / {subject.subjectName}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-lumina-text">Export Workspace</h1>
        <p className="mt-2 max-w-2xl text-sm text-lumina-secondary">
          Set the final question order once, then export the same arrangement in any available format.
        </p>
      </div>

      <ExportTemplateSelector
        format={format}
        selectedTemplateId={templateId}
        disabled={isExporting}
        onChange={setTemplateId}
      />

      {message && (
        <div className={`mb-5 flex items-start justify-between gap-3 rounded border px-4 py-3 text-sm ${
          message.type === 'error'
            ? 'border-red-400 bg-red-50 text-red-700'
            : 'border-emerald-400 bg-emerald-50 text-emerald-700'
        }`}>
          <span className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
            {message.text}
          </span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ExportControls
          format={format}
          pattern={answerPattern}
          questionCount={orderedMcqs.length}
          isExporting={isExporting}
          onFormatChange={setFormat}
          onPatternChange={setAnswerPattern}
          onApplyPattern={handleApplyPattern}
          onShuffleAll={() => {
            setOrderedMcqs((current) => shuffleMcqs(current));
            setMessage({ type: 'success', text: 'Shuffled all selected questions.' });
          }}
          onReset={() => {
            setOrderedMcqs(initialMcqs);
            setMessage({ type: 'success', text: 'Restored the original selection order.' });
          }}
          onExport={() => void handleExport()}
        />

        <section className="min-w-0">
          <div className="mb-4 rounded-lg border border-lumina-border bg-lumina-container-low px-4 py-3">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-lumina-text-muted">Current answer sequence</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {orderedMcqs.map((mcq, index) => (
                <span key={mcq.id} className="rounded border border-lumina-border bg-lumina-container-lowest px-2 py-1 font-mono text-[10px] text-lumina-text">
                  {index + 1}:{mcq.answer.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {orderedMcqs.map((mcq, index) => (
              <ExportMcqCard
                key={mcq.id}
                mcq={mcq}
                index={index}
                total={orderedMcqs.length}
                isDragging={draggingId === mcq.id}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
                onDrop={handleDrop}
                onMove={(fromIndex, toIndex) => {
                  setOrderedMcqs((current) => moveMcq(current, fromIndex, toIndex));
                  setMessage(null);
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
