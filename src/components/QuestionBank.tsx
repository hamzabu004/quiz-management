import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Download, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Check, 
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Upload,
  X,
  Search
} from 'lucide-react';
import { MCQQuestion, Subject, Category } from '../types';
import { formatLaTeX } from '../utils';

interface QuestionBankProps {
  selectedSubject: Subject | null;
  categories: Category[];
  mcqs: MCQQuestion[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMCQIds: string[];
  setSelectedMCQIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSelectMCQForEdit: (id: string) => void;
  onDeleteMCQ: (id: string) => void;
  onAddNewMCQClick: () => void;
  onBackToSubjects: () => void;
}

export default function QuestionBank({
  selectedSubject,
  categories,
  mcqs,
  searchQuery,
  setSearchQuery,
  selectedMCQIds,
  setSelectedMCQIds,
  onSelectMCQForEdit,
  onDeleteMCQ,
  onAddNewMCQClick,
  onBackToSubjects,
}: QuestionBankProps) {
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>(['All Categories']);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const showError = (message: string) => {
    setImportError(message);
    setTimeout(() => {
      setImportError(null);
    }, 5000);
  };

  const handleImportSubmit = () => {
    if (!importFile) {
      showError("Please select a CSV file to import.");
      return;
    }
    
    // Validate file type
    if (!importFile.name.endsWith('.csv') && importFile.type !== 'text/csv') {
      showError("Invalid file format. Please upload a .csv file.");
      return;
    }

    // Since actual implementation is deferred, just show an error for now
    showError("CSV format validation failed. Ensure the columns match the required format.");
  };

  const toggleExplanation = (id: string) => {
    setExpandedExplanations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const subjectId = selectedSubject?.id || 'sub-1';
  const subjectName = selectedSubject?.name || 'Mathematics';
  const levelName = selectedSubject?.classroomLevel || 'O Level';

  // Filter categories by subject
  const subjectCategories = categories.filter(cat => cat.subjectId === '' || cat.subjectId === subjectId);

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

  const ITEMS_PER_PAGE = 6;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [subjectId, selectedCategoryNames, searchQuery, showSelectedOnly]);

  // Filter MCQs by subject, category, search query, and selection
  const filteredMCQs = mcqs.filter((q) => {
    const matchesSubject = q.subjectId === subjectId;
    const matchesCategory = 
      selectedCategoryNames.includes('All Categories') || 
      selectedCategoryNames.includes(q.category);
    const matchesSearch = 
      q.stem.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.options.some(opt => opt.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSelection = showSelectedOnly ? selectedMCQIds.includes(q.id) : true;
    
    return matchesSubject && matchesCategory && matchesSearch && matchesSelection;
  });

  const paginatedMCQs = filteredMCQs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMCQs.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulate API delay
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };

  const handleExport = (type: 'json' | 'csv' | 'latex' | 'docx' | 'pdf') => {
    if (type === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        return;
      }
      const htmlContent = `
        <html>
          <head>
            <title>${subjectName} MCQ Export</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body {
                font-family: 'Inter', sans-serif;
                padding: 40px;
                color: #1f2937;
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.6;
              }
              h1 {
                font-size: 24px;
                font-weight: 700;
                color: #111827;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 12px;
                margin-bottom: 24px;
              }
              .meta {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
              }
              .question-item {
                margin-bottom: 24px;
                page-break-inside: avoid;
              }
              .stem {
                font-weight: 600;
                margin-bottom: 8px;
                color: #111827;
              }
              .option {
                margin-left: 20px;
                margin-bottom: 4px;
                color: #374151;
              }
              .answer-key {
                margin-top: 40px;
                page-break-before: always;
                border-top: 2px solid #e5e7eb;
                padding-top: 20px;
              }
              .answer-item {
                margin-bottom: 8px;
                font-weight: 500;
              }
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif;">
              <span style="font-size: 13px; font-weight: 500; color: #4b5563;">Print Preview - Click Print to save as PDF</span>
              <button onclick="window.print()" style="background: #0d9488; color: white; border: none; padding: 6px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
            </div>
            <h1>${subjectName} - MCQ Question Bank</h1>
            <div class="meta">
              <span>Level: ${levelName}</span>
              <span>Questions Count: ${filteredMCQs.length}</span>
            </div>
            <div>
              ${filteredMCQs.map((q, idx) => `
                <div class="question-item">
                  <div class="stem">${idx + 1}. ${q.stem} <span style="font-size: 11px; font-weight: normal; color: #9ca3af; margin-left: 8px;">(${q.category})</span></div>
                  <div>
                    ${q.options.map(opt => `
                      <div class="option">${opt.label}) ${opt.text}</div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="answer-key">
              <h2>Answer Key</h2>
              <div style="grid-template-columns: repeat(4, 1fr); display: grid; gap: 10px; margin-top: 15px;">
                ${filteredMCQs.map((q, idx) => `
                  <div class="answer-item">Q${idx + 1}: <strong style="color: #0d9488;">${q.correctAnswerIds.join(', ')}</strong></div>
                `).join('')}
              </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setShowExportDropdown(false);
      return;
    }

    let dataStr = '';
    let mimeType = 'text/plain';
    let fileExtension = '';

    if (type === 'json') {
      dataStr = JSON.stringify(filteredMCQs, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else if (type === 'csv') {
      dataStr = 'ID,Category,Stem,Options,CorrectAnswer\n' + filteredMCQs.map(q => 
        `"${q.id}","${q.category}","${q.stem.replace(/"/g, '""')}",` +
        `"${q.options.map(o => `${o.label}: ${o.text}`).join(' | ').replace(/"/g, '""')}","${q.correctAnswerIds.join(', ')}"`
      ).join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else if (type === 'latex') {
      dataStr = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}

\\title{${subjectName} - MCQ Question Bank}
\\author{Private Tutor Suite}
\\date{\\today}

\\begin{document}
\\maketitle

\\section*{Questions}
\\begin{enumerate}
${filteredMCQs.map((q) => `  \\item \\textbf{${q.stem}} [Category: ${q.category}]
  \\begin{enumerate}
${q.options.map(opt => `    \\item ${opt.label}) ${opt.text}`).join('\n')}
  \\end{enumerate}`).join('\n\n')}
\\end{enumerate}

\\newpage
\\section*{Answer Key}
\\begin{enumerate}
${filteredMCQs.map((q, idx) => `  \\item Question ${idx + 1}: ${q.correctAnswerIds.join(', ')}`).join('\n')}
\\end{enumerate}

\\end{document}
`;
      mimeType = 'text/plain';
      fileExtension = 'tex';
    } else if (type === 'docx') {
      dataStr = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<title>${subjectName} MCQ Bank</title>
<style>
body { font-family: 'Arial', sans-serif; line-height: 1.5; color: #333333; }
h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 5px; }
h2 { color: #4b5563; font-size: 16px; margin-top: 20px; }
.question { margin-bottom: 20px; page-break-inside: avoid; }
.stem { font-weight: bold; margin-bottom: 8px; }
.options { margin-left: 20px; }
.option { margin-bottom: 4px; }
</style>
</head>
<body>
<h1>${subjectName} MCQ Question Bank</h1>
<p>Generated via Private Tutor Suite | Category: ${selectedCategoryNames.join(', ')}</p>
<hr/>
${filteredMCQs.map((q, idx) => `
<div class="question">
  <p class="stem">${idx + 1}. ${q.stem} <span style="font-size: 11px; color: #6b7280;">(${q.category})</span></p>
  <div class="options">
    ${q.options.map(opt => `<div class="option">${opt.label}) ${opt.text}</div>`).join('')}
  </div>
</div>
`).join('')}
<br/><br/>
<h1 style="page-break-before: always;">Answer Key</h1>
${filteredMCQs.map((q, idx) => `
<p><strong>Question ${idx + 1}:</strong> Correct: ${q.correctAnswerIds.join(', ')}</p>
`).join('')}
</body>
</html>
`;
      mimeType = 'application/vnd.ms-word';
      fileExtension = 'doc';
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${subjectName.toLowerCase()}_mcq_export_${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 overflow-y-auto relative">
      {/* Toast Notification */}
      {importError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg flex items-center justify-between min-w-[300px]">
          <span className="font-sans text-sm">{importError}</span>
          <button onClick={() => setImportError(null)} className="ml-4 hover:opacity-75 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Batch Import Dialog */}
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
                  setShowImportDialog(false);
                  setImportFile(null);
                  setImportError(null);
                }}
                className="text-lumina-text-muted hover:text-lumina-text transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="bg-lumina-container-low p-4 rounded-lg border border-lumina-border flex gap-4 text-sm">
                  <div className="flex-1">
                    <span className="text-lumina-text-muted block text-xs uppercase tracking-wider font-mono mb-1">Subject</span>
                    <span className="font-semibold text-lumina-text">{subjectName}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-lumina-text-muted block text-xs uppercase tracking-wider font-mono mb-1">Level</span>
                    <span className="font-semibold text-lumina-text">{levelName}</span>
                  </div>
                </div>

                {/* CSV Structure Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <HelpCircle size={16} />
                    CSV Structure Requirements
                  </h4>
                  <p className="text-xs text-lumina-text-muted mb-3 leading-relaxed">
                    Ensure your CSV has the exact headers below. You can copy this structure to use as a prompt for an AI to format your questions correctly.
                  </p>
                  <div className="bg-lumina-container-lowest border border-lumina-border rounded p-3 font-mono text-xs overflow-x-auto whitespace-nowrap text-lumina-secondary selection:bg-lumina-primary/20">
                    Stem,Category,Option_A,Option_B,Option_C,Option_D,Correct_Answer,Explanation
                  </div>
                  <div className="text-xs text-lumina-text-muted mt-3 space-y-1">
                    <p><span className="font-semibold text-lumina-text">Correct_Answer:</span> Must be A, B, C, or D.</p>
                    <p><span className="font-semibold text-lumina-text">Category:</span> Must match one of the available categories below exactly.</p>
                    <p><span className="font-semibold text-lumina-text">Explanation:</span> Optional column for the answer explanation.</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-lumina-text mb-2">Available Categories</h4>
                  <p className="text-xs text-lumina-text-muted mb-2">Your CSV must use one of these categories in the 'Category' column:</p>
                  <div className="flex flex-wrap gap-2">
                    {subjectCategories.filter(c => c.name !== 'All Categories').map(cat => (
                      <span key={cat.id} className="px-2 py-1 bg-lumina-container border border-lumina-border rounded text-xs font-mono text-lumina-secondary">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-lumina-border pt-4">
                  <h4 className="text-sm font-semibold text-lumina-text mb-2">Select CSV File</h4>
                  <p className="text-xs text-lumina-text-muted mb-3">Please select a .csv file structured with standard MCQ headers.</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-lumina-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-lumina-primary/10 file:text-lumina-primary hover:file:bg-lumina-primary/20 cursor-pointer border border-lumina-border p-2 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-lumina-border bg-lumina-container-lowest flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                  setImportError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-lumina-secondary hover:text-lumina-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary rounded text-sm font-semibold transition-all cursor-pointer"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb row & Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-lumina-text-muted mb-4 select-none">
        <button 
          onClick={onBackToSubjects}
          className="hover:text-lumina-primary transition-colors cursor-pointer"
        >
          Subjects
        </button>
        <span>&rsaquo;</span>
        <span className="text-lumina-text font-semibold">{subjectName}</span>
      </div>

      {/* Hero Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-sans font-semibold text-3xl tracking-tight text-lumina-text mb-2">
            {subjectName} - Question Bank
          </h2>
          <p className="text-sm text-lumina-text-muted max-w-2xl">
           Manage and organize your multiple choice questions.
          </p>
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={!isSelectionMode || selectedMCQIds.length === 0}
              title={!isSelectionMode || selectedMCQIds.length === 0 ? "Enable selection mode and select items to export" : ""}
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
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export PDF Document
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export Word (DOCX)
                </button>
                <button
                  onClick={() => handleExport('latex')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export LaTeX (.tex)
                </button>
                <div className="h-[1px] bg-lumina-border my-1" />
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-4 py-2 text-xs text-lumina-secondary hover:bg-lumina-container-lowest hover:text-lumina-primary transition-colors cursor-pointer"
                >
                  Export JSON File
                </button>
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

          <button
            onClick={onAddNewMCQClick}
            className="py-2 px-3.5 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary rounded text-sm font-sans font-semibold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} />
            <span>New MCQ</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
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

      {/* Category Filter Bar */}
      <div className="bg-lumina-container-low border border-lumina-border rounded-lg p-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono tracking-wider uppercase text-lumina-text-muted select-none">
            Filter by Category:
          </span>

          {subjectCategories.map((cat) => {
            const isSelected = selectedCategoryNames.includes(cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`py-1.5 px-3 rounded text-xs font-sans transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/30 font-medium'
                    : 'bg-lumina-container-lowest text-lumina-secondary border border-transparent hover:border-lumina-border hover:text-lumina-primary'
                }`}
              >
                {cat.name}
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

          {/* Counts */}
          <div className="ml-auto text-xs text-lumina-text-muted font-mono select-none">
            Showing <span className="text-lumina-text font-semibold">{paginatedMCQs.length}</span> of <span className="text-lumina-text font-semibold">{filteredMCQs.length}</span> Questions
          </div>
        </div>
      </div>

      {/* Grid List of Questions (Matches lower section of screenshot 2) */}
      {paginatedMCQs.length === 0 ? (
        <div className="border border-dashed border-lumina-border rounded-lg py-16 text-center">
          <HelpCircle className="mx-auto text-lumina-text-muted mb-3" size={32} />
          <p className="font-sans font-semibold text-lg text-lumina-text mb-1">No questions found</p>
          <p className="text-xs text-lumina-text-muted max-w-sm mx-auto">
            Try adjusting your search filters or click "+ New MCQ" to generate standard questions.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedMCQs.map((q, idx) => {
              const isSelectedCard = selectedMCQIds.includes(q.id);
              
              const handleCardClick = () => {
                if (!isSelectionMode) return;
                if (isSelectedCard) {
                  setSelectedMCQIds(prev => prev.filter(id => id !== q.id));
                } else {
                  setSelectedMCQIds(prev => [...prev, q.id]);
                }
              };

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
                {/* Header Metadata */}
                <div className="flex items-center justify-between mb-4 select-none">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-lumina-primary tracking-widest uppercase">
                      QUESTION {idx + 1}
                    </span>
                    <span className="text-lumina-text-muted">&bull;</span>
                    <span className="px-1.5 py-0.5 bg-lumina-container-highest text-lumina-text-variant rounded text-[9px] font-mono font-bold tracking-wider uppercase">
                      {q.category}
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

                {/* Question Stem */}
                <h4 
                  className="font-sans text-sm md:text-base text-lumina-text leading-relaxed mb-5 font-medium line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: formatLaTeX(q.stem) }}
                />

                {/* Option checkboxes layout */}
                <div className="space-y-2.5">
                  {q.options.map((opt) => {
                    const isCorrect = q.correctAnswerIds.includes(opt.id);
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

                        {isCorrect && (
                          <Check size={14} className="text-lumina-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation toggle */}
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

                {/* Hover Quick Edit triggers */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-lumina-container py-1 px-1.5 rounded-md border border-lumina-border shadow-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMCQForEdit(q.id);
                    }}
                    className="p-1 rounded hover:bg-lumina-container-lowest hover:text-lumina-primary text-lumina-secondary transition-colors cursor-pointer"
                    title="Edit MCQ"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMCQ(q.id);
                    }}
                    className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-lumina-secondary transition-colors cursor-pointer"
                    title="Delete MCQ"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-4 mb-8">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="py-2.5 px-6 bg-lumina-container-lowest border border-lumina-border hover:bg-lumina-container text-lumina-primary font-sans font-medium rounded-full text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-lumina-primary border-t-transparent animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More Questions</span>
              )}
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
