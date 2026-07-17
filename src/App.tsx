import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ClassroomSelection from './components/ClassroomSelection';
import SubjectSelection from './components/SubjectSelection';
import QuestionBank from './components/QuestionBank';
import QuestionEditor from './components/QuestionEditor';
import { Classroom, Subject, MCQQuestion, Category } from './types';
import { initialClassrooms, initialSubjects, initialCategories, initialMCQs } from './mockData';

export type ActiveView = 'dashboard' | 'subjects' | 'question_bank' | 'edit_question' | 'add_question';

export default function App() {
  // State from LocalStorage with mock fallbacks
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem('lumina_classrooms');
    return saved ? JSON.parse(saved) : initialClassrooms;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('lumina_subjects');
    return saved ? JSON.parse(saved) : initialSubjects;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('lumina_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [mcqs, setMcqs] = useState<MCQQuestion[]>(() => {
    const saved = localStorage.getItem('lumina_mcqs');
    return saved ? JSON.parse(saved) : initialMCQs;
  });

  const [selectedMCQIds, setSelectedMCQIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('lumina_selected_mcq_ids');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation and filtering states
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist edits back to LocalStorage
  useEffect(() => {
    localStorage.setItem('lumina_classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem('lumina_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('lumina_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('lumina_mcqs', JSON.stringify(mcqs));
  }, [mcqs]);

  useEffect(() => {
    localStorage.setItem('lumina_selected_mcq_ids', JSON.stringify(selectedMCQIds));
  }, [selectedMCQIds]);

  // Adjust subject counts based on questions list
  useEffect(() => {
    setSubjects(prev => prev.map(sub => {
      const count = mcqs.filter(q => q.subjectId === sub.id).length;
      return { ...sub, mcqsCount: count };
    }));
  }, [mcqs]);

  // Handle classroom modifications
  const handleAddClassroom = (newClass: Omit<Classroom, 'id'>) => {
    const freshClass: Classroom = {
      ...newClass,
      id: `class-${Date.now()}`
    };
    setClassrooms(prev => [freshClass, ...prev]);
  };

  const handleUpdateClassroomStatus = (id: string, status: 'Active' | 'Paused' | 'Archived') => {
    setClassrooms(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleDeleteClassroom = (id: string) => {
    setClassrooms(prev => prev.filter(c => c.id !== id));
    if (selectedClassroom?.id === id) {
      setSelectedClassroom(null);
      setCurrentView('dashboard');
    }
  };

  // Handle subject modifications
  const handleAddSubject = (newSub: Omit<Subject, 'id'>) => {
    const freshSub: Subject = {
      ...newSub,
      id: `sub-${Date.now()}`
    };
    setSubjects(prev => [...prev, freshSub]);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    if (selectedSubject?.id === id) {
      setSelectedSubject(null);
      setCurrentView('subjects');
    }
  };

  // Handle category additions
  const handleAddCategory = (name: string) => {
    // Only add if not already exists for this subject
    const subjectId = selectedSubject?.id || 'sub-1';
    const exists = categories.some(cat => cat.name.toLowerCase() === name.toLowerCase() && cat.subjectId === subjectId);
    if (exists) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      subjectId
    };
    setCategories(prev => [...prev, newCat]);
  };

  // Handle MCQ modifications (Save / Update)
  const handleSaveQuestion = (savedQuestion: MCQQuestion) => {
    const exists = mcqs.some(q => q.id === savedQuestion.id);
    if (exists) {
      setMcqs(prev => prev.map(q => q.id === savedQuestion.id ? savedQuestion : q));
    } else {
      setMcqs(prev => [savedQuestion, ...prev]);
    }
    
    // Reset view
    setEditingQuestionId(null);
    setCurrentView('question_bank');
  };

  const handleDeleteMCQ = (id: string) => {
    setMcqs(prev => prev.filter(q => q.id !== id));
  };

  // Helper trigger from Sidebar / Actions
  const handleCreateNewMCQTrigger = () => {
    // If no subject is selected, default to the first available subject
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
    setEditingQuestionId(null);
    setCurrentView('add_question');
  };

  return (
    <div className="flex bg-app-bg text-lumina-text h-screen overflow-hidden font-sans">
      
      {/* 1. Brand Sidebar */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'dashboard') {
            setSelectedClassroom(null);
            setSelectedSubject(null);
          } else if (view === 'question_bank' && !selectedSubject) {
            setSelectedSubject(subjects[0] || null);
          } else if (view === 'subjects' && !selectedClassroom) {
            setSelectedClassroom(classrooms[0] || null);
          }
          setCurrentView(view);
        }}
        onCreateNewMCQ={handleCreateNewMCQTrigger}
      />

      {/* 2. Main Workstage Layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header Controls (Hide in fullscreen editor mode to match screenshot 5) */}
        {currentView !== 'edit_question' && currentView !== 'add_question' && (
          <Header 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* Dynamic View Swapper */}
        <main className="flex-1 overflow-hidden flex flex-col bg-app-bg">
          {currentView === 'dashboard' && (
            <ClassroomSelection
              classrooms={classrooms}
              subjects={subjects}
              onSelectClassroom={(classroom) => {
                setSelectedClassroom(classroom);
                setCurrentView('subjects');
              }}
              onAddClassroom={handleAddClassroom}
              onUpdateStatus={handleUpdateClassroomStatus}
              onDeleteClassroom={handleDeleteClassroom}
            />
          )}

          {currentView === 'subjects' && (
            <SubjectSelection
              selectedClassroom={selectedClassroom}
              subjects={subjects.filter(s => s.classroomLevel === (selectedClassroom?.level || 'O Level'))}
              onSelectSubject={(subject) => {
                setSelectedSubject(subject);
                setCurrentView('question_bank');
              }}
              onAddSubject={handleAddSubject}
              onDeleteSubject={handleDeleteSubject}
              onBackToClassrooms={() => {
                setSelectedClassroom(null);
                setCurrentView('dashboard');
              }}
            />
          )}

          {currentView === 'question_bank' && (
            <QuestionBank
              selectedSubject={selectedSubject}
              categories={categories}
              mcqs={mcqs}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedMCQIds={selectedMCQIds}
              setSelectedMCQIds={setSelectedMCQIds}
              onSelectMCQForEdit={(id) => {
                setEditingQuestionId(id);
                setCurrentView('edit_question');
              }}
              onDeleteMCQ={handleDeleteMCQ}
              onAddNewMCQClick={handleCreateNewMCQTrigger}
              onBackToSubjects={() => {
                setSelectedSubject(null);
                setCurrentView('subjects');
              }}
            />
          )}

          {(currentView === 'edit_question' || currentView === 'add_question') && (
            <QuestionEditor
              mode={currentView === 'edit_question' ? 'edit' : 'add'}
              editingQuestionId={editingQuestionId}
              selectedSubject={selectedSubject}
              categories={categories}
              mcqs={mcqs}
              onSave={handleSaveQuestion}
              onCancel={() => {
                setEditingQuestionId(null);
                setCurrentView('question_bank');
              }}
              onAddCategory={handleAddCategory}
            />
          )}
        </main>
      </div>
    </div>
  );
}
