import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Bold, 
  Italic, 
  Image as ImageIcon, 
  Check, 
  X, 
  RefreshCw, 
  Eye,
  Settings,
  HelpCircle,
  Plus,
  Compass
} from 'lucide-react';
import { MCQQuestion, Subject, Category, MCQOption } from '../types';
import { generateId, formatLaTeX } from '../utils';

interface QuestionEditorProps {
  mode: 'add' | 'edit';
  editingQuestionId: string | null;
  selectedSubject: Subject | null;
  categories: Category[];
  mcqs: MCQQuestion[];
  onSave: (question: MCQQuestion) => void;
  onCancel: () => void;
  onAddCategory: (name: string) => void;
}

export default function QuestionEditor({
  mode,
  editingQuestionId,
  selectedSubject,
  categories,
  mcqs,
  onSave,
  onCancel,
  onAddCategory,
}: QuestionEditorProps) {
  const currentSubjectId = selectedSubject?.id || 'sub-1';
  const classroomLevel = selectedSubject?.classroomLevel || 'O Level';

  // Find question if in edit mode
  const existingQuestion = mode === 'edit' 
    ? mcqs.find(q => q.id === editingQuestionId) 
    : null;

  // Form states
  const [stem, setStem] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [options, setOptions] = useState<MCQOption[]>([
    { id: 'opt-a', label: 'A', text: '' },
    { id: 'opt-b', label: 'B', text: '' },
    { id: 'opt-c', label: 'C', text: '' },
    { id: 'opt-d', label: 'D', text: '' },
  ]);
  const [correctAnswerIds, setCorrectAnswerIds] = useState<string[]>([]);
  const [explanation, setExplanation] = useState('');

  // UI States
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiActionType, setAiActionType] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [showCategorySelect, setShowCategorySelect] = useState(true);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Interactive student preview answer selection (purely client-side preview)
  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null);

  // Load existing question values if editing
  useEffect(() => {
    if (mode === 'edit' && existingQuestion) {
      setStem(existingQuestion.stem);
      setCategory(existingQuestion.category);
      setDifficulty(existingQuestion.difficulty);
      setOptions(JSON.parse(JSON.stringify(existingQuestion.options)));
      setCorrectAnswerIds(existingQuestion.correctAnswerIds);
      setExplanation(existingQuestion.explanation);
    } else {
      // Default initial states for add mode
      setStem('');
      setCategory(categories.find(c => c.subjectId === currentSubjectId)?.name || 'General');
      setDifficulty('Medium');
      setOptions([
        { id: 'opt-a', label: 'A', text: '' },
        { id: 'opt-b', label: 'B', text: '' },
        { id: 'opt-c', label: 'C', text: '' },
        { id: 'opt-d', label: 'D', text: '' },
      ]);
      setCorrectAnswerIds(['opt-a']); // Default correct is A
      setExplanation('');
    }
    setPreviewSelectedId(null);
  }, [mode, editingQuestionId, existingQuestion, currentSubjectId, categories]);

  // Check if server-side Gemini is available
  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => setAiConfigured(data.configured))
      .catch(() => setAiConfigured(false));
  }, []);

  const handleOptionTextChange = (id: string, value: string) => {
    setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, text: value } : opt));
  };

  const toggleOptionCorrect = (id: string) => {
    // For general tutor MCQs, single choice is default, but support setting correct answer
    setCorrectAnswerIds([id]);
  };

  const handleInsertLaTeX = (symbol: string) => {
    // Inserts a symbol at the cursor location of the question stem
    setStem(prev => prev + symbol);
  };

  // AI Service Calls
  const handleAIPolishQuestion = async () => {
    if (!stem.trim()) {
      alert("Please enter a basic question stem first. The AI will polish it and inject LaTeX math syntax.");
      return;
    }

    setLoadingAI(true);
    setAiActionType('polish');
    try {
      const response = await fetch('/api/ai/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject?.name,
          category,
          difficulty,
          level: classroomLevel,
          stemPrompt: stem, // custom hint
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      if (data.stem) {
        setStem(data.stem);
        // If options are empty, hydrate them too!
        if (data.options && data.options.length === 4) {
          setOptions(options.map((opt, i) => ({
            ...opt,
            text: data.options[i].text
          })));
          
          // Align correct answer label
          const correctLabel = data.correctOptionLabel || 'A';
          const matchOpt = options.find((_, i) => ['A', 'B', 'C', 'D'][i] === correctLabel) || options[0];
          setCorrectAnswerIds([matchOpt.id]);
        }
        if (data.explanation) {
          setExplanation(data.explanation);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("AI Polish failed. Fallback: Check if GEMINI_API_KEY is configured under Settings > Secrets.");
    } finally {
      setLoadingAI(false);
      setAiActionType(null);
    }
  };

  const handleAIGenerateDistractors = async () => {
    // Find correct option text
    const correctOpt = options.find(o => correctAnswerIds.includes(o.id));
    if (!stem.trim() || !correctOpt || !correctOpt.text.trim()) {
      alert("Please provide a question stem and enter the text for the correct Option (marked in blue) first.");
      return;
    }

    setLoadingAI(true);
    setAiActionType('distractors');
    try {
      const response = await fetch('/api/ai/distractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem,
          correctAnswer: correctOpt.text,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      if (data.distractors && data.distractors.length >= 3) {
        // We populate the OTHER options with the generated distractors
        const updatedOptions = [...options];
        let distractorIdx = 0;
        
        updatedOptions.forEach((opt) => {
          if (!correctAnswerIds.includes(opt.id) && distractorIdx < 3) {
            opt.text = data.distractors[distractorIdx].text;
            distractorIdx++;
          }
        });

        setOptions(updatedOptions);
        
        // Append distractor rationales to explanation
        let extraRationales = "\n\nMisconception analysis:\n";
        data.distractors.forEach((d: any, idx: number) => {
          extraRationales += `- Option ${['B','C','D','A'][idx]}: Plausible because ${d.misconceptionRationale}\n`;
        });
        setExplanation(prev => prev + extraRationales);
      }
    } catch (err: any) {
      console.error(err);
      alert("Distractor Generation failed. Check your API key setup.");
    } finally {
      setLoadingAI(false);
      setAiActionType(null);
    }
  };

  const handleAIGenerateExplanation = async () => {
    const correctOpt = options.find(o => correctAnswerIds.includes(o.id));
    if (!stem.trim() || !correctOpt || !correctOpt.text.trim()) {
      alert("Please provide a question stem and a correct answer before generating the explanation.");
      return;
    }

    setLoadingAI(true);
    setAiActionType('explanation');
    try {
      const response = await fetch('/api/ai/explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem,
          options: options.map(o => `${o.label}: ${o.text}`),
          correctAnswer: correctOpt.text,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      if (data.explanation) {
        setExplanation(data.explanation);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to write explanation. Try checking your API key.");
    } finally {
      setLoadingAI(false);
      setAiActionType(null);
    }
  };

  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCategoryInput.trim()) return;
    onAddCategory(customCategoryInput.trim());
    setCategory(customCategoryInput.trim());
    setCustomCategoryInput('');
    setShowCategorySelect(true);
  };

  const showError = (message: string) => {
    setErrorToast(message);
    setTimeout(() => {
      setErrorToast(null);
    }, 5000);
  };

  const handleSaveSubmit = () => {
    if (!stem.trim()) {
      showError("Question stem is required.");
      return;
    }

    const correctOpt = options.find(o => correctAnswerIds.includes(o.id));
    if (!correctOpt || !correctOpt.text.trim()) {
      showError("Please check that your correct option contains valid text.");
      return;
    }

    const incompleteOptions = options.filter(o => !o.text.trim());
    if (incompleteOptions.length > 0) {
      showError(`Please fill in all options (currently incomplete: ${incompleteOptions.map(o=>o.label).join(', ')}).`);
      return;
    }

    const savedMCQ: MCQQuestion = {
      id: mode === 'edit' && existingQuestion ? existingQuestion.id : generateId('q'),
      subjectId: currentSubjectId,
      classroomLevel,
      category,
      difficulty,
      stem,
      options,
      correctAnswerIds,
      explanation,
      createdAt: new Date().toISOString(),
    };

    onSave(savedMCQ);
  };

  // Filter categories by subject
  const subjectCategories = categories.filter(cat => cat.subjectId === '' || cat.subjectId === currentSubjectId);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-app-bg relative">
      {/* Toast Notification */}
      {errorToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg flex items-center justify-between min-w-[300px]">
          <span className="font-sans text-sm">{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="ml-4 hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Dynamic Header (Custom Navigation) */}
      <div className="h-16 border-b border-lumina-border bg-lumina-surface px-8 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 rounded-md hover:bg-lumina-container-lowest text-lumina-secondary hover:text-lumina-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 className="font-sans font-semibold text-lg text-lumina-text">
              {mode === 'edit' ? `Edit Question #${existingQuestion?.id || '4092'}` : 'Add New MCQ'}
            </h3>
            <p className="text-[10px] font-mono text-lumina-text-muted tracking-wide uppercase">
              {selectedSubject?.name || 'Mathematics'} &bull; {classroomLevel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
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

      {/* Main Workspace split into 7:5 ratio */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Editorial Form (7 parts width) */}
        <div className="w-7/12 border-r border-lumina-border p-6 overflow-y-auto space-y-6">
          
          {/* Top category control */}
          <div className="bg-lumina-container-low border border-lumina-border p-4 rounded-lg">
            
            {/* Category Select */}
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-2 px-3 rounded bg-lumina-container-lowest border border-lumina-border text-sm text-lumina-text focus:outline-none focus:border-lumina-primary transition-all font-sans"
                >
                  {subjectCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name === 'All Categories' ? 'General Subject Matter' : cat.name}
                    </option>
                  ))}
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

          {/* Question Stem Area */}
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

          {/* Options & Correct Answer block */}
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

            {/* Option Input Fields */}
            <div className="space-y-3.5">
              {options.map((opt) => {
                const isCorrect = correctAnswerIds.includes(opt.id);
                return (
                  <div 
                    key={opt.id}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border transition-colors ${
                      isCorrect 
                        ? 'bg-lumina-primary/5 border-lumina-primary' 
                        : 'bg-lumina-container-lowest border-lumina-border'
                    }`}
                  >
                    {/* Circle check trigger on the left (Matches screenshot 3) */}
                    <button
                      type="button"
                      onClick={() => toggleOptionCorrect(opt.id)}
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

          {/* Explanation rationale block */}
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
          
          {/* Featured Grid Matrix Background overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(26,26,26,0.06)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-lumina-primary">
              <Eye size={14} />
              <span className="tracking-widest uppercase font-bold">Live Preview</span>
            </div>

            {/* High-fidelity Student Question Card (Matches screenshot 3 style) */}
            <div className="bg-lumina-container border border-lumina-border rounded-xl shadow-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] font-bold text-lumina-text-muted uppercase">
                  Q. 12
                </span>
              </div>

              {/* Live formatted question stem */}
              <h4 
                className="font-sans text-base text-lumina-text font-medium leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: formatLaTeX(stem || 'Enter question stem details inside the editor pane...') }}
              />

              {/* Interactive preview options list */}
              <div className="space-y-3">
                {options.map((opt) => {
                  const hasText = opt.text.trim().length > 0;
                  const isChecked = previewSelectedId === opt.id;
                  const isActuallyCorrect = correctAnswerIds.includes(opt.id);

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
                      {/* Checkbox circle indicator */}
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

              {/* Instant pedagogical explanation feedback once student answers! */}
              {previewSelectedId && (
                <div className="mt-6 pt-5 border-t border-lumina-border space-y-3 animate-fadeIn">
                  <div className={`flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    correctAnswerIds.includes(previewSelectedId) ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {correctAnswerIds.includes(previewSelectedId) ? (
                      <>
                        <span>Correct choice!</span>
                      </>
                    ) : (
                      <>
                        <span>Incorrect choice</span>
                      </>
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

          {/* Spacer */}
          <div className="mt-8" />
        </div>
        
      </div>
    </div>
  );
}
