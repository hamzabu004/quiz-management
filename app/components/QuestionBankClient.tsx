"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Download, ChevronDown, Copy, Edit, Trash2, Check,
  ArrowLeft, Sparkles, HelpCircle, Upload, X, Search, LoaderCircle
} from 'lucide-react';
import { formatLaTeX } from '../../src/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteMcq } from '../actions/mcq';
import { importCsvData, previewCsvData } from '../actions/import';
import { loadMcqsPage } from '../actions/mcq-pagination';
import type { CsvImportMcq } from '../lib/csv';
import type { PaginatedMcq } from '../lib/mcq-pagination';

interface Category {
  id: string;
  categoryName: string;
}

interface Classroom {
  id: string;
  classroomName: string;
}

interface Subject {
  id: string;
  subjectName: string;
  classroom: Classroom;
  categories: Category[];
}

interface Props {
  subject: Subject;
  initialMcqs: PaginatedMcq[];
  initialNextCursor: string | null;
}

const CHATBOT_IMPORT_PROMPT = `Convert the provided material into multiple-choice questions and return only a valid CSV using this exact header:
Stem,Category,Option_A,Option_B,Option_C,Option_D,Correct_Answer,Explanation

Convert every equation to inline LaTeX math using $...$. Set Category to General for every question. Keep explanations concise. Use only A, B, C, or D in Correct_Answer. Quote every CSV field that contains a comma, double quote, or line break. Generate a downloadable csv.`;

export default function QuestionBankClient({ subject, initialMcqs, initialNextCursor }: Props) {
  const router = useRouter();
  const [mcqs, setMcqs] = useState<PaginatedMcq[]>(initialMcqs);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>(['All Categories']);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<CsvImportMcq[] | null>(null);
  const [csvImportCategories, setCsvImportCategories] = useState<string[]>([]);
  const [bulkImportCategory, setBulkImportCategory] = useState('');
  const [additionalImportPrompt, setAdditionalImportPrompt] = useState('');
  const [isImportPromptCopied, setIsImportPromptCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectedMCQIds, setSelectedMCQIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [deletingMcqId, setDeletingMcqId] = useState<string | null>(null);
  const [isNavigatingToNewMcq, setIsNavigatingToNewMcq] = useState(false);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshingMcqs, setIsRefreshingMcqs] = useState(false);
  const hasMountedPagination = useRef(false);

  // Sync initialMcqs if they change
  useEffect(() => {
    setMcqs(initialMcqs);
    setNextCursor(initialNextCursor);
  }, [initialMcqs, initialNextCursor]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const showError = (message: string) => {
    setImportError(message);
    setTimeout(() => setImportError(null), 5000);
  };

  const closeImportDialog = () => {
    if (isParsingImport || isImporting) return;
    setShowImportDialog(false);
    setImportFile(null);
    setImportPreview(null);
    setCsvImportCategories([]);
    setBulkImportCategory('');
    setAdditionalImportPrompt('');
    setIsImportPromptCopied(false);
    setImportError(null);
  };

  const chatbotImportPrompt = additionalImportPrompt.trim()
    ? `${CHATBOT_IMPORT_PROMPT}\n\nAdditional requirements:\n${additionalImportPrompt.trim()}`
    : CHATBOT_IMPORT_PROMPT;

  const copyChatbotImportPrompt = async () => {
    try {
      await navigator.clipboard.writeText(chatbotImportPrompt);
      setIsImportPromptCopied(true);
      window.setTimeout(() => setIsImportPromptCopied(false), 2000);
    } catch {
      showError('Unable to copy the prompt. Please select and copy it manually.');
    }
  };

  const handleImportFileSelected = async (file: File | null) => {
    setImportFile(file);
    setImportPreview(null);
    setCsvImportCategories([]);
    setBulkImportCategory('');

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      showError("Invalid file format. Please upload a .csv file.");
      setImportFile(null);
      return;
    }

    try {
      setIsParsingImport(true);
      const text = await file.text();
      const preview = await previewCsvData(text);
      setImportPreview(preview);
      setCsvImportCategories(Array.from(new Set(preview.map((mcq) => mcq.categoryName))));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to parse CSV.");
    } finally {
      setIsParsingImport(false);
    }
  };

  const handleImportSubmit = async () => {
    if (isImporting) return;

    if (!importPreview || importPreview.length === 0) {
      showError("There are no questions to import.");
      return;
    }

    try {
      setIsImporting(true);
      await importCsvData(subject.id, importPreview);
      setShowImportDialog(false);
      setImportFile(null);
      setImportPreview(null);
      setCsvImportCategories([]);
      setBulkImportCategory('');
      setAdditionalImportPrompt('');
      setIsImportPromptCopied(false);
      router.refresh();
      await fetchFirstPage();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to import CSV.");
    } finally {
      setIsImporting(false);
    }
  };

  const importCategoryOptions = Array.from(new Set([
    ...subject.categories.map((category) => category.categoryName),
    ...csvImportCategories,
  ])).sort((left, right) => left.localeCompare(right));

  const applyCategoryToAllImports = (categoryName: string) => {
    setBulkImportCategory(categoryName);
    if (!categoryName) return;
    setImportPreview((current) => current?.map((mcq) => ({ ...mcq, categoryName })) ?? null);
  };

  const updateImportCategory = (index: number, categoryName: string) => {
    setBulkImportCategory('');
    setImportPreview((current) => current?.map((mcq, mcqIndex) => (
      mcqIndex === index ? { ...mcq, categoryName } : mcq
    )) ?? null);
  };

  const toggleExplanation = (id: string) => {
    setExpandedExplanations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCategoryClick = (catName: string) => {
    if (catName === 'All Categories') {
      setSelectedCategoryNames(['All Categories']);
    } else {
      setSelectedCategoryNames((prev) => {
        const filtered = prev.filter((name) => name !== 'All Categories');
        if (filtered.includes(catName)) {
          const next = filtered.filter((name) => name !== catName);
          return next.length === 0 ? ['All Categories'] : next;
        } else {
          return [...filtered, catName];
        }
      });
    }
  };

  const categoryFilters = selectedCategoryNames.includes('All Categories') ? [] : selectedCategoryNames;
  const displayedMcqs = showSelectedOnly
    ? mcqs.filter((q) => selectedMCQIds.includes(q.id))
    : mcqs;

  const fetchFirstPage = async () => {
    setIsRefreshingMcqs(true);
    try {
      const page = await loadMcqsPage(subject.id, categoryFilters, debouncedSearchQuery, null);
      setMcqs(page.mcqs);
      setNextCursor(page.nextCursor);
    } catch {
      showError('Unable to load questions. Please try again.');
    } finally {
      setIsRefreshingMcqs(false);
    }
  };

  useEffect(() => {
    if (!hasMountedPagination.current) {
      hasMountedPagination.current = true;
      return;
    }
    void fetchFirstPage();
  }, [selectedCategoryNames, debouncedSearchQuery]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await loadMcqsPage(subject.id, categoryFilters, debouncedSearchQuery, nextCursor);
      setMcqs((previous) => [...previous, ...page.mcqs]);
      setNextCursor(page.nextCursor);
    } catch {
      showError('Unable to load more questions. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleExport = (type: 'csv' | 'pdf' | 'latex' | 'docx') => {
    setShowExportDropdown(false);
    const searchParams = new URLSearchParams({
      ids: selectedMCQIds.join(','),
      format: type,
    });
    router.push(`/subject/${subject.id}/export?${searchParams.toString()}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 overflow-y-auto relative w-full">
      {importError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg flex items-center justify-between min-w-[300px]">
          <span className="font-sans text-sm">{importError}</span>
          <button onClick={() => setImportError(null)} className="ml-4 hover:opacity-75 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`bg-lumina-surface rounded-lg shadow-2xl w-full overflow-hidden flex max-h-[92vh] flex-col border border-lumina-border ${importPreview ? 'max-w-6xl' : 'max-w-xl'
            }`}>
            <div className="p-6 border-b border-lumina-border flex justify-between items-center bg-lumina-container-lowest">
              <div>
                <h3 className="font-sans font-semibold text-xl text-lumina-text flex items-center gap-2">
                  <Upload size={20} className="text-lumina-primary" />
                  {importPreview ? 'Review Imported MCQs' : 'Batch Import MCQs'}
                </h3>
                {importPreview && (
                  <p className="mt-1 text-xs text-lumina-text-muted">
                    Nothing is saved until you confirm the import.
                  </p>
                )}
              </div>
              <button
                onClick={closeImportDialog}
                disabled={isParsingImport || isImporting}
                className="text-lumina-text-muted hover:text-lumina-text transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!importPreview ? (
                <div className="space-y-4">
                  <div className="bg-lumina-container-low p-4 rounded-lg border border-lumina-border flex gap-4 text-sm">
                    <div className="flex-1">
                      <span className="text-lumina-text-muted block text-xs uppercase tracking-wider font-mono mb-1">Subject</span>
                      <span className="font-semibold text-lumina-text">{subject.subjectName}</span>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                      <HelpCircle size={16} />
                      CSV Structure Requirements
                    </h4>
                    <div className="bg-lumina-container-lowest border border-lumina-border rounded p-3 font-mono text-xs overflow-x-auto whitespace-nowrap text-lumina-secondary selection:bg-lumina-primary/20">
                      Stem,Category,Option_A,Option_B,Option_C,Option_D,Correct_Answer,Explanation
                    </div>
                  </div>

                  <section className="rounded-lg border border-violet-500/25 bg-violet-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles size={18} className="mt-0.5 shrink-0 text-violet-600" />
                      <div>
                        <h4 className="text-sm font-semibold text-lumina-text">
                          Copy this prompt to your chatbot
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-lumina-text-muted">
                          Paste it along with your source material. Add another instruction below if you have specific requirements.
                        </p>
                      </div>
                    </div>

                    <textarea
                      readOnly
                      value={chatbotImportPrompt}
                      aria-label="Chatbot CSV generation prompt"
                      className="mt-4 h-40 w-full resize-none rounded border border-lumina-border bg-lumina-container-lowest p-3 font-mono text-[11px] leading-relaxed text-lumina-secondary outline-none focus:border-lumina-primary focus:ring-1 focus:ring-lumina-primary"
                    />

                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-xs font-semibold text-lumina-text">
                        Additional requirements <span className="font-normal text-lumina-text-muted">(optional)</span>
                      </span>
                      <textarea
                        value={additionalImportPrompt}
                        onChange={(event) => {
                          setAdditionalImportPrompt(event.target.value);
                          setIsImportPromptCopied(false);
                        }}
                        placeholder="Example: Generate 20 difficult questions and avoid repeated concepts."
                        className="h-20 w-full resize-y rounded border border-lumina-border bg-lumina-container-lowest p-3 text-xs text-lumina-text placeholder:text-lumina-text-muted outline-none focus:border-lumina-primary focus:ring-1 focus:ring-lumina-primary"
                      />
                    </label>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void copyChatbotImportPrompt()}
                        className="inline-flex items-center gap-2 rounded bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
                      >
                        {isImportPromptCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span aria-live="polite">{isImportPromptCopied ? 'Prompt Copied' : 'Copy Prompt'}</span>
                      </button>
                    </div>
                  </section>

                  <div className="mt-6 border-t border-lumina-border pt-4">
                    <h4 className="text-sm font-semibold text-lumina-text mb-2">Select CSV File</h4>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(event) => void handleImportFileSelected(event.target.files?.[0] ?? null)}
                      disabled={isParsingImport}
                      className="block w-full text-sm text-lumina-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-lumina-primary/10 file:text-lumina-primary hover:file:bg-lumina-primary/20 cursor-pointer border border-lumina-border p-2 rounded disabled:cursor-wait disabled:opacity-50"
                    />
                    {isParsingImport && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-lumina-secondary" role="status">
                        <LoaderCircle size={16} className="animate-spin text-lumina-primary" />
                        Reading and validating {importFile?.name ?? 'CSV'}…
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 rounded-lg border border-lumina-border bg-lumina-container-low p-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-lumina-text-muted">Ready to review</span>
                      <p className="mt-1 text-sm font-semibold text-lumina-text">
                        {importPreview.length} question{importPreview.length === 1 ? '' : 's'} from {importFile?.name}
                      </p>
                    </div>
                    <label className="w-full md:max-w-xs">
                      <span className="mb-1.5 block text-xs font-semibold text-lumina-text">Apply category to all</span>
                      <select
                        value={bulkImportCategory}
                        onChange={(event) => applyCategoryToAllImports(event.target.value)}
                        disabled={isImporting}
                        className="w-full rounded border border-lumina-border bg-lumina-container-lowest px-3 py-2 text-sm text-lumina-text outline-none focus:border-lumina-primary focus:ring-1 focus:ring-lumina-primary disabled:opacity-60"
                      >
                        <option value="">Keep individual categories</option>
                        {importCategoryOptions.map((categoryName) => (
                          <option key={categoryName} value={categoryName}>{categoryName}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {importPreview.map((mcq, index) => {
                      const options = [
                        { label: 'A', text: mcq.optionA },
                        { label: 'B', text: mcq.optionB },
                        { label: 'C', text: mcq.optionC },
                        { label: 'D', text: mcq.optionD },
                      ];

                      return (
                        <article key={index} className="rounded-lg border border-lumina-border bg-lumina-container-low p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-lumina-primary">
                              Question {index + 1}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-lumina-text-muted">
                              Answer {mcq.answer.toUpperCase()}
                            </span>
                          </div>

                          <div
                            className="mb-5 text-sm font-medium leading-relaxed text-lumina-text"
                            dangerouslySetInnerHTML={{ __html: formatLaTeX(mcq.questionStem) }}
                          />

                          <div className="space-y-2.5">
                            {options.map((option) => {
                              const isCorrect = mcq.answer.toUpperCase() === option.label;
                              return (
                                <div
                                  key={option.label}
                                  className={`flex items-start gap-2.5 rounded border p-3 text-xs ${isCorrect
                                      ? 'border-lumina-primary bg-lumina-primary/5 text-lumina-primary'
                                      : 'border-lumina-border bg-lumina-container-lowest text-lumina-secondary'
                                    }`}
                                >
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[10px] font-bold ${isCorrect
                                      ? 'border-lumina-primary bg-lumina-primary text-lumina-on-primary'
                                      : 'border-lumina-border bg-lumina-container-low text-lumina-text-muted'
                                    }`}>
                                    {option.label}
                                  </span>
                                  <span dangerouslySetInnerHTML={{ __html: formatLaTeX(option.text) }} />
                                </div>
                              );
                            })}
                          </div>

                          <label className="mt-5 block border-t border-lumina-border pt-4">
                            <span className="mb-1.5 block text-xs font-semibold text-lumina-text">Category</span>
                            <select
                              value={mcq.categoryName}
                              onChange={(event) => updateImportCategory(index, event.target.value)}
                              disabled={isImporting}
                              className="w-full rounded border border-lumina-border bg-lumina-container-lowest px-3 py-2 text-sm text-lumina-text outline-none focus:border-lumina-primary focus:ring-1 focus:ring-lumina-primary disabled:opacity-60"
                            >
                              {importCategoryOptions.map((categoryName) => (
                                <option key={categoryName} value={categoryName}>{categoryName}</option>
                              ))}
                            </select>
                          </label>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-lumina-border bg-lumina-container-lowest flex flex-wrap justify-end gap-3">
              {importPreview && (
                <button
                  onClick={() => {
                    setImportPreview(null);
                    setImportFile(null);
                    setCsvImportCategories([]);
                    setBulkImportCategory('');
                  }}
                  disabled={isImporting}
                  className="mr-auto px-4 py-2 text-sm font-medium text-lumina-secondary hover:text-lumina-text transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Choose another file
                </button>
              )}
              <button
                onClick={closeImportDialog}
                disabled={isParsingImport || isImporting}
                className="px-4 py-2 text-sm font-medium text-lumina-secondary hover:text-lumina-text transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              {importPreview && (
                <button
                  onClick={handleImportSubmit}
                  disabled={isImporting}
                  className="px-4 py-2 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary rounded text-sm font-semibold transition-all cursor-pointer disabled:cursor-wait disabled:opacity-80"
                >
                  <span className="flex items-center gap-2">
                    {isImporting ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                    {isImporting ? 'Importing…' : `Confirm Import (${importPreview.length})`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs font-mono text-lumina-text-muted mb-4 select-none">
        <Link href={`/classroom/${subject.classroom.id}`} className="hover:text-lumina-primary transition-colors cursor-pointer">
          {subject.classroom.classroomName}
        </Link>
        <span>&rsaquo;</span>
        <span className="text-lumina-text font-semibold">{subject.subjectName}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-sans font-semibold text-3xl tracking-tight text-lumina-text mb-2">
            {subject.subjectName} - Question Bank
          </h2>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={!isSelectionMode || selectedMCQIds.length === 0}
              className={`py-2 px-3.5 border rounded text-sm font-sans font-semibold flex items-center gap-2 transition-all ${!isSelectionMode || selectedMCQIds.length === 0
                  ? 'bg-lumina-container/50 border-lumina-border/50 text-lumina-secondary/50 cursor-not-allowed'
                  : 'bg-lumina-container hover:bg-lumina-container-low border-lumina-border text-lumina-secondary hover:text-lumina-primary cursor-pointer'
                }`}
            >
              <Download size={14} />
              <span>Export</span>
              <ChevronDown size={14} />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-1.5 w-48 bg-lumina-container border border-lumina-border rounded shadow-xl z-20 py-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export CSV Spreadsheet
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handleExport('latex')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export LaTeX
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export DOCX
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`py-2 px-3.5 border rounded text-sm font-sans font-semibold flex items-center gap-2 transition-all cursor-pointer ${isSelectionMode
                ? 'bg-lumina-primary/10 border-lumina-primary/30 text-lumina-primary'
                : 'bg-lumina-container hover:bg-lumina-container-low border-lumina-border text-lumina-secondary hover:text-lumina-primary'
              }`}
          >
            <Check size={14} />
            <span>Select Mode {selectedMCQIds.length > 0 ? `(${selectedMCQIds.length})` : ''}</span>
          </button>

          <button
            onClick={() => setShowImportDialog(true)}
            className="py-2 px-3.5 bg-lumina-container hover:bg-lumina-container-low border border-lumina-border text-lumina-secondary hover:text-lumina-primary rounded text-sm font-sans font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload size={14} />
            <span>Batch Import</span>
          </button>

          <Link
            href={`/subject/${subject.id}/question/new`}
            onClick={(event) => {
              if (isNavigatingToNewMcq) {
                event.preventDefault();
                return;
              }
              setIsNavigatingToNewMcq(true);
            }}
            aria-disabled={isNavigatingToNewMcq}
            className="py-2 px-3.5 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary rounded text-sm font-sans font-semibold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer aria-disabled:cursor-wait aria-disabled:opacity-80"
          >
            {isNavigatingToNewMcq ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
            <span>{isNavigatingToNewMcq ? 'Opening…' : 'New MCQ'}</span>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-lumina-text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search questions by content or options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-lumina-container-lowest border border-lumina-border rounded-lg text-sm text-lumina-text placeholder:text-lumina-text-muted focus:outline-none focus:border-lumina-primary focus:ring-1 focus:ring-lumina-primary transition-all"
          />
        </div>
      </div>

      <div className="bg-lumina-container-low border border-lumina-border rounded-lg p-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono tracking-wider uppercase text-lumina-text-muted select-none">
            Filter by Category:
          </span>

          <button
            onClick={() => handleCategoryClick('All Categories')}
            className={`py-1.5 px-3 rounded text-xs font-sans transition-all cursor-pointer ${selectedCategoryNames.includes('All Categories')
                ? 'bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/30 font-medium'
                : 'bg-lumina-container-lowest text-lumina-secondary border border-transparent hover:border-lumina-border hover:text-lumina-primary'
              }`}
          >
            All Categories
          </button>

          {subject.categories.map((cat) => {
            const isSelected = selectedCategoryNames.includes(cat.categoryName);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.categoryName)}
                className={`py-1.5 px-3 rounded text-xs font-sans transition-all cursor-pointer ${isSelected
                    ? 'bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/30 font-medium'
                    : 'bg-lumina-container-lowest text-lumina-secondary border border-transparent hover:border-lumina-border hover:text-lumina-primary'
                  }`}
              >
                {cat.categoryName}
              </button>
            );
          })}

          {isSelectionMode && (
            <>
              <div className="w-[1px] h-6 bg-lumina-border mx-1"></div>
              <button
                onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                className={`py-1.5 px-3 rounded text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${showSelectedOnly
                    ? 'bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/30 font-medium'
                    : 'bg-lumina-container-lowest text-lumina-secondary border border-transparent hover:border-lumina-border hover:text-lumina-primary'
                  }`}
              >
                <span>Selected Only ({selectedMCQIds.length})</span>
              </button>
              {selectedMCQIds.length > 0 && (
                <button
                  onClick={() => { setSelectedMCQIds([]); setShowSelectedOnly(false); }}
                  className="py-1.5 px-2 rounded text-xs font-sans text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </>
          )}

          <div className="ml-auto text-xs text-lumina-text-muted font-mono select-none">
            Showing <span className="text-lumina-text font-semibold">{displayedMcqs.length}</span> Question{displayedMcqs.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {displayedMcqs.length === 0 ? (
        <div className="border border-dashed border-lumina-border rounded-lg py-16 text-center">
          {isRefreshingMcqs ? (
            <>
              <LoaderCircle className="mx-auto animate-spin text-lumina-primary mb-3" size={32} />
              <p className="font-sans font-semibold text-lg text-lumina-text">Loading questions…</p>
            </>
          ) : (
            <>
              <HelpCircle className="mx-auto text-lumina-text-muted mb-3" size={32} />
              <p className="font-sans font-semibold text-lg text-lumina-text mb-1">No questions found</p>
              <p className="text-xs text-lumina-text-muted max-w-sm mx-auto">
                Try adjusting your search filters or click "+ New MCQ" to generate standard questions.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedMcqs.map((q, idx) => {
              const isSelectedCard = selectedMCQIds.includes(q.id);
              const isDeleting = deletingMcqId === q.id;

              const handleCardClick = () => {
                if (!isSelectionMode || isDeleting) return;
                if (isSelectedCard) {
                  setSelectedMCQIds(prev => prev.filter(id => id !== q.id));
                } else {
                  setSelectedMCQIds(prev => [...prev, q.id]);
                }
              };

              const options = [
                { id: 'A', label: 'A', text: q.optionA },
                { id: 'B', label: 'B', text: q.optionB },
                { id: 'C', label: 'C', text: q.optionC },
                { id: 'D', label: 'D', text: q.optionD },
              ];

              return (
                <div
                  key={q.id}
                  onClick={handleCardClick}
                  className={`bg-lumina-container-low border rounded-lg p-5 relative group transition-all ${isSelectionMode ? 'cursor-pointer hover:border-lumina-primary/50' : ''
                    } ${isSelectedCard ? 'border-lumina-primary ring-1 ring-lumina-primary shadow-sm bg-lumina-primary/5' : 'border-lumina-border hover:border-lumina-primary/30'
                    }`}
                >
                  {isDeleting && (
                    <div
                      className="absolute inset-0 z-20 flex items-start justify-center rounded-lg bg-lumina-container-low/75 pt-5 backdrop-blur-[1px]"
                      role="status"
                      aria-label="Deleting MCQ"
                    >
                      <span className="flex items-center gap-2 rounded-md border border-lumina-border bg-lumina-container px-3 py-2 text-xs font-medium text-lumina-text shadow-sm">
                        <LoaderCircle size={16} className="animate-spin text-lumina-primary" />
                        Deleting…
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4 select-none">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-lumina-primary tracking-widest uppercase">
                        QUESTION {idx + 1}
                      </span>
                      <span className="text-lumina-text-muted">&bull;</span>
                      <span className="px-1.5 py-0.5 bg-lumina-container-highest text-lumina-text-variant rounded text-[9px] font-mono font-bold tracking-wider uppercase">
                        {q.categoryName}
                      </span>
                    </div>

                    {isSelectionMode && (
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelectedCard
                          ? 'bg-lumina-primary border-lumina-primary text-lumina-on-primary'
                          : 'border-lumina-border bg-lumina-container-lowest text-transparent'
                        }`}>
                        <Check size={12} />
                      </div>
                    )}
                  </div>

                  <h4
                    className="font-sans text-sm md:text-base text-lumina-text leading-relaxed mb-5 font-medium line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: formatLaTeX(q.questionStem) }}
                  />

                  <div className="space-y-2.5">
                    {options.map((opt) => {
                      const isCorrect = q.answer.toUpperCase() === opt.id.toUpperCase();
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded border text-xs flex items-center justify-between transition-colors ${isCorrect
                              ? 'bg-lumina-primary/5 border-lumina-primary text-lumina-primary font-medium'
                              : 'bg-lumina-container-lowest border-lumina-border text-lumina-secondary'
                            }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`w-5 h-5 rounded font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border ${isCorrect
                                ? 'bg-lumina-primary text-lumina-on-primary border-lumina-primary'
                                : 'bg-lumina-container-low border-lumina-border text-lumina-text-muted'
                              }`}>
                              {opt.label}
                            </span>
                            <span
                              className="font-sans"
                              dangerouslySetInnerHTML={{ __html: formatLaTeX(opt.text) }}
                            />
                          </div>
                          {isCorrect && <Check size={14} className="text-lumina-primary shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && q.explanation.trim() !== '' && (
                    <div className="mt-4 border-t border-lumina-border pt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExplanation(q.id);
                        }}
                        className="text-xs font-sans font-medium text-lumina-primary hover:text-lumina-primary-hover transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {expandedExplanations[q.id] ? 'Hide Explanation' : 'View Explanation'}
                      </button>
                      {expandedExplanations[q.id] && (
                        <div className="mt-3 p-3 rounded bg-lumina-container-lowest border border-lumina-border text-xs text-lumina-secondary leading-relaxed">
                          <span className="font-mono text-[10px] tracking-wider uppercase text-emerald-700 block mb-1 font-semibold">
                            Pedagogical Explanation:
                          </span>
                          <div dangerouslySetInnerHTML={{ __html: formatLaTeX(q.explanation) }} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-lumina-container py-1 px-1.5 rounded-md border border-lumina-border shadow-md">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDeleting) return;
                        router.push(`/subject/${subject.id}/question/${q.id}/edit`);
                      }}
                      disabled={isDeleting}
                      className="p-1 rounded hover:bg-lumina-container-lowest hover:text-lumina-primary text-lumina-secondary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      title="Edit MCQ"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (isDeleting) return;

                        setDeletingMcqId(q.id);
                        try {
                          await deleteMcq(q.id, subject.id);
                        } finally {
                          setDeletingMcqId(null);
                        }
                      }}
                      disabled={isDeleting}
                      className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-lumina-secondary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete MCQ"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!showSelectedOnly && nextCursor && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore || isRefreshingMcqs}
                className="min-w-36 py-2.5 px-4 rounded border border-lumina-border bg-lumina-container text-sm font-semibold text-lumina-secondary hover:text-lumina-primary hover:bg-lumina-container-low transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoadingMore && <LoaderCircle size={16} className="animate-spin" />}
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
