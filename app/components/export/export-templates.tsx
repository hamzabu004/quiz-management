import type { ReactNode } from 'react';
import { formatLaTeX } from '../../../src/utils';
import type { ExportMcq, ExportTemplateId } from './types';

type ExportTemplate = {
  id: ExportTemplateId;
  name: string;
  description: string;
  summary: string;
  preview: ReactNode;
  renderPrintQuestions: (mcqs: ExportMcq[]) => string;
  renderLatexDocument: (subjectName: string, mcqs: ExportMcq[]) => string;
};

const stripHtml = (text: string) => text.replace(/<[^>]+>/g, '').trim();

function escapeLatex(text: string) {
  const plainText = stripHtml(text);
  const mathPattern = /(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\$[^$]*?\$)/g;
  return plainText.split(mathPattern).map((part, index) => {
    if (index % 2 === 1) return part;
    return part
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([{}#$%&_])/g, '\\$1')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/~/g, '\\textasciitilde{}');
  }).join('');
}

const standardPreview = (
  <div className="space-y-2.5 text-[7px] leading-relaxed text-slate-700">
    <div>
      <p><strong>1.</strong> Which organelle produces most cellular ATP?</p>
      <div className="ml-3 mt-1 space-y-0.5">
        <p>A. Nucleus</p><p>B. Mitochondrion</p><p>C. Ribosome</p><p>D. Golgi apparatus</p>
      </div>
    </div>
    <div>
      <p><strong>2.</strong> Which gas is most abundant in the atmosphere?</p>
      <div className="ml-3 mt-1 space-y-0.5">
        <p>A. Oxygen</p><p>B. Carbon dioxide</p><p>C. Nitrogen</p><p>D. Hydrogen</p>
      </div>
    </div>
  </div>
);

const answerGridPreview = (
  <table className="w-full table-fixed border-collapse text-[5px] leading-tight text-slate-700">
    <thead>
      <tr className="bg-slate-100 font-bold">
        {['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Answer'].map((heading, index) => (
          <th key={heading} className={`border border-slate-300 p-1 text-left ${index === 0 ? 'w-[28%]' : ''}`}>{heading}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="border border-slate-300 p-1">1. Which organelle produces ATP?</td>
        <td className="border border-slate-300 p-1">Nucleus</td>
        <td className="border border-slate-300 p-1">Mitochondrion</td>
        <td className="border border-slate-300 p-1">Ribosome</td>
        <td className="border border-slate-300 p-1">Golgi</td>
        <td className="border border-slate-300 p-1 text-center"><span className="whitespace-nowrap">Ⓐ Ⓑ Ⓒ Ⓓ</span></td>
      </tr>
      <tr>
        <td className="border border-slate-300 p-1">2. Most abundant atmospheric gas?</td>
        <td className="border border-slate-300 p-1">Oxygen</td>
        <td className="border border-slate-300 p-1">Carbon dioxide</td>
        <td className="border border-slate-300 p-1">Nitrogen</td>
        <td className="border border-slate-300 p-1">Hydrogen</td>
        <td className="border border-slate-300 p-1 text-center"><span className="whitespace-nowrap">Ⓐ Ⓑ Ⓒ Ⓓ</span></td>
      </tr>
    </tbody>
  </table>
);

function renderStandardPrint(mcqs: ExportMcq[]) {
  return `<ol class="questions">${mcqs.map((mcq) => `
    <li class="question">
      <div>${formatLaTeX(mcq.questionStem)}</div>
      <ol class="options">
        <li>${formatLaTeX(mcq.optionA)}</li>
        <li>${formatLaTeX(mcq.optionB)}</li>
        <li>${formatLaTeX(mcq.optionC)}</li>
        <li>${formatLaTeX(mcq.optionD)}</li>
      </ol>
    </li>`).join('')}</ol>`;
}

function renderGridPrint(mcqs: ExportMcq[]) {
  return `<table class="answer-grid">
    <thead><tr><th>Question</th><th>Option A</th><th>Option B</th><th>Option C</th><th>Option D</th><th>Answer</th></tr></thead>
    <tbody>${mcqs.map((mcq, index) => `<tr>
      <td><strong>${index + 1}.</strong> ${formatLaTeX(mcq.questionStem)}</td>
      <td>${formatLaTeX(mcq.optionA)}</td>
      <td>${formatLaTeX(mcq.optionB)}</td>
      <td>${formatLaTeX(mcq.optionC)}</td>
      <td>${formatLaTeX(mcq.optionD)}</td>
      <td class="answer-circles"><span>Ⓐ</span><span>Ⓑ</span><span>Ⓒ</span><span>Ⓓ</span></td>
    </tr>`).join('')}</tbody>
  </table>`;
}

function standardLatex(subjectName: string, mcqs: ExportMcq[]) {
  let latex = '\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath,amssymb}\n';
  latex += '\\begin{document}\n\\section*{' + escapeLatex(subjectName) + '}\n\\begin{enumerate}\n';
  mcqs.forEach((mcq) => {
    latex += `  \\item ${escapeLatex(mcq.questionStem)}\n  \\begin{enumerate}\n`;
    latex += `    \\item ${escapeLatex(mcq.optionA)}\n    \\item ${escapeLatex(mcq.optionB)}\n`;
    latex += `    \\item ${escapeLatex(mcq.optionC)}\n    \\item ${escapeLatex(mcq.optionD)}\n  \\end{enumerate}\n`;
  });
  return latex + '\\end{enumerate}\n\\end{document}\n';
}

function gridLatex(subjectName: string, mcqs: ExportMcq[]) {
  let latex = '\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath,amssymb,longtable,array,geometry}\n';
  latex += '\\geometry{a4paper,landscape,margin=1cm}\n\\begin{document}\n\\section*{' + escapeLatex(subjectName) + '}\n';
  latex += '\\small\\begin{longtable}{|p{0.25\\textwidth}|*{4}{p{0.125\\textwidth}|}p{0.12\\textwidth}|}\n\\hline\n';
  latex += '\\textbf{Question} & \\textbf{Option A} & \\textbf{Option B} & \\textbf{Option C} & \\textbf{Option D} & \\textbf{Answer} \\\\ \\hline\\endhead\n';
  mcqs.forEach((mcq, index) => {
    latex += `${index + 1}. ${escapeLatex(mcq.questionStem)} & ${escapeLatex(mcq.optionA)} & ${escapeLatex(mcq.optionB)} & ${escapeLatex(mcq.optionC)} & ${escapeLatex(mcq.optionD)} & `;
    latex += '\\textcircled{A} \\textcircled{B} \\textcircled{C} \\textcircled{D} \\\\ \\hline\n';
  });
  return latex + '\\end{longtable}\n\\end{document}\n';
}

export const EXPORT_TEMPLATES: Record<ExportTemplateId, ExportTemplate> = {
  standard: {
    id: 'standard',
    name: 'Classic question list',
    summary: 'Stem followed by A–D, one option per line',
    description: 'A spacious, familiar exam-paper layout. Each question stays with its four vertically stacked options.',
    preview: standardPreview,
    renderPrintQuestions: renderStandardPrint,
    renderLatexDocument: standardLatex,
  },
  'answer-grid': {
    id: 'answer-grid',
    name: 'Six-column answer grid',
    summary: 'Question, four options, and response circles',
    description: 'A compact landscape table with one MCQ per row and A–D response circles in the final column.',
    preview: answerGridPreview,
    renderPrintQuestions: renderGridPrint,
    renderLatexDocument: gridLatex,
  },
};

export const EXPORT_TEMPLATE_LIST = Object.values(EXPORT_TEMPLATES);
