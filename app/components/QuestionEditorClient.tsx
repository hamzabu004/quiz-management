"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Check, X, Eye
} from 'lucide-react';
import { formatLaTeX } from '../../src/utils';
import { useRouter } from 'next/navigation';
import { createMcq, updateMcq } from '../actions/mcq';

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

interface MCQ {
  id: string;
  questionStem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation: string | null;
  categoryName: string;
}

interface Props {
  mode: 'add' | 'edit';
  subject: Subject;
  existingMcq?: MCQ;
}

export default function QuestionEditorClient({ mode, subject, existingMcq }: Props) {
  const router = useRouter();
  
  const [stem, setStem] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [options, setOptions] = useState([
    { id: 'A', label: 'A', text: '' },
    { id: 'B', label: 'B', text: '' },
    { id: 'C', label: 'C', text: '' },
    { id: 'D', label: 'D', text: '' },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [explanation, setExplanation] = useState('');

  const [showCategorySelect, setShowCategorySelect] = useState(true);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && existingMcq) {
      setStem(existingMcq.questionStem);
      setCategoryName(existingMcq.categoryName);
      setOptions([
        { id: 'A', label: 'A', text: existingMcq.optionA },
        { id: 'B', label: 'B', text: existingMcq.optionB },
        { id: 'C', label: 'C', text: existingMcq.optionC },
        { id: 'D', label: 'D', text: existingMcq.optionD },
      ]);
      setCorrectAnswer(existingMcq.answer.toUpperCase());
      setExplanation(existingMcq.explanation || '');
    } else {
      setCategoryName(subject.categories.length > 0 ? subject.categories[0].categoryName : 'General');
    }
  }, [mode, existingMcq, subject]);

  const handleOptionTextChange = (id: string, value: string) => {
    setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, text: value } : opt));
  };

  const handleCreateCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCategoryInput.trim()) return;
    
    // We can directly set it, backend handles creating it if it doesn't exist
    setCategoryName(customCategoryInput.trim());
    setCustomCategoryInput('');
    setShowCategorySelect(true);
  };

  const showError = (message: string) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 5000);
  };

  const handleSaveSubmit = async () => {
    if (!stem.trim()) {
      showError("Question stem is required.");
      return;
    }

    const incompleteOptions = options.filter(o => !o.text.trim());
    if (incompleteOptions.length > 0) {
      showError(`Please fill in all options (currently incomplete: ${incompleteOptions.map(o=>o.label).join(', ')}).`);
      return;
    }

    const mcqData = {
      subjectId: subject.id,
      questionStem: stem,
      optionA: options[0].text,
      optionB: options[1].text,
      optionC: options[2].text,
      optionD: options[3].text,
      answer: correctAnswer,
      explanation: explanation || undefined,
      categoryName
    };

    if (mode === 'add') {
      await createMcq(mcqData);
    } else if (existingMcq) {
      await updateMcq(existingMcq.id, mcqData);
    }

    router.push(`/subject/${subject.id}`);
  };

  const handleCancel = () => {
    router.push(`/subject/${subject.id}`);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-app-bg relative">
      {errorToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg flex items-center justify-between min-w-[300px]">
          <span className="font-sans text-sm">{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="ml-4 hover:opacity-75 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="h-16 border-b border-lumina-border bg-lumina-surface px-8 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 rounded-md hover:bg-lumina-container-lowest text-lumina-secondary hover:text-lumina-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="font-sans font-semibold text-lg text-lumina-text">
              {mode === 'edit' ? `Edit MCQ` : 'Add New MCQ'}
            </h3>
            <p className="text-[10px] font-mono text-lumina-text-muted tracking-wide uppercase">
              {subject.subjectName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="py-2 px-4 rounded text-sm font-sans font-semibold text-lumina-secondary hover:text-lumina-primary hover:bg-lumina-container-lowest transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSubmit}
            className="py-2 px-5 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary rounded text-sm font-sans font-semibold transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Check size={16} />
            <span>Save Question</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Editorial Form (7 parts width) */}
        <div className="w-7/12 border-r border-lumina-border p-6 overflow-y-auto space-y-6">
          
          <div className="bg-lumina-container-low border border-lumina-border p-4 rounded-lg">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono tracking-wider uppercase text-lumina-text-muted font-bold block">
                  Category Topic
                </label>
                
                <button
                  type="button"
                  onClick={() => setShowCategorySelect(!showCategorySelect)}
                  className="text-[10px] font-sans font-medium text-lumina-primary hover:underline cursor-pointer"
                >
                  {showCategorySelect ? 'Create Custom' : 'Select Existing'}
                </button>
              </div>

              {showCategorySelect ? (
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full py-2 px-3 rounded bg-lumina-container-lowest border border-lumina-border text-sm text-lumina-text focus:outline-none focus:border-lumina-primary transition-all font-sans"
                >
                  {subject.categories.map((cat) => (
                    <option key={cat.id} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                  {!subject.categories.some(c => c.categoryName === categoryName) && categoryName !== '' && (
                    <option value={categoryName}>{categoryName}</option>
                  )}
                </select>
              ) : (
                <form onSubmit={handleCreateCustomCategory} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="New category..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="flex-1 py-1.5 px-3 rounded bg-lumina-container-lowest border border-lumina-border text-sm text-lumina-text focus:outline-none focus:border-lumina-primary"
                  />
                  <button
                    type="submit"
                    className="py-1.5 px-3 rounded bg-lumina-primary text-lumina-on-primary font-sans font-semibold text-xs transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="bg-lumina-container-low border border-lumina-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2 select-none">
              <label className="text-[10px] font-mono tracking-wider uppercase text-lumina-text-muted font-bold">
                Question Stem
              </label>
              <span className="text-xs text-lumina-text-muted font-mono">
                {stem.length} chars
              </span>
            </div>

            <textarea
              rows={4}
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder="Enter your MCQ stem here."
              className="w-full py-3 px-4 bg-lumina-container-lowest border border-lumina-border rounded text-sm text-lumina-text focus:outline-none focus:border-lumina-primary transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          <div className="bg-lumina-container-low border border-lumina-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 select-none">
              <div>
                <label className="text-[10px] font-mono tracking-wider uppercase text-lumina-text-muted font-bold block">
                  Options & Correct Answer
                </label>
                <span className="text-[10px] text-emerald-700 font-sans mt-0.5 block">
                  Select correct answer(s) on the left
                </span>
              </div>
            </div>

            <div className="space-y-3.5">
              {options.map((opt) => {
                const isCorrect = correctAnswer === opt.id;
                return (
                  <div 
                    key={opt.id}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors ${
                      isCorrect 
                        ? 'bg-lumina-primary/5 border-lumina-primary' 
                        : 'bg-lumina-container-lowest border-lumina-border'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(opt.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                        isCorrect
                          ? 'bg-lumina-primary border-lumina-primary text-lumina-on-primary shadow-xs'
                          : 'border-lumina-border text-lumina-text-muted bg-lumina-container hover:border-lumina-primary'
                      }`}
                    >
                      {isCorrect ? (
                        <Check size={13} strokeWidth={3} />
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-lumina-text-muted/60">{opt.label}</span>
                      )}
                    </button>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                        placeholder="Enter option content..."
                        className="w-full bg-transparent border-none text-sm text-lumina-text focus:outline-none font-sans"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-lumina-container-low border border-lumina-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[10px] font-mono tracking-wider uppercase text-lumina-text-muted font-bold block">
                Explanation (Optional)
              </label>
            </div>

            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why the correct answer is right and why other options represent common student misconceptions..."
              className="w-full py-3 px-4 bg-lumina-container-lowest border border-lumina-border rounded text-sm text-lumina-text focus:outline-none focus:border-lumina-primary transition-all font-sans leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Right Side: LIVE STUDENT PREVIEW (5 parts width) */}
        <div className="w-5/12 bg-lumina-container-lowest border-l border-lumina-border p-8 overflow-y-auto flex flex-col justify-between select-none relative">
          
          <div className="absolute inset-0 bg-[radial-gradient(rgba(26,26,26,0.06)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-lumina-primary">
              <Eye size={14} />
              <span className="tracking-widest uppercase font-bold">Live Preview</span>
            </div>

            <div className="bg-lumina-container border border-lumina-border rounded-xl shadow-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] font-bold text-lumina-text-muted uppercase">
                  PREVIEW
                </span>
              </div>

              <h4 
                className="font-sans text-base text-lumina-text font-medium leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: formatLaTeX(stem || 'Enter question stem details inside the editor pane...') }}
              />

              <div className="space-y-3">
                {options.map((opt) => {
                  const hasText = opt.text.trim().length > 0;
                  const isChecked = previewSelectedId === opt.id;
                  const isActuallyCorrect = correctAnswer === opt.id;

                  return (
                    <button
                      key={opt.id}
                      disabled={!hasText}
                      onClick={() => setPreviewSelectedId(opt.id)}
                      className={`w-full text-left p-4 rounded-md border flex items-start gap-3.5 transition-all cursor-pointer ${
                        isChecked
                          ? isActuallyCorrect
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                            : 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                          : 'bg-lumina-surface hover:bg-lumina-container-lowest border-lumina-border text-lumina-text hover:text-lumina-primary'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-mono font-bold ${
                        isChecked
                          ? isActuallyCorrect
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-rose-500 border-rose-500 text-white'
                          : 'border-lumina-border text-lumina-text-muted bg-lumina-container-lowest'
                      }`}>
                        {isChecked ? (isActuallyCorrect ? '✓' : '✗') : opt.label}
                      </div>

                      <span 
                        className="font-sans text-xs md:text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatLaTeX(opt.text || `Draft Option ${opt.label}...`) }}
                      />
                    </button>
                  );
                })}
              </div>

              {previewSelectedId && (
                <div className="mt-6 pt-5 border-t border-lumina-border space-y-3 animate-fadeIn">
                  <div className={`flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    correctAnswer === previewSelectedId ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {correctAnswer === previewSelectedId ? (
                      <span>Correct choice!</span>
                    ) : (
                      <span>Incorrect choice</span>
                    )}
                  </div>
                  
                  {explanation && (
                    <div className="p-3.5 rounded bg-lumina-surface border border-lumina-border text-xs text-lumina-text-variant leading-relaxed">
                      <p dangerouslySetInnerHTML={{ __html: formatLaTeX(explanation) }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
