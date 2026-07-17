"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Download, ChevronDown, Edit, Trash2, Check, 
  ArrowLeft, Sparkles, HelpCircle, Upload, X, Search, LoaderCircle
} from 'lucide-react';
import { formatLaTeX } from '../../src/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteMcq } from '../actions/mcq';
import { importCsvData } from '../actions/import';
import { loadMcqsPage } from '../actions/mcq-pagination';
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

export default function QuestionBankClient({ subject, initialMcqs, initialNextCursor }: Props) {
  const router = useRouter();
  const [mcqs, setMcqs] = useState<PaginatedMcq[]>(initialMcqs);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>(['All Categories']);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
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

  const handleImportSubmit = async () => {
    if (isImporting) return;

    if (!importFile) {
      showError("Please select a CSV file to import.");
      return;
    }
    
    if (!importFile.name.endsWith('.csv') && importFile.type !== 'text/csv') {
      showError("Invalid file format. Please upload a .csv file.");
      return;
    }

    try {
      setIsImporting(true);
      const text = await importFile.text();
      await importCsvData(subject.id, text);
      setShowImportDialog(false);
      setImportFile(null);
    } catch (e) {
      showError("Failed to parse or import CSV.");
    } finally {
      setIsImporting(false);
    }
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

  const handleExport = (type: 'csv') => {
    if (type === 'csv') {
      window.location.href = `/api/export?ids=${selectedMCQIds.join(',')}`;
    }
    setShowExportDropdown(false);
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
          <div className="bg-lumina-surface rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-lumina-border">
            <div className="p-6 border-b border-lumina-border flex justify-between items-center bg-lumina-container-lowest">
              <h3 className="font-sans font-semibold text-xl text-lumina-text flex items-center gap-2">
                <Upload size={20} className="text-lumina-primary" />
                Batch Import MCQs
              </h3>
              <button 
                onClick={() => {
                  if (isImporting) return;
                  setShowImportDialog(false);
                  setImportFile(null);
                  setImportError(null);
                }}
                disabled={isImporting}
                className="text-lumina-text-muted hover:text-lumina-text transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
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

                <div className="mt-6 border-t border-lumina-border pt-4">
                  <h4 className="text-sm font-semibold text-lumina-text mb-2">Select CSV File</h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                    disabled={isImporting}
                    className="block w-full text-sm text-lumina-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-lumina-primary/10 file:text-lumina-primary hover:file:bg-lumina-primary/20 cursor-pointer border border-lumina-border p-2 rounded disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-lumina-border bg-lumina-container-lowest flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!isImporting) setShowImportDialog(false);
                }}
                disabled={isImporting}
                className="px-4 py-2 text-sm font-medium text-lumina-secondary hover:text-lumina-text transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={isImporting}
                className="px-4 py-2 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary rounded text-sm font-semibold transition-all cursor-pointer disabled:cursor-wait disabled:opacity-80"
              >
                <span className="flex items-center gap-2">
                  {isImporting && <LoaderCircle size={16} className="animate-spin" />}
                  {isImporting ? 'Importing…' : 'Import Questions'}
                </span>
              </button>
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
              className={`py-2 px-3.5 border rounded text-sm font-sans font-semibold flex items-center gap-2 transition-all ${
                !isSelectionMode || selectedMCQIds.length === 0
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
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`py-2 px-3.5 border rounded text-sm font-sans font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isSelectionMode 
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
            className={`py-1.5 px-3 rounded text-xs font-sans transition-all cursor-pointer ${
              selectedCategoryNames.includes('All Categories')
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
                className={`py-1.5 px-3 rounded text-xs font-sans transition-all cursor-pointer ${
                  isSelected
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
                className={`py-1.5 px-3 rounded text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
                  showSelectedOnly
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
                  className={`bg-lumina-container-low border rounded-lg p-5 relative group transition-all ${
                    isSelectionMode ? 'cursor-pointer hover:border-lumina-primary/50' : ''
                  } ${
                    isSelectedCard ? 'border-lumina-primary ring-1 ring-lumina-primary shadow-sm bg-lumina-primary/5' : 'border-lumina-border hover:border-lumina-primary/30'
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
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelectedCard 
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
                          className={`p-3 rounded border text-xs flex items-center justify-between transition-colors ${
                            isCorrect 
                              ? 'bg-lumina-primary/5 border-lumina-primary text-lumina-primary font-medium' 
                              : 'bg-lumina-container-lowest border-lumina-border text-lumina-secondary'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`w-5 h-5 rounded font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                              isCorrect
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
